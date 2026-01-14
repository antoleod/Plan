const express = require('express');
const router = express.Router();
const preplanningController = require('../controllers/preplanningController');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/preplan/generate
router.post(
  '/generate',
  authenticate,
  requireRole('MANAGER'),
  preplanningController.generatePlan
);

module.exports = router;

