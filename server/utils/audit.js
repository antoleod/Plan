/**
 * Simple audit log for tracking changes
 * In production, use a proper logging system
 */
const fs = require('fs');
const path = require('path');

const AUDIT_LOG_PATH = path.join(__dirname, '../logs/audit.log');

// Ensure logs directory exists
const logsDir = path.dirname(AUDIT_LOG_PATH);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function logChange(user, action, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    user: user.username || user.name || 'unknown',
    userId: user.id || 'unknown',
    action,
    details
  };

  const logLine = JSON.stringify(entry) + '\n';
  
  try {
    fs.appendFileSync(AUDIT_LOG_PATH, logLine);
  } catch (error) {
    console.error('Error writing audit log:', error);
  }
}

function getAuditLog(limit = 100) {
  try {
    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      return [];
    }

    const content = fs.readFileSync(AUDIT_LOG_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line);
    const entries = lines.map(line => JSON.parse(line));
    
    return entries.slice(-limit).reverse();
  } catch (error) {
    console.error('Error reading audit log:', error);
    return [];
  }
}

module.exports = {
  logChange,
  getAuditLog
};
