const path = require('path');
const excelService = require('./ExcelService');
const auditService = require('./AuditService');
const mapping = require(path.join(process.cwd(), 'server/config/mapping.config.json'));
const ExcelJS = require('exceljs');
const rotationHistory = require('./server/services/RotationHistoryService');

const EXCEL_FILE_PATH = path.join(process.cwd(), process.env.EXCEL_FILE_NAME || 'Planning_2026-01_FULLY_EDITABLE.xlsm');

/**
 * Generates a pre-plan for a target month by copying from a source month.
 * @param {object} options
 * @param {number} options.sourceYear
 * @param {number} options.sourceMonth - 1-based month (1 for Jan)
 * @param {number} options.targetYear
 * @param {number} options.targetMonth - 1-based month (1 for Jan)
 * @param {string} options.user
 */
async function generateNextMonthPlan({ sourceYear, sourceMonth, targetYear, targetMonth, user }) {
  // 1. Get all assignments from the source month. This is an expensive read.
  const sourceAssignments = await excelService.getAssignmentsForMonth(sourceYear, sourceMonth);

  if (sourceAssignments.length === 0) {
    throw new Error(`No assignments found for source month ${sourceYear}-${sourceMonth} to copy.`);
  }

  // 2. Prepare for writing: Load workbook once to map target dates to columns efficiently.
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE_PATH);
  const sheet = workbook.getWorksheet(mapping.sheet);
  const headerRow = sheet.getRow(mapping.hourHeaderRow);
  const targetDateToColMap = new Map();

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (cell.value instanceof Date) {
      const cellDate = cell.value;
      if (cellDate.getFullYear() === targetYear && (cellDate.getMonth() + 1) === targetMonth) {
        targetDateToColMap.set(cellDate.getDate(), colNumber);
      }
    }
  });

  // 3. Build the list of changes for the target month.
  const changes = [];
  for (const assignment of sourceAssignments) {
    const sourceDate = new Date(assignment.date);
    const targetCol = targetDateToColMap.get(sourceDate.getDate()); // Copy to the same day number

    if (targetCol && assignment.site) {
      changes.push({
        row: assignment.row,
        col: targetCol,
        value: assignment.site,
        status: assignment.status,
      });
      rotationHistory.record(assignment.agentName, assignment.site, {
        context: 'preplan',
        forced: false
      });
    }
  }

  // 4. Apply all changes in one batch operation and log the event.
  await excelService.updateAssignments(changes);
  await auditService.log({ user, action: 'GENERATE_PREPLAN', details: { source: `${sourceYear}-${sourceMonth}`, target: `${targetYear}-${targetMonth}`, changes: changes.length } });
}

module.exports = { generateNextMonthPlan };
