const planningService = require('../services/PlanningService');
const excelService = require('../../ExcelService');

const batchAssign = async (req, res) => {
  try {
    const { agentRowNumbers, date, template } = req.body;
    const user = 'manager_demo'; // Placeholder until JWT is integrated

    if (!Array.isArray(agentRowNumbers) || agentRowNumbers.length === 0 || !date || !template) {
      return res.status(400).json({ message: 'Missing required fields: agentRowNumbers, date, template' });
    }

    await planningService.batchAssign({ agentRowNumbers, date, template, user });
    res.status(200).json({ message: 'Batch assignment successful' });
  } catch (error) {
    console.error(`Error in batch assignment: ${error.message}`);
    res.status(500).json({ message: 'Batch assignment failed', error: error.message });
  }
};

const moveAssignment = async (req, res) => {
  try {
    const { sourceRow, sourceDate, targetRow, targetDate, force } = req.body;
    const user = 'manager_demo';

    await planningService.moveAssignment({ sourceRow, sourceDate, targetRow, targetDate, user, force });
    res.status(200).json({ message: 'Move successful' });
  } catch (error) {
    if (error.type === 'RULE_WARNING') {
      return res.status(409).json({
        message: 'Rule validation warning',
        warnings: error.warnings,
        requiresConfirmation: true
      });
    }
    console.error(`Error in move assignment: ${error.message}`);
    res.status(500).json({ message: 'Move failed', error: error.message });
  }
};

const getDailyPlan = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const assignments = await excelService.getAssignmentsForDay(date);
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get daily plan', error: error.message });
  }
};

module.exports = { batchAssign, moveAssignment, getDailyPlan };
