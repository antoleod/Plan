const express = require('express');
const router = express.Router();
const reportService = require('../services/ReportService');

/**
 * GET /api/reports/dashboard
 * Returns aggregated metrics for the BI Dashboard.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString();
    const stats = await reportService.getDashboardStats(date);
    res.json(stats);
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ error: 'Failed to generate dashboard metrics' });
  }
});

/**
 * GET /api/reports/export/csv
 * Streams the audit log as CSV.
 */
router.get('/export/csv', async (req, res) => {
  try {
    await reportService.generateCSVStream(res);
  } catch (err) {
    res.status(500).end();
  }
});

module.exports = router;