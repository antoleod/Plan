/**
 * Abstract Base Class for Excel Adapters
 */
class ExcelAdapter {
  async loadExcel() { throw new Error('Method not implemented'); }
  async saveExcel() { throw new Error('Method not implemented'); }
  async readCell() { throw new Error('Method not implemented'); }
  async writeCell() { throw new Error('Method not implemented'); }
}

module.exports = ExcelAdapter;