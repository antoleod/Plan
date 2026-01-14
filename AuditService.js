const fs = require('fs/promises');
const path = require('path');

const LOG_FILE_PATH = path.join(__dirname, '../data/audit.log.jsonl');

/**
 * Ensures the directory for the log file exists.
 */
async function ensureLogDirExists() {
  try {
    await fs.mkdir(path.dirname(LOG_FILE_PATH), { recursive: true });
  } catch (error) {
    console.error('Failed to create log directory:', error);
    throw error;
  }
}

/**
 * Logs an audit event to the persistent log file.
 * @param {object} event - The event object to log.
 */
async function log(event) {
  await ensureLogDirExists();
  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event,
  });
  await fs.appendFile(LOG_FILE_PATH, logEntry + '\n');
}

/**
 * Retrieves all audit logs.
 * @returns {Promise<Array<object>>} - An array of log event objects.
 */
async function getLogs() {
  await ensureLogDirExists();
  try {
    const data = await fs.readFile(LOG_FILE_PATH, 'utf8');
    // Split by newline and filter out empty lines, then reverse to show newest first.
    return data.split('\n').filter(Boolean).map(JSON.parse).reverse();
  } catch (error) {
    if (error.code === 'ENOENT') return []; // File doesn't exist yet, return empty array
    throw error;
  }
}

module.exports = { log, getLogs };