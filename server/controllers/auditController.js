const auditService = require('../../AuditService');

const getAuditLogs = async (req, res) => {
  try {
    const logs = await auditService.getLogs();
    res.status(200).json(logs);
  } catch (error) {
    console.error(`Error getting audit logs: ${error.message}`);
    res.status(500).json({ message: 'Failed to retrieve audit logs', error: error.message });
  }
};

module.exports = { getAuditLogs };
