const express = require('express');
const router = express.Router();
const path = require('path');
const LocalExcelAdapter = require('../adapters/LocalExcelAdapter');
const PlanningService = require('../services/PlanningService');
const planningController = require('../controllers/planningController');
const { logChange } = require('../utils/audit');
const { authenticate, requireRole } = require('../middleware/auth');

// Initialize adapter
const EXCEL_FILE_PATH = path.join(__dirname, '../../Planning_2026-01_FULLY_EDITABLE.xlsm');
let excelAdapter = null;
let planningService = null;

async function getService() {
  if (!excelAdapter) {
    excelAdapter = new LocalExcelAdapter(EXCEL_FILE_PATH);
    await excelAdapter.loadExcel();
  }
  if (!planningService) {
    planningService = new PlanningService(excelAdapter);
  }
  return planningService;
}

// Get manager view (all agents) - Only MANAGER role
router.get('/manager', authenticate, requireRole('MANAGER'), async (req, res) => {
  try {
    const service = await getService();
    const view = await service.getManagerView();
    res.json(view);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent week view
router.get('/agent/:agentName/week', authenticate, async (req, res) => {
  try {
    const service = await getService();
    const { agentName } = req.params;
    const weekStart = req.query.weekStart || new Date().toISOString();
    
    const weekData = await service.getAgentWeek(agentName, weekStart);
    res.json(weekData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update agent day
router.put('/agent/:agentName/day/:dayIndex', authenticate, requireRole('MANAGER'), async (req, res) => {
  try {
    const service = await getService();
    const { agentName, dayIndex } = req.params;
    const updateData = req.body;
    
    // Validate
    const errors = service.validateTimeEntry(updateData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    
    const result = await service.updateAgentDay(agentName, parseInt(dayIndex), updateData);
    
    // Log change
    const user = req.user || { username: 'unknown', id: 'unknown' };
    logChange(user, 'UPDATE_AGENT_DAY', {
      agent: agentName,
      day: dayIndex,
      data: updateData
    });
    
    // Auto-save
    await excelAdapter.saveExcel();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all agents (both MANAGER and AGENT can see this, but AGENT only sees their group)
router.get('/agents', authenticate, async (req, res) => {
  try {
    const service = await getService();
    const mappingService = service.mappingService;
    const agents = await mappingService.getAllAgents();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agents view for grouping (read-only, available to AGENT and MANAGER)
// Returns full week data but agents can only view, not edit
router.get('/agents/view', authenticate, async (req, res) => {
  try {
    const service = await getService();
    const view = await service.getManagerView();
    res.json(view);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get palette (sites and status)
router.get('/palette', authenticate, async (req, res) => {
  try {
    const service = await getService();
    const mappingService = service.mappingService;
    const palette = await mappingService.getPaletteStyles();
    res.json(palette);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add agent (manager only) - inserts into first empty row within 57..98 and returns the agent
router.post('/agents', authenticate, requireRole('MANAGER'), async (req, res) => {
  try {
    const service = await getService();
    const { fullName } = req.body || {};

    const created = await service.addAgent({ fullName });

    // Auto-save
    await excelAdapter.saveExcel();

    // Audit
    logChange(req.user || { username: 'unknown', id: 'unknown' }, 'ADD_AGENT', {
      agent: created
    });

    res.json({ success: true, agent: created });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/daily', authenticate, requireRole('MANAGER'), planningController.getDailyPlan);
router.post('/batch-assign', authenticate, requireRole('MANAGER'), planningController.batchAssign);
router.post('/move', authenticate, requireRole('MANAGER'), planningController.moveAssignment);

module.exports = router;
