const express = require('express');
const router = express.Router();
const path = require('path');
const ExcelService = require(path.join(process.cwd(), 'ExcelService.js'));
const RuleEngine = require('../services/RuleEngine');

router.get('/coverage', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const assignments = await ExcelService.getAssignmentsForDay(date);
    const report = RuleEngine.analyzeCoverage(assignments);
    res.json(report);
  } catch (error) {
    console.error('Error getting coverage:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const assignments = await ExcelService.getAssignmentsForDay(date);
    const alerts = RuleEngine.analyzeBreakConflicts(assignments);
    res.json(alerts);
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;