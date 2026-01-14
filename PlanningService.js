const ExcelJS = require('exceljs');
const path = require('path');
const excelService = require('./ExcelService');
const auditService = require('./AuditService');
const ruleEngine = require('./RuleEngine');
const mapping = require(path.join(process.cwd(), 'server/config/mapping.config.json'));
const rotationHistory = require('./server/services/RotationHistoryService');

const EXCEL_FILE_PATH = path.join(
  process.cwd(),
  process.env.EXCEL_FILE_NAME || 'Planning_2026-01_FULLY_EDITABLE.xlsm'
);

async function batchAssign({ agentRowNumbers, date, template, user }) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE_PATH);
  const sheet = workbook.getWorksheet(mapping.sheet);
  if (!sheet) {
    throw new Error(`Sheet "${mapping.sheet}" not found`);
  }

  const targetDate = new Date(`${date}T00:00:00Z`);
  const column = excelService.findColumnForDate(sheet, targetDate);
  if (!column) {
    throw new Error(`No column found for date ${date}`);
  }

  const changes = [];
  const assignedAgents = [];

  agentRowNumbers.forEach(row => {
    const rowObject = sheet.getRow(row);
    const agentName = rowObject.getCell(mapping.agentNameColumn).value;
    if (agentName) {
      assignedAgents.push(agentName.toString().trim());
    }
    changes.push({
      row,
      col: column,
      value: template.site,
      status: template.status
    });
  });

  await excelService.updateAssignments(changes);

  assignedAgents.forEach(agentName => {
    if (template.site) {
      rotationHistory.record(agentName, template.site, {
        context: 'batch',
        forced: false
      });
    }
  });

  await auditService.log({
    user,
    action: 'BATCH_ASSIGN',
    details: {
      agentRows: agentRowNumbers,
      agentNames: assignedAgents,
      date,
      template
    }
  });
}

async function moveAssignment({ sourceRow, sourceDate, targetRow, targetDate, user, force = false }) {
  const assignments = await excelService.getAssignmentsForDay(sourceDate);
  const sourceAssignment = assignments.find(a => a.row === sourceRow);
  const targetAssignment = assignments.find(a => a.row === targetRow);

  if (!sourceAssignment) {
    throw new Error('Source assignment not found');
  }

  const targetAgentName = targetAssignment?.agentName || `row_${targetRow}`;
  const targetSite = sourceAssignment.site;

  if (!force) {
    const validation = ruleEngine.validateMove(assignments, {
      sourceSite: sourceAssignment.site,
      sourceAgent: sourceAssignment.agentName,
      targetSite,
      targetAgent: targetAgentName
    });

    if (!validation.valid) {
      const error = new Error('Validation failed');
      error.type = 'RULE_WARNING';
      error.warnings = validation.warnings;
      throw error;
    }
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE_PATH);
  const sheet = workbook.getWorksheet(mapping.sheet);
  if (!sheet) {
    throw new Error(`Sheet "${mapping.sheet}" not found`);
  }

  const srcDateCol = excelService.findColumnForDate(sheet, new Date(`${sourceDate}T00:00:00Z`));
  const tgtDateCol = excelService.findColumnForDate(sheet, new Date(`${targetDate}T00:00:00Z`));

  const changes = [
    { row: sourceRow, col: srcDateCol, value: null, status: 'OFF' },
    { row: targetRow, col: tgtDateCol, value: sourceAssignment.site, status: sourceAssignment.status }
  ];

  await excelService.updateAssignments(changes);

  if (targetSite && targetAgentName) {
    rotationHistory.record(targetAgentName, targetSite, {
      context: 'move',
      forced: force
    });
  }

  await auditService.log({
    user,
    action: 'MOVE_ASSIGNMENT',
    details: {
      sourceRow,
      targetRow,
      sourceAgent: sourceAssignment.agentName,
      targetAgent: targetAgentName,
      date: sourceDate,
      site: targetSite,
      forced: force
    }
  });
}

module.exports = { batchAssign, moveAssignment };
