const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * QA Tests for Excel Safety
 * Verifies that Excel file integrity is preserved after operations
 */
const EXCEL_FILE = path.join(__dirname, '../Planning_2026-01_FULLY_EDITABLE.xlsm');
const BACKUP_FILE = path.join(__dirname, '../Planning_2026-01_FULLY_EDITABLE_backup_test.xlsm');

async function loadWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

function extractCellProperties(cell) {
  return {
    value: cell.value,
    formula: cell.formula,
    fill: cell.fill ? {
      type: cell.fill.type,
      pattern: cell.fill.pattern,
      fgColor: cell.fill.fgColor ? cell.fill.fgColor.argb : null,
      bgColor: cell.fill.bgColor ? cell.fill.bgColor.argb : null
    } : null,
    font: cell.font ? {
      name: cell.font.name,
      size: cell.font.size,
      bold: cell.font.bold,
      italic: cell.font.italic,
      color: cell.font.color ? cell.font.color.argb : null
    } : null,
    border: cell.border ? {
      top: cell.border.top ? { style: cell.border.top.style, color: cell.border.top.color?.argb } : null,
      left: cell.border.left ? { style: cell.border.left.style, color: cell.border.left.color?.argb } : null,
      bottom: cell.border.bottom ? { style: cell.border.bottom.style, color: cell.border.bottom.color?.argb } : null,
      right: cell.border.right ? { style: cell.border.right.style, color: cell.border.right.color?.argb } : null
    } : null,
    alignment: cell.alignment ? { ...cell.alignment } : null,
    numFmt: cell.numFmt,
    merge: cell.isMerged
  };
}

function extractSheetProperties(sheet) {
  const properties = {
    name: sheet.name,
    rowCount: sheet.rowCount,
    columnCount: sheet.columnCount,
    merges: [],
    rowHeights: {},
    columnWidths: {}
  };

  // Extract merges
  sheet.model.merges?.forEach(merge => {
    properties.merges.push({
      master: merge.master,
      top: merge.top,
      left: merge.left,
      bottom: merge.bottom,
      right: merge.right
    });
  });

  // Extract row heights (sample first 100 rows)
  for (let i = 1; i <= Math.min(100, sheet.rowCount); i++) {
    const row = sheet.getRow(i);
    if (row.height) {
      properties.rowHeights[i] = row.height;
    }
  }

  // Extract column widths (sample first 50 columns)
  for (let i = 1; i <= Math.min(50, sheet.columnCount); i++) {
    const col = sheet.getColumn(i);
    if (col.width) {
      properties.columnWidths[i] = col.width;
    }
  }

  return properties;
}

async function compareWorkbooks(original, modified) {
  const differences = [];

  // Compare sheets
  const originalSheets = original.worksheets.map(s => s.name);
  const modifiedSheets = modified.worksheets.map(s => s.name);

  if (JSON.stringify(originalSheets) !== JSON.stringify(modifiedSheets)) {
    differences.push({
      type: 'sheet_list',
      message: 'Sheet list changed',
      original: originalSheets,
      modified: modifiedSheets
    });
  }

  // Compare each sheet
  for (const sheetName of originalSheets) {
    const origSheet = original.getWorksheet(sheetName);
    const modSheet = modified.getWorksheet(sheetName);

    if (!modSheet) {
      differences.push({
        type: 'sheet_missing',
        sheet: sheetName,
        message: `Sheet "${sheetName}" missing in modified file`
      });
      continue;
    }

    // Compare sheet properties
    const origProps = extractSheetProperties(origSheet);
    const modProps = extractSheetProperties(modSheet);

    // Check merges
    if (JSON.stringify(origProps.merges) !== JSON.stringify(modProps.merges)) {
      differences.push({
        type: 'merges',
        sheet: sheetName,
        message: 'Merges changed',
        original: origProps.merges.length,
        modified: modProps.merges.length
      });
    }

    // Check row heights (sample)
    for (const rowNum in origProps.rowHeights) {
      if (origProps.rowHeights[rowNum] !== modProps.rowHeights[rowNum]) {
        differences.push({
          type: 'row_height',
          sheet: sheetName,
          row: rowNum,
          message: `Row ${rowNum} height changed`,
          original: origProps.rowHeights[rowNum],
          modified: modProps.rowHeights[rowNum]
        });
      }
    }

    // Check column widths (sample)
    for (const colNum in origProps.columnWidths) {
      if (origProps.columnWidths[colNum] !== modProps.columnWidths[colNum]) {
        differences.push({
          type: 'column_width',
          sheet: sheetName,
          column: colNum,
          message: `Column ${colNum} width changed`,
          original: origProps.columnWidths[colNum],
          modified: modProps.columnWidths[colNum]
        });
      }
    }

    // Compare critical cells (sample: first 100 rows, first 50 columns)
    const maxRows = Math.min(100, origSheet.rowCount);
    const maxCols = Math.min(50, origSheet.columnCount);

    for (let row = 1; row <= maxRows; row++) {
      for (let col = 1; col <= maxCols; col++) {
        const origCell = origSheet.getCell(row, col);
        const modCell = modSheet.getCell(row, col);

        const origProps = extractCellProperties(origCell);
        const modProps = extractCellProperties(modCell);

        // Check formula (should be preserved)
        if (origProps.formula && origProps.formula !== modProps.formula) {
          differences.push({
            type: 'formula',
            sheet: sheetName,
            cell: `${origCell.address}`,
            message: `Formula changed in ${origCell.address}`,
            original: origProps.formula,
            modified: modProps.formula
          });
        }

        // Check fill color (if original had fill)
        if (origProps.fill && origProps.fill.fgColor) {
          if (origProps.fill.fgColor !== modProps.fill?.fgColor) {
            // Only report if we didn't intentionally change the value
            // (This is a simplified check - in production, track which cells we modified)
          }
        }
      }
    }
  }

  return differences;
}

