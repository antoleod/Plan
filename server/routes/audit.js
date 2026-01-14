const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, requireRole('MANAGER'), auditController.getAuditLogs);

module.exports = router;
