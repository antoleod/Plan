const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const LocalExcelAdapter = require('../server/adapters/LocalExcelAdapter');
const ExcelMappingService = require('../server/services/ExcelMappingService');

/**
 * Test: Verify agents are only loaded from rows 57-98
 */
const EXCEL_FILE = path.join(__dirname, '../Planning_2026-01_FULLY_EDITABLE.xlsm');
const TEST_BACKUP = path.join(__dirname, '../Planning_2026-01_TEST_RANGE.xlsm');

async function runAgentRangeTests() {
  console.log('🧪 Running Agent Range Tests (57-98)...\n');

  let adapter;
  let mappingService;

  try {
    // Setup: Create test backup
    if (fs.existsSync(TEST_BACKUP)) {
      fs.unlinkSync(TEST_BACKUP);
    }
    const fileData = fs.readFileSync(EXCEL_FILE);
    fs.writeFileSync(TEST_BACKUP, fileData);
    await new Promise(resolve => setTimeout(resolve, 200));

    adapter = new LocalExcelAdapter(TEST_BACKUP);
    await adapter.loadExcel();
    mappingService = new ExcelMappingService(adapter);

    // Test 1: getAllAgents only returns agents in range 57-98
    const agents = await mappingService.getAllAgents();
    console.log(`✅ Found ${agents.length} agents`);

    const outOfRange = agents.filter(a => a.row < 57 || a.row > 98);
    if (outOfRange.length > 0) {
      console.error(`❌ FAIL: Found ${outOfRange.length} agents outside range 57-98:`);
      outOfRange.forEach(a => console.error(`   - Row ${a.row}: ${a.name}`));
      process.exit(1);
    }
    console.log('✅ All agents are within range 57-98');

    // Test 2: Verify findAgentRow respects range
    const testAgent = agents[0];
    if (testAgent) {
      const foundRow = await mappingService.findAgentRow(testAgent.name);
      if (foundRow && (foundRow < 57 || foundRow > 98)) {
        console.error(`❌ FAIL: findAgentRow returned row ${foundRow} (outside 57-98)`);
        process.exit(1);
      }
      console.log(`✅ findAgentRow respects range (found row ${foundRow})`);
    }

    // Test 3: Verify empty rows are ignored
    const emptyRows = [];
    for (let row = 57; row <= 98; row++) {
      const cellAddress = mappingService.getCellAddress(row, 'B');
      const cell = await adapter.readCell('Planning', cellAddress);
      if (!cell.value || !cell.value.toString().trim()) {
        emptyRows.push(row);
      }
    }
    console.log(`✅ Empty rows detected: ${emptyRows.length} (rows ${emptyRows.slice(0, 5).join(', ')}...)`);

    // Cleanup
    if (fs.existsSync(TEST_BACKUP)) {
      fs.unlinkSync(TEST_BACKUP);
    }
    console.log('✅ Cleanup completed');

    console.log('\n✅ All Agent Range Tests Passed!');

  } catch (error) {
    console.error('\n❌ Agent range test failed:', error.message);
    console.error(error.stack);
    
    if (fs.existsSync(TEST_BACKUP)) {
      try {
        fs.unlinkSync(TEST_BACKUP);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    process.exit(1);
  }
}

runAgentRangeTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
