const rulesConfig = require('./server/config/rules.config.json');
const mappingConfig = require('./server/config/mapping.config.json');
const rotationHistory = require('./server/services/RotationHistoryService');

class RuleEngine {
  constructor() {
    this.rules = rulesConfig;
    this.mapping = mappingConfig;
    this.history = rotationHistory;
    this.fixedAgents = rulesConfig.fixedAgents || [];
  }

  analyzeDay(assignments) {
    const alerts = [];
    const { coverageBySite, coverageByStatus } = this._calculateCoverage(assignments);

    Object.keys(this.rules.coverage.sites).forEach(siteName => {
      const siteRule = this.rules.coverage.sites[siteName];
      const currentCount = coverageBySite[siteName] || 0;

      if (currentCount < siteRule.min) {
        alerts.push({
          type: 'CRITICAL_COVERAGE',
          message: `Coverage for ${siteName} is below minimum (${currentCount}/${siteRule.min}).`,
          site: siteName,
          severity: 'high'
        });
      } else if (currentCount < siteRule.target) {
        alerts.push({
          type: 'WARNING_COVERAGE',
          message: `Coverage for ${siteName} is between minimum and target (${currentCount}/${siteRule.target}).`,
          site: siteName,
          severity: 'medium'
        });
      }
    });

    const assignmentsOnBreak = assignments.filter(a => this._isBreakStatus(a.status));
    const breaksBySite = {};
    assignmentsOnBreak.forEach(a => {
      if (a.site) {
        breaksBySite[a.site] = (breaksBySite[a.site] || 0) + 1;
      }
    });

    Object.keys(breaksBySite).forEach(siteName => {
      const totalAtSite = coverageBySite[siteName] || 0;
      const breaksAtSite = breaksBySite[siteName];
      const remaining = totalAtSite - breaksAtSite;
      if (remaining < this.rules.breaks.minStaffOnSite) {
        alerts.push({
          type: 'BREAK_COVERAGE',
          message: `Site ${siteName} loses critical coverage while agents are on break.`,
          site: siteName,
          severity: 'medium'
        });
      }
    });

    const missionAgents = assignments.filter(a => a.status === 'Mission');
    const sickAgents = assignments.filter(a => this._isSickStatus(a.status));
    const tardyAgents = assignments.filter(a => this._isTardyStatus(a.status));

    return {
      coverage: {
        bySite: coverageBySite,
        byStatus: coverageByStatus
      },
      alerts,
      missionAgents,
      sickAgents,
      tardyAgents
    };
  }

  _calculateCoverage(assignments) {
    const bySite = {};
    const byStatus = {};

    assignments.forEach(a => {
      if (!a.site || !a.status || a.status === 'OFF') return;

      bySite[a.site] = (bySite[a.site] || 0) + 1;
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });

    return { coverageBySite: bySite, coverageByStatus: byStatus };
  }

  validateMove(currentAssignments, { sourceSite, sourceAgent, targetSite, targetAgent }) {
    const warnings = [];

    if (sourceSite) {
      const siteRule = this.rules.coverage.sites[sourceSite];
      if (siteRule) {
        const currentCount = currentAssignments.filter(a => a.site === sourceSite).length;
        if (currentCount <= siteRule.min) {
          warnings.push(`Removing an assignment from ${sourceSite} will drop below its minimum (${siteRule.min}).`);
        }
      }
    }

    if (targetAgent && targetSite) {
      if (this.fixedAgents.includes(targetAgent)) {
        warnings.push(`Agent ${targetAgent} is marked as fixed and should remain at their current site.`);
      }

      const lookbackWeeks = (this.rules.rotation?.lookbackWeeks || 2);
      const lookbackDays = Math.max(1, lookbackWeeks) * 7;
      const recentSites = this.history.recentSites(targetAgent, lookbackDays);
      if (recentSites.includes(targetSite)) {
        warnings.push(`Agent ${targetAgent} already covered ${targetSite} within the last ${lookbackWeeks} weeks.`);
      }
    }

    return { valid: warnings.length === 0, warnings };
  }

  _isBreakStatus(status) {
    return ['Break', 'Pause'].includes(status);
  }

  _isSickStatus(status) {
    return ['Maladie', 'Sick', 'Sick Leave', 'Illness'].includes(status);
  }

  _isTardyStatus(status) {
    return ['Tardiness', 'Late', 'Delayed'].includes(status);
  }
}

module.exports = new RuleEngine();
