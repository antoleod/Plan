const config = require('../config/mapping.config.json');

/**
 * Service for mapping Excel structure to application model
 */
class ExcelMappingService {
  constructor(excelAdapter) {
    this.adapter = excelAdapter;
    this.config = config;
  }

  /**
   * Convert column letter to number (A=1, B=2, ..., Z=26, AA=27, etc.)
   */
  columnToNumber(col) {
    let result = 0;
    for (let i = 0; i < col.length; i++) {
      result = result * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return result;
  }

  /**
   * Convert column number to letter
   */
  numberToColumn(num) {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  /**
   * Get cell address from row and column
   */
  getCellAddress(row, col) {
    const colLetter = typeof col === 'string' ? col : this.numberToColumn(col);
    return `${colLetter}${row}`;
  }

  /**
   * Find agent row by name
   */
  async findAgentRow(agentName) {
    const nameCol = this.config.agentNameColumn;
    const startRow = this.config.agentStartRow;
    const endRow = this.config.agentEndRow ?? (startRow + 100);
    
    // Search only within configured range (MVP safety)
    for (let row = startRow; row <= endRow; row++) {
      const cellAddress = this.getCellAddress(row, nameCol);
      const cell = await this.adapter.readCell(this.config.sheet, cellAddress);
      
      if (cell.value && cell.value.toString().includes(agentName)) {
        return row;
      }
    }
    
    return null;
  }

  /**
   * Get hour headers from header row
   */
  async getHourHeaders() {
    const sheet = this.adapter.getSheet(this.config.sheet);
    const headerRow = this.config.hourHeaderRow;
    const startCol = this.config.dayStartColumn;
    const endCol = this.config.dayEndColumn;
    
    const startColNum = this.columnToNumber(startCol);
    const endColNum = this.columnToNumber(endCol);
    
    const headers = [];
    
    for (let col = startColNum; col <= endColNum; col++) {
      const colLetter = this.numberToColumn(col);
      const cellAddress = this.getCellAddress(headerRow, colLetter);
      const cell = await this.adapter.readCell(this.config.sheet, cellAddress);
      
      headers.push({
        column: colLetter,
        address: cellAddress,
        value: cell.value
      });
    }
    
    return headers;
  }

  /**
   * Get agent's day range
   */
  getAgentDayRange(agentRow) {
    return {
      startColumn: this.config.dayStartColumn,
      endColumn: this.config.dayEndColumn,
      row: agentRow,
      startAddress: this.getCellAddress(agentRow, this.config.dayStartColumn),
      endAddress: this.getCellAddress(agentRow, this.config.dayEndColumn)
    };
  }

  /**
   * Get all agents
   */
  async getAllAgents() {
    const nameCol = this.config.agentNameColumn;
    const startRow = this.config.agentStartRow;
    const endRow = this.config.agentEndRow ?? (startRow + 100);
    
    const agents = [];
    
    // HARD LIMIT: only rows 57..98 (or configured) are valid agents for MVP
    for (let row = startRow; row <= endRow; row++) {
      const cellAddress = this.getCellAddress(row, nameCol);
      const cell = await this.adapter.readCell(this.config.sheet, cellAddress);
      
      if (cell.value && cell.value.toString().trim()) {
        const name = cell.value.toString().trim();
        agents.push({
          id: `row_${row}`, // stable internal id even when names repeat
          name,
          row: row,
          address: cellAddress
        });
      }
    }
    
    return agents;
  }

  /**
   * Find first empty agent row within configured range
   */
  async findFirstEmptyAgentRow() {
    const nameCol = this.config.agentNameColumn;
    const startRow = this.config.agentStartRow;
    const endRow = this.config.agentEndRow ?? (startRow + 100);

    for (let row = startRow; row <= endRow; row++) {
      const cellAddress = this.getCellAddress(row, nameCol);
      const cell = await this.adapter.readCell(this.config.sheet, cellAddress);
      const v = (cell.value ?? '').toString().trim();
      if (!v) return row;
    }
    return null;
  }

  /**
   * Get palette styles (sites and status)
   */
  async getPaletteStyles() {
    const sites = {};
    const status = {};
    
    // Load site styles
    const siteRange = this.config.palette.sites.range;
    const [startCell, endCell] = siteRange.split(':');
    const startCol = startCell.match(/[A-Z]+/)[0];
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const endRow = parseInt(endCell.match(/\d+/)[0]);
    
    for (let row = startRow; row <= endRow; row++) {
      const cellAddress = this.getCellAddress(row, startCol);
      const cell = await this.adapter.readCell(this.config.sheet, cellAddress);
      const value = this.config.palette.sites.values[cellAddress];
      
      if (value) {
        sites[value] = {
          address: cellAddress,
          style: cell.style
        };
      }
    }
    
    // Load status styles
    const statusRange = this.config.palette.status.range;
    const [statusStartCell, statusEndCell] = statusRange.split(':');
    const statusStartCol = statusStartCell.match(/[A-Z]+/)[0];
    const statusStartRow = parseInt(statusStartCell.match(/\d+/)[0]);
    const statusEndRow = parseInt(statusEndCell.match(/\d+/)[0]);
    
    for (let row = statusStartRow; row <= statusEndRow; row++) {
      const cellAddress = this.getCellAddress(row, statusStartCol);
      const cell = await this.adapter.readCell(this.config.sheet, cellAddress);
      const value = this.config.palette.status.values[cellAddress];
      
      if (value) {
        status[value] = {
          address: cellAddress,
          style: cell.style
        };
      }
    }
    
    return { sites, status };
  }

  /**
   * Apply site style to cell
   */
  async applySiteStyle(targetCellAddress, siteName) {
    const palette = await this.getPaletteStyles();
    const siteInfo = palette.sites[siteName];
    
    if (!siteInfo) {
      throw new Error(`Site "${siteName}" not found in palette`);
    }
    
    await this.adapter.copyStyle(
      this.config.sheet,
      siteInfo.address,
      this.config.sheet,
      targetCellAddress
    );
  }

  /**
   * Apply status style to cell
   */
  async applyStatusStyle(targetCellAddress, statusName) {
    const palette = await this.getPaletteStyles();
    const statusInfo = palette.status[statusName];
    
    if (!statusInfo) {
      throw new Error(`Status "${statusName}" not found in palette`);
    }
    
    await this.adapter.copyStyle(
      this.config.sheet,
      statusInfo.address,
      this.config.sheet,
      targetCellAddress
    );
  }
}

module.exports = ExcelMappingService;
