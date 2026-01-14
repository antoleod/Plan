const express = require('express');
const router = express.Router();
const path = require('path');
const LocalExcelAdapter = require('../adapters/LocalExcelAdapter');
const { authenticate, requireRole } = require('../middleware/auth');

// Initialize adapter with Excel file path
const EXCEL_FILE_PATH = path.join(__dirname, '../../Planning_2026-01_FULLY_EDITABLE.xlsm');
let excelAdapter = null;

// Initialize adapter on first request
async function getAdapter() {
  if (!excelAdapter) {
    excelAdapter = new LocalExcelAdapter(EXCEL_FILE_PATH);
    await excelAdapter.loadExcel();
  }
  return excelAdapter;
}

// Check for file changes
router.get('/status', authenticate, async (req, res) => {
  try {
    const adapter = await getAdapter();
    const hasChanges = await adapter.checkForChanges();
    const lastModified = adapter.getLastModified();
    
    res.json({
      hasChanges,
      lastModified: lastModified ? lastModified.toISOString() : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reload Excel file
router.post('/reload', authenticate, requireRole('MANAGER'), async (req, res) => {
  try {
    excelAdapter = new LocalExcelAdapter(EXCEL_FILE_PATH);
    await excelAdapter.loadExcel();
    res.json({ success: true, message: 'Excel reloaded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save Excel file
router.post('/save', authenticate, requireRole('MANAGER'), async (req, res) => {
  try {
    const adapter = await getAdapter();
    
    // Check for conflicts
    const hasChanges = await adapter.checkForChanges();
    if (hasChanges && !req.body.force) {
      return res.status(409).json({
        error: 'File has been modified. Reload first or use force=true',
        hasChanges: true
      });
    }
    
    const result = await adapter.saveExcel();
    res.json({
      success: true,
      message: 'Excel saved successfully',
      backupPath: result.backupPath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download Excel file
router.get('/download', authenticate, async (req, res) => {
  try {
    const adapter = await getAdapter();
    await adapter.saveExcel(); // Ensure latest changes are saved
    
    res.download(EXCEL_FILE_PATH, 'Planning_2026-01_FULLY_EDITABLE.xlsm', (err) => {
      if (err) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
