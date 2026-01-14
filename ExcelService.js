const ExcelJS = require('exceljs');
const path = require('path');
const mapping = require(path.join(process.cwd(), 'server/config/mapping.config.json'));

const EXCEL_FILE_PATH = path.join(
  process.cwd(),
  process.env.EXCEL_FILE_NAME || 'Planning_2026-01_FULLY_EDITABLE.xlsm'
);

/**
 * Carga el libro de trabajo de Excel (solo lectura).
 */
async function getWorkbook() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE_PATH);
  return workbook;
}

/**
 * Encuentra el número de columna para una fecha específica
 * en la fila de cabecera configurada.
 */
function findColumnForDate(sheet, date) {
  const headerRow = sheet.getRow(mapping.hourHeaderRow);
  let foundCol = null;

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (cell.value instanceof Date) {
      const cellDate = cell.value;
      if (
        cellDate.getFullYear() === date.getFullYear() &&
        cellDate.getMonth() === date.getMonth() &&
        cellDate.getDate() === date.getDate()
      ) {
        foundCol = colNumber;
      }
    }
  });

  return foundCol;
}

function parseAddress(address) {
  const column = address.match(/[A-Z]+/)[0];
  const row = parseInt(address.match(/\d+/)[0], 10);
  return { column, row };
}

function buildStatusPalette(sheet) {
  const palette = {};
  const statusConfig = mapping.palette?.status;
  if (!statusConfig) return palette;

  const [start, end] = statusConfig.range.split(':');
  const { column: startCol } = parseAddress(start);
  const { row: startRow } = parseAddress(start);
  const { row: endRow } = parseAddress(end);

  for (let row = startRow; row <= endRow; row++) {
    const cellAddress = `${startCol}${row}`;
    const cell = sheet.getCell(cellAddress);
    const statusName = statusConfig.values[cellAddress];
    const statusColor = cell?.style?.fill?.fgColor?.argb;
    if (statusName && statusColor) {
      palette[statusColor] = statusName;
    }
  }

  return palette;
}

function detectStatusFromCell(cell, statusPalette) {
  if (!cell || !cell.style) return null;
  const color = cell.style.fill?.fgColor?.argb;
  if (!color) return null;
  return statusPalette[color] || null;
}

/**
 * Extrae las asignaciones para un día específico del Excel.
 */
async function getAssignmentsForDay(dateString) {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet(mapping.sheet);
  if (!sheet) {
    throw new Error(`Sheet "${mapping.sheet}" not found.`);
  }

  const targetDate = new Date(`${dateString}T00:00:00Z`);
  const planningCol = findColumnForDate(sheet, targetDate);

  if (!planningCol) {
    return [];
  }

  const statusPalette = buildStatusPalette(sheet);
  const assignments = [];
  const agentEndRow = mapping.agentEndRow ?? 98;

  for (let rowNum = mapping.agentStartRow; rowNum <= agentEndRow; rowNum++) {
    const row = sheet.getRow(rowNum);
    const agentName = row.getCell(mapping.agentNameColumn).value;

    if (!agentName || typeof agentName !== 'string') continue;

    const planningCell = row.getCell(planningCol);
    const site = planningCell.value?.toString().trim() || null;

    const statusFromPalette = detectStatusFromCell(planningCell, statusPalette);
    const status = statusFromPalette || (site ? 'Present' : 'OFF');

    assignments.push({
      row: rowNum,
      agentName,
      site,
      status,
    });
  }

  return assignments;
}

/**
 * Extrae todas las asignaciones para un mes y año específicos.
 */
async function getAssignmentsForMonth(year, month) {
  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet(mapping.sheet);
  if (!sheet) throw new Error(`Sheet "${mapping.sheet}" not found.`);

  const headerRow = sheet.getRow(mapping.hourHeaderRow);
  const monthColumns = [];

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (cell.value instanceof Date) {
      const cellDate = cell.value;
      if (
        cellDate.getFullYear() === year &&
        cellDate.getMonth() + 1 === month
      ) {
        monthColumns.push({ date: cellDate, col: colNumber });
      }
    }
  });

  if (monthColumns.length === 0) return [];

  const allAssignments = [];
  const agentEndRow = mapping.agentEndRow ?? 98;
  const statusPalette = buildStatusPalette(sheet);

  for (let rowNum = mapping.agentStartRow; rowNum <= agentEndRow; rowNum++) {
    const row = sheet.getRow(rowNum);
    const agentName = row.getCell(mapping.agentNameColumn).value;
    if (!agentName || typeof agentName !== 'string') continue;

      for (const dayInfo of monthColumns) {
        const planningCell = row.getCell(dayInfo.col);
        const site = planningCell.value?.toString().trim() || null;

        let status = 'OFF';
        if (site) {
          const paletteStatus = detectStatusFromCell(planningCell, statusPalette);
          status = paletteStatus || 'Present';
        }

      allAssignments.push({
        row: rowNum,
        agentName,
        date: dayInfo.date.toISOString().split('T')[0],
        site,
        status,
      });
    }
  }
  return allAssignments;
}

/**
 * Aplica una lista de cambios al Excel escribiendo SOLO el valor
 * (sin tocar merges, estilos ni fórmulas).
 * changes: [{ row, col, value }]
 */
async function updateAssignments(changes) {
  if (!changes || !changes.length) return;

  const workbook = await getWorkbook();
  const sheet = workbook.getWorksheet(mapping.sheet);
  if (!sheet) throw new Error(`Sheet "${mapping.sheet}" not found.`);

  for (const change of changes) {
    const row = sheet.getRow(change.row);
    const cell = row.getCell(change.col);

    // Si la celda tuviera fórmula, no la sobrescribimos.
    if (
      cell.value &&
      typeof cell.value === 'object' &&
      Object.prototype.hasOwnProperty.call(cell.value, 'formula')
    ) {
      continue;
    }

    cell.value = change.value ?? null;
  }

  await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
}

module.exports = {
  getAssignmentsForDay,
  getAssignmentsForMonth,
  findColumnForDate,
  updateAssignments,
};
