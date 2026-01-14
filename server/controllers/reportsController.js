const excelService = require('../../ExcelService');
const auditService = require('../../AuditService');

const convertToCSV = (data) => {
  if (!Array.isArray(data) || data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row =>
    Object.values(row)
      .map(value => {
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );
  return [headers, ...rows].join('\n');
};

const exportDailyReport = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const assignments = await excelService.getAssignmentsForDay(date);

    const csvData = assignments.map(a => ({
      Date: date,
      Agent: a.agentName,
      Site: a.site || '',
      Status: a.status || 'OFF',
      RowIndex: a.row
    }));

    const csv = convertToCSV(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=daily_report_${date}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export daily report' });
  }
};

const exportAuditLog = async (req, res) => {
  try {
    const logs = await auditService.getLogs();
    const csvData = logs.map(log => ({
      Timestamp: log.timestamp,
      User: log.user || 'System',
      Action: log.action,
      Details: JSON.stringify(log.details)
    }));

    const csv = convertToCSV(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export audit log' });
  }
};

module.exports = { exportDailyReport, exportAuditLog };
