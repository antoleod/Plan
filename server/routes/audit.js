const express = require('express');
const router = express.Router();
const { getAuditLog } = require('../utils/audit');
const { authenticate, requireRole } = require('../middleware/auth');

// Get audit log (only managers)
router.get('/', authenticate, requireRole('MANAGER'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = getAuditLog(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
