const ExcelMappingService = require('./ExcelMappingService');

/**
 * Service for planning/timesheet operations
 */
class PlanningService {
  constructor(excelAdapter) {
    this.mappingService = new ExcelMappingService(excelAdapter);
    this.adapter = excelAdapter;
    this.config = require('../config/mapping.config.json');
  }

  /**
   * Get agent's week view
   */
  async getAgentWeek(agentName, weekStartDate) {
    const agentRow = await this.mappingService.findAgentRow(agentName);
    if (!agentRow) {
      throw new Error(`Agent "${agentName}" not found`);
    }

    const dayRange = this.mappingService.getAgentDayRange(agentRow);
    const hourHeaders = await this.mappingService.getHourHeaders();
    
    // Parse week data from Excel
    const weekData = [];
    
    // For MVP, we'll return the full day range
    // In production, you'd map this to actual dates
    for (let i = 0; i < 7; i++) {
      const dayData = {
        day: i,
        cells: []
      };
      
      // Read cells in the day range
      const startColNum = this.mappingService.columnToNumber(dayRange.startColumn);
      const endColNum = this.mappingService.columnToNumber(dayRange.endColumn);
      
      for (let col = startColNum; col <= endColNum; col++) {
        const colLetter = this.mappingService.numberToColumn(col);
        const cellAddress = this.mappingService.getCellAddress(agentRow, colLetter);
        const cell = await this.adapter.readCell(this.config.sheet, cellAddress);
        
        dayData.cells.push({
          address: cellAddress,
          column: colLetter,
          value: cell.value,
          style: cell.style
        });
      }
      
      weekData.push(dayData);
    }
    
    return {
      agent: agentName,
      row: agentRow,
      week: weekData,
      hourHeaders
    };
  }

  /**
   * Get manager's full view (all agents)
   */
  async getManagerView() {
    const agents = await this.mappingService.getAllAgents();
    const hourHeaders = await this.mappingService.getHourHeaders();
    
    const view = {
      agents: [],
      hourHeaders
    };
    
    for (const agent of agents) {
      const dayRange = this.mappingService.getAgentDayRange(agent.row);
      const weekData = [];
      
      // Get 7 days of data
      for (let day = 0; day < 7; day++) {
        const dayData = {
          day,
          cells: []
        };
        
        const startColNum = this.mappingService.columnToNumber(dayRange.startColumn);
        const endColNum = this.mappingService.columnToNumber(dayRange.endColumn);
        
        for (let col = startColNum; col <= endColNum; col++) {
          const colLetter = this.mappingService.numberToColumn(col);
          const cellAddress = this.mappingService.getCellAddress(agent.row, colLetter);
          const cell = await this.adapter.readCell(this.config.sheet, cellAddress);
          
          dayData.cells.push({
            address: cellAddress,
            column: colLetter,
            value: cell.value,
            style: cell.style
          });
        }
        
        weekData.push(dayData);
      }
      
      view.agents.push({
        name: agent.name,
        row: agent.row,
        week: weekData
      });
    }
    
    return view;
  }

  /**
   * Update agent's day entry
   */
  async updateAgentDay(agentName, dayIndex, updateData) {
    const agentRow = await this.mappingService.findAgentRow(agentName);
    if (!agentRow) {
      throw new Error(`Agent "${agentName}" not found`);
    }

    const dayRange = this.mappingService.getAgentDayRange(agentRow);
    
    // Calculate which columns to update based on time slots
    // This is simplified - in production, you'd map time slots to columns
    const startColNum = this.mappingService.columnToNumber(dayRange.startColumn);
    
    // Clear existing day range first
    const endColNum = this.mappingService.columnToNumber(dayRange.endColumn);
    for (let col = startColNum; col <= endColNum; col++) {
      const colLetter = this.mappingService.numberToColumn(col);
      const cellAddress = this.mappingService.getCellAddress(agentRow, colLetter);
      await this.adapter.writeCell(this.config.sheet, cellAddress, null, true);
    }
    
    // Apply new schedule
    if (updateData.status && updateData.status !== 'Present') {
      // Apply status style
      await this.mappingService.applyStatusStyle(
        this.mappingService.getCellAddress(agentRow, dayRange.startColumn),
        updateData.status
      );
    }
    
    if (updateData.site) {
      // Write site value (0.5) and apply site style
      const siteCell = this.mappingService.getCellAddress(agentRow, dayRange.startColumn);
      await this.adapter.writeCell(this.config.sheet, siteCell, 0.5, true);
      await this.mappingService.applySiteStyle(siteCell, updateData.site);
    }
    
    // Map time slots to columns (simplified - needs proper time-to-column mapping)
    if (updateData.startTime && updateData.endTime) {
      const timeSlots = this.calculateTimeSlots(updateData.startTime, updateData.endTime, updateData.breakStart, updateData.breakEnd);
      
      for (const slot of timeSlots) {
        const colLetter = this.getColumnForTime(slot.time);
        if (colLetter) {
          const cellAddress = this.mappingService.getCellAddress(agentRow, colLetter);
          await this.adapter.writeCell(this.config.sheet, cellAddress, slot.value || 0.5, true);
          
          if (updateData.site) {
            await this.mappingService.applySiteStyle(cellAddress, updateData.site);
          }
        }
      }
    }
    
    // Save comment if provided
    if (updateData.comment) {
      // Store comment in a separate cell or metadata
      // This depends on Excel structure
    }
    
    return { success: true };
  }

  /**
   * Calculate time slots from start/end times
   */
  calculateTimeSlots(startTime, endTime, breakStart, breakEnd) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      // Check if in break time
      const isBreak = breakStart && breakEnd && 
        timeStr >= breakStart && timeStr < breakEnd;
      
      slots.push({
        time: timeStr,
        value: isBreak ? null : 0.5
      });
      
      // Increment by 30 minutes
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return slots;
  }

  /**
   * Get column letter for a given time (simplified - needs proper mapping)
   */
  getColumnForTime(time) {
    // This needs to map time strings to actual column letters
    // For now, return a placeholder
    // In production, use hourHeaders from mapping service
    return null;
  }

  /**
   * Validate time entry
   */
  validateTimeEntry(entry) {
    const errors = [];
    
    if (entry.startTime) {
      const [hour] = entry.startTime.split(':').map(Number);
      if (hour < 8 || hour >= 20) {
        errors.push('Start time must be between 08:00 and 20:00');
      }
    }
    
    if (entry.endTime) {
      const [hour] = entry.endTime.split(':').map(Number);
      if (hour < 8 || hour > 20) {
        errors.push('End time must be between 08:00 and 20:00');
      }
    }
    
    if (entry.startTime && entry.endTime) {
      const [startHour, startMin] = entry.startTime.split(':').map(Number);
      const [endHour, endMin] = entry.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        errors.push('End time must be after start time');
      }
      
      const duration = (endMinutes - startMinutes) / 60;
      if (duration > 12) {
        errors.push('Shift duration cannot exceed 12 hours');
      }
    }
    
    return errors;
  }
}

module.exports = PlanningService;
