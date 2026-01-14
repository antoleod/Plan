/**
 * Service for mapping time slots to Excel columns
 * This is critical for proper time-to-column mapping
 */
class TimeMappingService {
  constructor(mappingService) {
    this.mappingService = mappingService;
    this.config = require('../config/mapping.config.json');
  }

  /**
   * Get column letter for a specific time
   * This maps time strings (e.g., "08:00") to Excel column letters
   */
  async getColumnForTime(time) {
    const hourHeaders = await this.mappingService.getHourHeaders();
    
    // Find the header that matches this time
    const matchingHeader = hourHeaders.find(h => {
      const headerValue = h.value?.toString() || '';
      return headerValue.includes(time) || headerValue === time;
    });
    
    return matchingHeader ? matchingHeader.column : null;
  }

  /**
   * Get all columns for a time range
   */
  async getColumnsForTimeRange(startTime, endTime, breakStart = null, breakEnd = null) {
    const hourHeaders = await this.mappingService.getHourHeaders();
    const columns = [];
    
    // Parse times
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const [breakStartH, breakStartM] = breakStart ? breakStart.split(':').map(Number) : [null, null];
    const [breakEndH, breakEndM] = breakEnd ? breakEnd.split(':').map(Number) : [null, null];
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const breakStartMinutes = breakStart ? breakStartH * 60 + breakStartM : null;
    const breakEndMinutes = breakEnd ? breakEndH * 60 + breakEndM : null;
    
    // Map each time slot to a column
    for (const header of hourHeaders) {
      const headerTime = this.parseHeaderTime(header.value);
      if (!headerTime) continue;
      
      const headerMinutes = headerTime.hour * 60 + headerTime.minute;
      
      if (headerMinutes >= startMinutes && headerMinutes < endMinutes) {
        // Check if in break time
        const isBreak = breakStartMinutes && breakEndMinutes &&
          headerMinutes >= breakStartMinutes && headerMinutes < breakEndMinutes;
        
        columns.push({
          column: header.column,
          address: this.mappingService.getCellAddress(0, header.column), // row will be set later
          time: `${String(headerTime.hour).padStart(2, '0')}:${String(headerTime.minute).padStart(2, '0')}`,
          isBreak,
          value: isBreak ? null : 0.5
        });
      }
    }
    
    return columns;
  }

  /**
   * Parse header value to extract time
   * Handles various formats: "08:00", "8:00", "08:00-08:30", etc.
   */
  parseHeaderTime(headerValue) {
    if (!headerValue) return null;
    
    const str = headerValue.toString().trim();
    
    // Try to extract time (HH:MM format)
    const timeMatch = str.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      return {
        hour: parseInt(timeMatch[1]),
        minute: parseInt(timeMatch[2])
      };
    }
    
    return null;
  }

  /**
   * Calculate time slots for a shift
   */
  calculateTimeSlots(startTime, endTime, breakStart, breakEnd, intervalMinutes = 30) {
    const slots = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const [breakStartH, breakStartM] = breakStart ? breakStart.split(':').map(Number) : [null, null];
    const [breakEndH, breakEndM] = breakEnd ? breakEnd.split(':').map(Number) : [null, null];
    
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const breakStartMinutes = breakStart ? breakStartH * 60 + breakStartM : null;
    const breakEndMinutes = breakEnd ? breakEndH * 60 + breakEndM : null;
    
    while (currentMinutes < endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      const isBreak = breakStartMinutes && breakEndMinutes &&
        currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes;
      
      slots.push({
        time: timeStr,
        isBreak,
        value: isBreak ? null : 0.5
      });
      
      currentMinutes += intervalMinutes;
    }
    
    return slots;
  }
}

module.exports = TimeMappingService;
