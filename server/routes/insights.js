const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/insights/daily?date=YYYY-MM-DD
router.get(
  '/daily',
  authenticate,
  requireRole('MANAGER'),
  insightsController.getDailyInsights
);

module.exports = router;