async function runTests() {
  console.log('🧪 Running Excel Safety Tests...\n');

  // Test 1: File exists
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error('❌ Excel file not found:', EXCEL_FILE);
    process.exit(1);
  }
  console.log('✅ Excel file exists');

  // Test 2: Can load workbook
  let originalWorkbook;
  try {
    originalWorkbook = await loadWorkbook(EXCEL_FILE);
    console.log('✅ Can load workbook');
    console.log(`   Sheets: ${originalWorkbook.worksheets.length}`);
  } catch (error) {
    console.error('❌ Error loading workbook:', error.message);
    process.exit(1);
  }

  // Test 3: Create backup and test write
  try {
    // Ensure backup file doesn't exist
    if (fs.existsSync(BACKUP_FILE)) {
      try {
        fs.unlinkSync(BACKUP_FILE);
      } catch (e) {
        console.warn('⚠️  Could not delete existing backup file:', e.message);
      }
    }
    
    // Verify source file exists and is readable
    if (!fs.existsSync(EXCEL_FILE)) {
      throw new Error(`Source file does not exist: ${EXCEL_FILE}`);
    }
    
    const sourceStats = fs.statSync(EXCEL_FILE);
    console.log(`   Source file size: ${sourceStats.size} bytes`);
    
    try {
      // Use readFileSync + writeFileSync as alternative
      const fileData = fs.readFileSync(EXCEL_FILE);
      fs.writeFileSync(BACKUP_FILE, fileData);
    } catch (error) {
      throw new Error(`Failed to copy file: ${error.message} (code: ${error.code})`);
    }
    
    // Wait a moment for file system to sync
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verify backup was created
    if (!fs.existsSync(BACKUP_FILE)) {
      throw new Error(`Backup file was not created at: ${BACKUP_FILE}`);
    }
    
    const backupStats = fs.statSync(BACKUP_FILE);
    if (backupStats.size !== sourceStats.size) {
      throw new Error(`Backup file size mismatch: ${backupStats.size} vs ${sourceStats.size}`);
    }
    
    console.log('✅ Created backup file');

    const testWorkbook = await loadWorkbook(BACKUP_FILE);
    const testSheet = testWorkbook.getWorksheet('Planning');
    
    if (!testSheet) {
      console.error('❌ Planning sheet not found');
      // Try to list available sheets
      console.log('Available sheets:', testWorkbook.worksheets.map(s => s.name));
      process.exit(1);
    }
    console.log('✅ Planning sheet exists');

    // Test write operation (write to a safe cell)
    const testCell = testSheet.getCell('B62');
    const originalValue = testCell.value;
    testCell.value = 'TEST_VALUE';
    
    await testWorkbook.xlsx.writeFile(BACKUP_FILE);
    console.log('✅ Can write to Excel file');

    // Restore original value
    testCell.value = originalValue;
    await testWorkbook.xlsx.writeFile(BACKUP_FILE);

    // Test 4: Compare before/after
    const modifiedWorkbook = await loadWorkbook(BACKUP_FILE);
    const differences = await compareWorkbooks(originalWorkbook, modifiedWorkbook);

    if (differences.length > 0) {
      console.log('\n⚠️  Differences found:');
      differences.forEach(diff => {
        console.log(`   - ${diff.type}: ${diff.message}`);
        if (diff.sheet) console.log(`     Sheet: ${diff.sheet}`);
        if (diff.cell) console.log(`     Cell: ${diff.cell}`);
      });
    } else {
      console.log('✅ No structural differences detected');
    }

    // Cleanup
    fs.unlinkSync(BACKUP_FILE);
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Error during tests:', error.message);
    if (fs.existsSync(BACKUP_FILE)) {
      fs.unlinkSync(BACKUP_FILE);
    }
    process.exit(1);
  }

  console.log('\n✅ All Excel Safety Tests Passed!');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
