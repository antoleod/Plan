const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { requireRole } = require('../middleware/auth'); // Se asume que este middleware existe

const AUDIT_LOG_PATH = path.join(process.cwd(), 'server', 'data', 'audit.log.jsonl');

// GET /api/audit - Obtiene logs de auditoría con filtro de fecha opcional
router.get('/', requireRole('manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      return res.json([]);
    }

    const logs = [];
    const fileStream = fs.createReadStream(AUDIT_LOG_PATH);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    for await (const line of rl) {
      if (line) {
        const logEntry = JSON.parse(line);
        const logDate = new Date(logEntry.timestamp);

        const inRange = (!start || logDate >= start) && (!end || logDate <= end);

        if (inRange) {
          logs.push(logEntry);
        }
      }
    }

    // Devuelve los logs en orden cronológico inverso
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(logs);
  } catch (error) {
    console.error('Error reading audit log:', error);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

module.exports = router;