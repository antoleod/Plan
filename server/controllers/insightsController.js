const excelService = require('../../ExcelService');
const ruleEngine = require('../../RuleEngine');

const getDailyInsights = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const assignments = await excelService.getAssignmentsForDay(date);

    const insights = ruleEngine.analyzeDay(assignments);

    res.status(200).json({
      date,
      assignments,
      ...insights
    });
  } catch (error) {
    console.error(`Error getting daily insights: ${error.message}`);
    res.status(500).json({ message: 'Failed to retrieve daily insights', error: error.message });
  }
};

module.exports = { getDailyInsights };
