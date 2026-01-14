const path = require('path');
const fs = require('fs');
const mapping = require(path.join(process.cwd(), 'server/config/mapping.config.json'));

class RuleEngine {
  constructor() {
    this.configPath = path.join(process.cwd(), 'server/config/rules.config.json');
    this.rules = this.loadRules();
  }

  loadRules() {
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading rules config:', error);
      return { sites: {}, breaks: {} };
    }
  }

  /**
   * Calcula el estado de cobertura para un día específico.
   * @param {Array} assignments - Lista de asignaciones del ExcelService
   */
  analyzeCoverage(assignments) {
    const siteCounts = {};
    
    // 1. Contar agentes por sitio
    assignments.forEach(a => {
      if (a.site && a.status === 'Present') {
        siteCounts[a.site] = (siteCounts[a.site] || 0) + 1;
      }
    });

    const coverageReport = [];
    
    // 2. Comparar con reglas
    for (const [siteName, rule] of Object.entries(this.rules.sites)) {
      const current = siteCounts[siteName] || 0;
      let status = 'OK';
      
      if (current < rule.min) {
        status = 'CRITICAL';
      } else if (current < rule.target) {
        status = 'WARNING';
      }

      coverageReport.push({
        site: siteName,
        current,
        min: rule.min,
        target: rule.target,
        status
      });
    }

    return coverageReport;
  }

  /**
   * Detecta ventanas de tiempo donde las pausas simultáneas rompen la cobertura.
   * Usa horarios reales (si existen) o defaults configurados.
   */
  analyzeBreakConflicts(assignments) {
    const alerts = [];
    const { breaks: breakRules } = this.rules;
    const { standardShift } = mapping;
    
    // Configuración de ventana de chequeo (default 11:00 - 15:00)
    const checkStartStr = breakRules.checkWindowStart || "11:00";
    const checkEndStr = breakRules.checkWindowEnd || "15:00";
    const checkStart = this._timeToMinutes(checkStartStr);
    const checkEnd = this._timeToMinutes(checkEndStr);
    
    // Agrupar por sitio
    const agentsBySite = {};
    assignments.forEach(a => {
      if (a.site && a.status === 'Present') {
        if (!agentsBySite[a.site]) agentsBySite[a.site] = [];
        agentsBySite[a.site].push(a);
      }
    });

    // Analizar cada sitio
    for (const [site, agents] of Object.entries(agentsBySite)) {
      const siteRule = this.rules.sites[site];
      if (!siteRule) continue;

      // Mínimo requerido durante pausas (puede ser menor al mínimo operativo normal)
      const minRequired = breakRules.minStaffOnSite ?? siteRule.min;

      // Chequear cada 15 minutos dentro de la ventana
      for (let time = checkStart; time < checkEnd; time += 15) {
        let availableAgents = 0;

        for (const agent of agents) {
          // 1. Si el agente tiene pausas explícitas
          let agentBreaks = agent.breaks; 
          
          // 2. Si no, usar default (asumimos el primero por seguridad/worst-case)
          if (!agentBreaks || agentBreaks.length === 0) {
             agentBreaks = standardShift.defaultBreaks.map(b => ({
               start: this._timeToMinutes(b.start),
               end: this._timeToMinutes(b.end)
             }));
             // Asumimos el primer break si no hay info, para detectar conflictos de "todos a la vez"
             if (agentBreaks.length > 0) agentBreaks = [agentBreaks[0]];
          } else {
             // Convertir pausas explícitas a minutos si vienen en string
             agentBreaks = agentBreaks.map(b => ({
               start: typeof b.start === 'string' ? this._timeToMinutes(b.start) : b.start,
               end: typeof b.end === 'string' ? this._timeToMinutes(b.end) : b.end
             }));
          }

          const isOnBreak = agentBreaks.some(b => time >= b.start && time < b.end);
          if (!isOnBreak) {
            availableAgents++;
          }
        }

        if (availableAgents < minRequired) {
          const timeStr = this._minutesToTime(time);
          // Evitar duplicados cercanos (mismo sitio, misma alerta, < 60 min de diferencia)
          const existingAlert = alerts.find(a => 
            a.site === site && 
            a.type === 'BREAK_COVERAGE' && 
            this._isTimeClose(a.time, timeStr)
          );

          if (!existingAlert) {
            alerts.push({
              type: 'BREAK_COVERAGE',
              severity: 'HIGH',
              site,
              time: timeStr,
              message: `Riesgo de cobertura en pausa (${timeStr}). Quedan ${availableAgents} agentes (Min: ${minRequired})`
            });
          }
        }
      }
    }

    return alerts;
  }

  _timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  _minutesToTime(minutes) {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  _isTimeClose(timeStr1, timeStr2) {
    const t1 = this._timeToMinutes(timeStr1);
    const t2 = this._timeToMinutes(timeStr2);
    return Math.abs(t1 - t2) < 60;
  }
}

module.exports = new RuleEngine();