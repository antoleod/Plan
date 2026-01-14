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
   * Convert slots (PB..PY) into contiguous segments.
   * slots: [{ idx, timeStart, timeEnd, filled }]
   */
  slotsToSegments(slots) {
    const segments = [];
    let current = null;

    for (const s of slots) {
      if (!s.filled) {
        if (current) {
          segments.push(current);
          current = null;
        }
        continue;
      }

      if (!current) {
        current = { start: s.timeStart, end: s.timeEnd };
      } else if (current.end === s.timeStart) {
        current.end = s.timeEnd;
      } else {
        segments.push(current);
        current = { start: s.timeStart, end: s.timeEnd };
      }
    }

    if (current) segments.push(current);
    return segments;
  }

  timeStrToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  minutesToTimeStr(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Build canonical times for each column from dayStartColumn with slotMinutes.
   * Assumption (validated in this Excel): PB..PY = 24 slots at 30m from 08:00 to 20:00.
   */
  buildSlotTimes(startColLetter, endColLetter) {
    const startColNum = this.mappingService.columnToNumber(startColLetter);
    const endColNum = this.mappingService.columnToNumber(endColLetter);
    const slotMinutes = this.config.slotMinutes ?? 30;
    const windowStart = this.config.timeWindow?.start ?? '08:00';

    const startMin = this.timeStrToMinutes(windowStart);
    const slots = [];

    let idx = 0;
    for (let col = startColNum; col <= endColNum; col++, idx++) {
      const colLetter = this.mappingService.numberToColumn(col);
      const t0 = startMin + idx * slotMinutes;
      const t1 = t0 + slotMinutes;
      slots.push({
        colLetter,
        idx,
        timeStart: this.minutesToTimeStr(t0),
        timeEnd: this.minutesToTimeStr(t1),
      });
    }

    return slots;
  }

  getCellFillArgb(cell) {
    const argb = cell?.style?.fill?.fgColor?.argb;
    return argb || null;
  }

  /**
   * Detect site/status by matching fill ARGB against palette cells.
   * Returns { site: string|null|'Multiple', status: string|null|'Multiple' }
   */
  async detectDayMeta(cells) {
    const palette = await this.mappingService.getPaletteStyles();

    const siteByArgb = new Map();
    for (const [name, info] of Object.entries(palette.sites)) {
      const argb = info?.style?.fill?.fgColor?.argb;
      if (argb) siteByArgb.set(argb, name);
    }

    const statusByArgb = new Map();
    for (const [name, info] of Object.entries(palette.status)) {
      const argb = info?.style?.fill?.fgColor?.argb;
      if (argb) statusByArgb.set(argb, name);
    }

    const siteSet = new Set();
    const statusSet = new Set();

    for (const c of cells) {
      const filled = c.value !== null && c.value !== undefined && c.value !== '' && c.value !== 0;
      if (!filled) continue;

      const argb = this.getCellFillArgb(c);
      if (!argb) continue;

      const site = siteByArgb.get(argb);
      if (site) siteSet.add(site);

      const st = statusByArgb.get(argb);
      if (st) statusSet.add(st);
    }

    const site = siteSet.size === 0 ? null : (siteSet.size === 1 ? [...siteSet][0] : 'Multiple');
    const status = statusSet.size === 0 ? null : (statusSet.size === 1 ? [...statusSet][0] : 'Multiple');

    return { site, status };
  }

  /**
   * Build UI-friendly summary for a day from its cells.
   * Optimized: Cache palette to avoid repeated lookups
   */
  async buildDaySummary(dayCells, dayRange) {
    if (!dayCells || dayCells.length === 0) {
      return {
        segments: [],
        segmentsText: '',
        site: null,
        status: null,
        bgArgb: null,
        style: null
      };
    }

    const slotTimes = this.buildSlotTimes(dayRange.startColumn, dayRange.endColumn);
    const slots = slotTimes.map((s, i) => {
      const c = dayCells[i];
      const filled = c?.value === 0.5 || (typeof c?.value === 'number' && c?.value !== 0) || (!!c?.value && c?.value !== '');
      return { ...s, filled };
    });

    const segments = this.slotsToSegments(slots);
    const segmentsText =
      segments.length === 0
        ? ''
        : segments.map(seg => `${seg.start}–${seg.end}`).join(' + ');

    const meta = await this.detectDayMeta(dayCells);

    // background from first filled cell (optional)
    const firstFilled = dayCells.find(c => c?.value === 0.5 || (!!c?.value && c?.value !== ''));
    const bgArgb = this.getCellFillArgb(firstFilled);

    return {
      segments,
      segmentsText,
      site: meta.site,
      status: meta.status,
      bgArgb,
      style: firstFilled?.style || null
    };
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

      dayData.summary = await this.buildDaySummary(dayData.cells, dayRange);
      // Also set daySummary for compatibility
      dayData.daySummary = dayData.summary;
      
      weekData.push(dayData);
    }
    
    return {
      agent: agentName,
      row: agentRow,
      id: `agent_${agentRow}`,
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

        dayData.summary = await this.buildDaySummary(dayData.cells, dayRange);
        // Also set daySummary for compatibility
        dayData.daySummary = dayData.summary;
        
        weekData.push(dayData);
      }
      
      view.agents.push({
        id: agent.id ?? `row_${agent.row}`,
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
    
    // Validation for events
    if (updateData.eventType === 'Unexpected issue' && (!updateData.comment || !updateData.comment.trim())) {
      throw new Error('Comment is required for Unexpected issue');
    }

    // Build list of segments to write
    let segments = [];
    if (Array.isArray(updateData.segments) && updateData.segments.length > 0) {
      segments = updateData.segments
        .filter(s => s?.start && s?.end)
        .slice(0, 3)
        .map(s => ({ start: s.start, end: s.end }));
    } else if (updateData.startTime && updateData.endTime) {
      // Simple template mode: start + break + auto end (or provided end)
      // Write presence excluding break if provided
      const breakStart = updateData.breakStart;
      const breakEnd = updateData.breakEnd;
      if (breakStart && breakEnd && breakStart < breakEnd) {
        segments = [
          { start: updateData.startTime, end: breakStart },
          { start: breakEnd, end: updateData.endTime }
        ].filter(s => s.start < s.end);
      } else {
        segments = [{ start: updateData.startTime, end: updateData.endTime }];
      }
    } else if (updateData.status && updateData.status !== 'Present') {
      // Status-only day (e.g., Travel) may have no hours
      segments = [];
    }

    // Prepare slot mapping for PB..PY
    const slotTimes = this.buildSlotTimes(dayRange.startColumn, dayRange.endColumn);
    const slotMinutes = this.config.slotMinutes ?? 30;
    const segmentRanges = segments.map(s => ({
      startMin: this.timeStrToMinutes(s.start),
      endMin: this.timeStrToMinutes(s.end)
    }));

    // Apply per-slot writing
    for (const slot of slotTimes) {
      const slotStartMin = this.timeStrToMinutes(slot.timeStart);
      const slotEndMin = slotStartMin + slotMinutes;
      const isInAnySegment = segmentRanges.some(r => slotStartMin >= r.startMin && slotEndMin <= r.endMin);

      if (!isInAnySegment) continue;

      const cellAddress = this.mappingService.getCellAddress(agentRow, slot.colLetter);
      await this.adapter.writeCell(this.config.sheet, cellAddress, 0.5, true);

      if (updateData.site) {
        await this.mappingService.applySiteStyle(cellAddress, updateData.site);
      }
      if (updateData.status) {
        await this.mappingService.applyStatusStyle(cellAddress, updateData.status);
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
   * Add agent into first empty row within configured range (57..98).
   * Writes only value into Planning!B{row} and preserves style/layout.
   */
  async addAgent({ fullName }) {
    const name = (fullName ?? '').toString().trim();
    if (!name) throw new Error('fullName is required');

    const emptyRow = await this.mappingService.findFirstEmptyAgentRow();
    if (!emptyRow) {
      throw new Error(`No hay espacio disponible (${this.config.agentStartRow}–${this.config.agentEndRow ?? '?'})`);
    }

    const cellAddress = this.mappingService.getCellAddress(emptyRow, this.config.agentNameColumn);
    await this.adapter.writeCell(this.config.sheet, cellAddress, name, true);

    return { row: emptyRow, name, id: `row_${emptyRow}` };
  }

  /**
   * Validate time entry
   */
  validateTimeEntry(entry) {
    const errors = [];

    // Advanced segments validation (1..3)
    if (Array.isArray(entry.segments) && entry.segments.length > 0) {
      const segments = entry.segments.slice(0, 3);
      for (const seg of segments) {
        if (!seg.start || !seg.end) {
          errors.push('Each segment must have start and end');
          continue;
        }
        if (seg.start < (this.config.timeWindow?.start ?? '08:00') || seg.end > (this.config.timeWindow?.end ?? '20:00')) {
          errors.push('Segment time must be within 08:00 and 20:00');
        }
        if (seg.end <= seg.start) {
          errors.push('Segment end must be after start');
        }
      }
      if (entry.eventType === 'Unexpected issue' && (!entry.comment || !entry.comment.trim())) {
        errors.push('Comment is required for Unexpected issue');
      }
      return errors;
    }
    
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
