const planningService = require('./PlanningService');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class ReportService {
  constructor() {
    this.auditLogPath = path.join(__dirname, '../data/audit.log.jsonl');
  }

  /**
   * Aggregates all metrics for the dashboard in a single pass.
   */
  async getDashboardStats(dateStr) {
    // Fetch current planning state (assuming getManagerView returns full month data)
    const plan = await planningService.getManagerView();
    const targetDate = new Date(dateStr);

    return {
      heatmap: this.calculateHeatmap(plan, targetDate),
      absences: this.calculateAbsences(plan),
      stability: await this.calculateStabilityMetrics(),
      returns: this.calculateUpcomingReturns(plan, targetDate)
    };
  }

  /**
   * Generates a Site vs Hour matrix of agent counts.
   */
  calculateHeatmap(plan, date) {
    const matrix = {}; // { "SiteName": { "08:00": 5, "09:00": 4... } }
    
    // Initialize structure would happen here based on config, 
    // for now we build dynamically based on assignments
    
    plan.agents.forEach(agent => {
      // Simplified: assuming agent.week contains day objects with 'hours'
      // In a real implementation, we'd match the specific date column
      const dayData = agent.week.find(d => d.date === date.toISOString().split('T')[0]);
      
      if (dayData && dayData.site && dayData.status === 'Present') {
        if (!matrix[dayData.site]) matrix[dayData.site] = {};
        
        // Assuming standard shift 09:00-18:00 for MVP visualization
        // Real implementation would parse start/end times
        const startHour = parseInt(dayData.startTime?.split(':')[0] || 9);
        const endHour = parseInt(dayData.endTime?.split(':')[0] || 18);

        for (let h = startHour; h < endHour; h++) {
          const timeSlot = `${h.toString().padStart(2, '0')}:00`;
          matrix[dayData.site][timeSlot] = (matrix[dayData.site][timeSlot] || 0) + 1;
        }
      }
    });

    return matrix;
  }

  calculateAbsences(plan) {
    const counts = { 'Sick': 0, 'Vacation': 0, 'Mission': 0, 'Other': 0 };
    
    plan.agents.forEach(agent => {
      // Counting total absences in the view (e.g., current week/month)
      agent.week.forEach(day => {
        if (day.status === 'Sick') counts['Sick']++;
        else if (day.status === 'Holiday') counts['Vacation']++;
        else if (day.status === 'Mission') counts['Mission']++;
        else if (['Absence', 'Training'].includes(day.status)) counts['Other']++;
      });
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }

  async calculateStabilityMetrics() {
    // Reads audit log to compare manual overrides vs total actions
    const stats = { manual: 0, scheduled: 0, history: [] };
    
    if (!fs.existsSync(this.auditLogPath)) return stats;

    const fileStream = fs.createReadStream(this.auditLogPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      try {
        const log = JSON.parse(line);
        // Simple heuristic: BATCH is scheduled, MOVE/UPDATE is manual
        if (log.action === 'BATCH') stats.scheduled++;
        else stats.manual++;
      } catch (e) { /* ignore corrupt lines */ }
    }

    return stats;
  }

  calculateUpcomingReturns(plan, today) {
    const returns = [];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    plan.agents.forEach(agent => {
      const todayDay = agent.week.find(d => d.date === todayStr);
      const tomorrowDay = agent.week.find(d => d.date === tomorrowStr);

      // Logic: Was absent today, present tomorrow
      if (todayDay && ['Sick', 'Holiday'].includes(todayDay.status) && 
          tomorrowDay && tomorrowDay.status === 'Present') {
        returns.push({
          name: agent.name,
          date: 'Tomorrow',
          from: todayDay.status
        });
      }
    });

    return returns;
  }

  async generateCSVStream(res) {
    if (!fs.existsSync(this.auditLogPath)) return res.end();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_log.csv"');
    
    res.write('Timestamp,User,Action,Details,OverrideReason\n');

    const fileStream = fs.createReadStream(this.auditLogPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      try {
        const log = JSON.parse(line);
        const row = [
          log.timestamp,
          log.user,
          log.action,
          `"${JSON.stringify(log.details).replace(/"/g, '""')}"`, // Escape CSV
          log.override || ''
        ].join(',');
        res.write(row + '\n');
      } catch (e) {}
    }
    res.end();
  }
}

module.exports = new ReportService();