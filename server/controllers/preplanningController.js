const preplanningService = require('../../PreplanningService');

const generatePlan = async (req, res) => {
  try {
    const { sourceYear, sourceMonth, targetYear, targetMonth } = req.body;
    const user = 'manager_demo';

    if (!sourceYear || !sourceMonth || !targetYear || !targetMonth) {
      return res.status(400).json({ message: 'Missing required date fields.' });
    }

    await preplanningService.generateNextMonthPlan({
      sourceYear,
      sourceMonth,
      targetYear,
      targetMonth,
      user
    });

    res.status(200).json({ message: `Pre-plan for ${targetYear}-${targetMonth} generated successfully.` });
  } catch (error) {
    console.error(`Error generating pre-plan: ${error.message}`);
    res.status(500).json({ message: 'Failed to generate pre-plan', error: error.message });
  }
};

module.exports = { generatePlan };
