const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const EXCEL_FILE_PATH = path.join(
  process.cwd(),
  process.env.EXCEL_FILE_NAME || 'Planning_2026-01_FULLY_EDITABLE.xlsm'
);

// GET /api/excel/download - Allows downloading the Excel file
router.get('/download', (req, res) => {
  if (fs.existsSync(EXCEL_FILE_PATH)) {
    res.download(EXCEL_FILE_PATH, (err) => {
      if (err) {
        console.error("Error downloading the file:", err);
        res.status(500).send("Could not download the file.");
      }
    });
  } else {
    res.status(404).send("File not found.");
  }
});

module.exports = router;