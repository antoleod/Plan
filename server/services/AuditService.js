const fs = require('fs').promises;
const path = require('path');

const AUDIT_LOG_PATH = path.join(process.cwd(), 'server', 'data', 'audit.log.jsonl');

/**
 * Appends a new log entry to the audit log file.
 * @param {object} logEntry - The log entry object.
 * @param {string} logEntry.user - The user performing the action.
 * @param {string} logEntry.action - The type of action (e.g., 'BATCH_UPDATE').
 * @param {string} logEntry.details - A description of what was changed.
 * @param {string} [logEntry.reason] - The justification for the change.
 */
async function logAction(logEntry) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      ...logEntry,
    };
    const logLine = JSON.stringify(entry) + '\n';
    await fs.appendFile(AUDIT_LOG_PATH, logLine, 'utf8');
  } catch (error) {
    console.error('FATAL: Failed to write to audit log:', error);
  }
}

module.exports = { logAction };