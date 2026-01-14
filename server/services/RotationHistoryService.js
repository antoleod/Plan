const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../data/rotation-history.json');

class RotationHistoryService {
  constructor() {
    this.history = this._loadHistory();
  }

  _loadHistory() {
    try {
      if (!fs.existsSync(path.dirname(HISTORY_FILE))) {
        fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
      }
      if (!fs.existsSync(HISTORY_FILE)) {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify({}), 'utf8');
      }
      const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('RotationHistoryService load error:', error);
      return {};
    }
  }

  _persist() {
    try {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.history, null, 2), 'utf8');
    } catch (error) {
      console.error('RotationHistoryService persist error:', error);
    }
  }

  getHistory(agentName) {
    return (this.history[agentName] || []).slice();
  }

  record(agentName, site, { timestamp = new Date().toISOString(), forced = false, context = {} } = {}) {
    if (!agentName || !site) return;

    const list = this.history[agentName] || [];
    list.unshift({ site, timestamp, forced, context });
    this.history[agentName] = list.slice(0, 50);
    this._persist();
  }

  recentSites(agentName, lookbackDays = 7) {
    const since = Date.now() - Math.max(1, lookbackDays) * 24 * 60 * 60 * 1000;
    return this.getHistory(agentName)
      .filter(entry => new Date(entry.timestamp).getTime() >= since)
      .map(entry => entry.site);
  }
}

module.exports = new RotationHistoryService();
