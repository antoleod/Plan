const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/daily', authenticate, requireRole('MANAGER'), reportsController.exportDailyReport);
router.get('/audit', authenticate, requireRole('MANAGER'), reportsController.exportAuditLog);

module.exports = router;
