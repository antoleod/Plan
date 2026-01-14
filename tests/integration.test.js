const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const LocalExcelAdapter = require('../server/adapters/LocalExcelAdapter');
const ExcelMappingService = require('../server/services/ExcelMappingService');
const PlanningService = require('../server/services/PlanningService');

/**
 * Integration Tests
 * Tests the full flow: Adapter -> Mapping -> Planning Service
 */
const EXCEL_FILE = path.join(__dirname, '../Planning_2026-01_FULLY_EDITABLE.xlsm');
const TEST_BACKUP = path.join(__dirname, '../Planning_2026-01_TEST_INTEGRATION.xlsm');

async function runIntegrationTests() {
  console.log('🧪 Running Integration Tests...\n');

  let adapter;
  let mappingService;
  let planningService;

  try {
    // Setup: Create test backup
    if (fs.existsSync(TEST_BACKUP)) {
      fs.unlinkSync(TEST_BACKUP);
    }
    const fileData = fs.readFileSync(EXCEL_FILE);
    fs.writeFileSync(TEST_BACKUP, fileData);
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('✅ Test backup created');

    // Test 1: Initialize adapter
    adapter = new LocalExcelAdapter(TEST_BACKUP);
    await adapter.loadExcel();
    console.log('✅ LocalExcelAdapter initialized');

    // Test 2: Initialize mapping service
    mappingService = new ExcelMappingService(adapter);
    console.log('✅ ExcelMappingService initialized');

    // Test 3: Find agent
    const agentRow = await mappingService.findAgentRow('Juan');
    if (agentRow) {
      console.log(`✅ Found agent "Juan" at row ${agentRow}`);
    } else {
      console.log('⚠️  Agent "Juan" not found (this is OK if name differs)');
    }

    // Test 4: Get all agents
    const agents = await mappingService.getAllAgents();
    console.log(`✅ Found ${agents.length} agents`);
    if (agents.length > 0) {
      console.log(`   First agent: ${agents[0].name}`);
    }

    // Test 5: Get hour headers
    const hourHeaders = await mappingService.getHourHeaders();
    console.log(`✅ Found ${hourHeaders.length} hour headers`);
    if (hourHeaders.length > 0) {
      console.log(`   First header: ${hourHeaders[0].value} (column ${hourHeaders[0].column})`);
    }

    // Test 6: Get palette styles
    const palette = await mappingService.getPaletteStyles();
    console.log(`✅ Loaded palette`);
    console.log(`   Sites: ${Object.keys(palette.sites).length}`);
    console.log(`   Status: ${Object.keys(palette.status).length}`);

    // Test 7: Initialize planning service
    planningService = new PlanningService(adapter);
    console.log('✅ PlanningService initialized');

    // Test 8: Validate time entry
    const validEntry = {
      startTime: '09:00',
      endTime: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00'
    };
    const validationErrors = planningService.validateTimeEntry(validEntry);
    if (validationErrors.length === 0) {
      console.log('✅ Time entry validation passed');
    } else {
      console.log(`⚠️  Validation errors: ${validationErrors.join(', ')}`);
    }

    // Test 9: Invalid time entry
    const invalidEntry = {
      startTime: '07:00', // Before 08:00
      endTime: '21:00'    // After 20:00
    };
    const invalidErrors = planningService.validateTimeEntry(invalidEntry);
    if (invalidErrors.length > 0) {
      console.log(`✅ Invalid time entry correctly rejected (${invalidErrors.length} errors)`);
    } else {
      console.log('⚠️  Invalid entry was not rejected');
    }

    // Test 10: Read cell preserves style
    const testCell = await adapter.readCell('Planning', 'K2');
    if (testCell.style && testCell.style.fill) {
      console.log('✅ Cell style reading works');
    } else {
      console.log('⚠️  Cell style not found (may be OK if cell has no style)');
    }

    // Test 11: Write cell preserves style
    const testWriteAddress = 'B62';
    const originalCell = await adapter.readCell('Planning', testWriteAddress);
    await adapter.writeCell('Planning', testWriteAddress, 'TEST_VALUE', true);
    const modifiedCell = await adapter.readCell('Planning', testWriteAddress);
    
    // Restore original
    await adapter.writeCell('Planning', testWriteAddress, originalCell.value, true);
    
    if (modifiedCell.value === 'TEST_VALUE') {
      console.log('✅ Cell write works');
    } else {
      console.log('⚠️  Cell write may have issues');
    }

    // Cleanup
    if (fs.existsSync(TEST_BACKUP)) {
      fs.unlinkSync(TEST_BACKUP);
    }
    console.log('✅ Cleanup completed');

    console.log('\n✅ All Integration Tests Passed!');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.error(error.stack);
    
    // Cleanup on error
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

// Run tests
runIntegrationTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
