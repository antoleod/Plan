/**
 * Abstract base class for Excel adapters
 * Defines the interface for reading/writing Excel files
 */
class ExcelAdapter {
  async loadExcel(filePath) {
    throw new Error('loadExcel must be implemented by subclass');
  }

  async saveExcel(filePath, workbook) {
    throw new Error('saveExcel must be implemented by subclass');
  }

  async readCell(sheet, cellAddress) {
    throw new Error('readCell must be implemented by subclass');
  }

  async writeCell(sheet, cellAddress, value, style = null) {
    throw new Error('writeCell must be implemented by subclass');
  }

  async copyStyle(sourceSheet, sourceCell, targetSheet, targetCell) {
    throw new Error('copyStyle must be implemented by subclass');
  }

  async getWorkbook() {
    throw new Error('getWorkbook must be implemented by subclass');
  }
}

module.exports = ExcelAdapter;
