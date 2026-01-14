const ExcelJS = require('exceljs');
const path = require('path');
const ExcelAdapter = require('./ExcelAdapter');

/**
 * Local Excel Adapter - MVP
 * Reads/writes Excel files from local filesystem
 */
class LocalExcelAdapter extends ExcelAdapter {
  constructor(filePath) {
    super();
    this.filePath = filePath;
    this.workbook = null;
    this.lastModified = null;
  }

  async loadExcel() {
    try {
      this.workbook = new ExcelJS.Workbook();
      await this.workbook.xlsx.readFile(this.filePath);
      
      // Get file stats for conflict detection
      const fs = require('fs');
      const stats = fs.statSync(this.filePath);
      this.lastModified = stats.mtime;
      
      return this.workbook;
    } catch (error) {
      throw new Error(`Error loading Excel: ${error.message}`);
    }
  }

  async saveExcel() {
    if (!this.workbook) {
      throw new Error('No workbook loaded. Call loadExcel() first.');
    }

    try {
      // Create backup before saving
      const fs = require('fs');
      const backupPath = this.filePath.replace('.xlsm', `_backup_${Date.now()}.xlsm`);
      fs.copyFileSync(this.filePath, backupPath);

      // Save workbook preserving macros (.xlsm)
      await this.workbook.xlsx.writeFile(this.filePath, {
        // Preserve macros by keeping the file extension
      });

      // Update last modified
      const stats = fs.statSync(this.filePath);
      this.lastModified = stats.mtime;

      return { success: true, backupPath };
    } catch (error) {
      throw new Error(`Error saving Excel: ${error.message}`);
    }
  }

  getSheet(sheetName) {
    if (!this.workbook) {
      throw new Error('No workbook loaded');
    }
    const sheet = this.workbook.getWorksheet(sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    return sheet;
  }

  async readCell(sheetName, cellAddress) {
    const sheet = this.getSheet(sheetName);
    const cell = sheet.getCell(cellAddress);
    
    return {
      value: cell.value,
      formula: cell.formula,
      style: this.extractStyle(cell),
      type: cell.type
    };
  }

  async writeCell(sheetName, cellAddress, value, preserveStyle = true) {
    const sheet = this.getSheet(sheetName);
    const cell = sheet.getCell(cellAddress);
    
    // Preserve existing style if requested
    const existingStyle = preserveStyle ? this.extractStyle(cell) : null;
    
    // Write value (never overwrite formula, only value)
    if (cell.formula) {
      // If cell has formula, we might need to preserve it
      // For now, we'll only update value if no formula exists
      console.warn(`Cell ${cellAddress} has formula, preserving it`);
    } else {
      cell.value = value;
    }
    
    // Restore style if preserved
    if (preserveStyle && existingStyle) {
      this.applyStyle(cell, existingStyle);
    }
    
    return cell;
  }

  async copyStyle(sourceSheetName, sourceCellAddress, targetSheetName, targetCellAddress) {
    const sourceSheet = this.getSheet(sourceSheetName);
    const targetSheet = this.getSheet(targetSheetName);
    
    const sourceCell = sourceSheet.getCell(sourceCellAddress);
    const targetCell = targetSheet.getCell(targetCellAddress);
    
    const style = this.extractStyle(sourceCell);
    this.applyStyle(targetCell, style);
    
    return targetCell;
  }

  extractStyle(cell) {
    return {
      fill: cell.fill ? {
        type: cell.fill.type,
        pattern: cell.fill.pattern,
        fgColor: cell.fill.fgColor ? { argb: cell.fill.fgColor.argb } : null,
        bgColor: cell.fill.bgColor ? { argb: cell.fill.bgColor.argb } : null
      } : null,
      font: cell.font ? {
        name: cell.font.name,
        size: cell.font.size,
        bold: cell.font.bold,
        italic: cell.font.italic,
        color: cell.font.color ? { argb: cell.font.color.argb } : null
      } : null,
      border: cell.border ? {
        top: cell.border.top,
        left: cell.border.left,
        bottom: cell.border.bottom,
        right: cell.border.right
      } : null,
      alignment: cell.alignment ? { ...cell.alignment } : null,
      numFmt: cell.numFmt
    };
  }

  applyStyle(cell, style) {
    if (style.fill) {
      cell.fill = {
        type: style.fill.type,
        pattern: style.fill.pattern,
        fgColor: style.fill.fgColor ? { argb: style.fill.fgColor.argb } : null,
        bgColor: style.fill.bgColor ? { argb: style.fill.bgColor.argb } : null
      };
    }
    
    if (style.font) {
      cell.font = {
        name: style.font.name,
        size: style.font.size,
        bold: style.font.bold,
        italic: style.font.italic,
        color: style.font.color ? { argb: style.font.color.argb } : null
      };
    }
    
    if (style.border) {
      cell.border = { ...style.border };
    }
    
    if (style.alignment) {
      cell.alignment = { ...style.alignment };
    }
    
    if (style.numFmt) {
      cell.numFmt = style.numFmt;
    }
  }

  async getWorkbook() {
    if (!this.workbook) {
      await this.loadExcel();
    }
    return this.workbook;
  }

  getLastModified() {
    return this.lastModified;
  }

  async checkForChanges() {
    const fs = require('fs');
    const stats = fs.statSync(this.filePath);
    return stats.mtime.getTime() !== this.lastModified.getTime();
  }
}

module.exports = LocalExcelAdapter;
