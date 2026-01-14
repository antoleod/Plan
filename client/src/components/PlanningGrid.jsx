import { useState, useEffect } from 'react';
import api from '../services/api';
import './PlanningGrid.css';

function PlanningGrid({ data, onCellClick, editable = false }) {
  const [palette, setPalette] = useState(null);

  useEffect(() => {
    loadPalette();
  }, []);

  const loadPalette = async () => {
    try {
      const response = await api.get('/planning/palette');
      setPalette(response.data);
    } catch (err) {
      console.error('Error loading palette:', err);
    }
  };

  const getCellStyle = (cell) => {
    if (!cell.style || !cell.style.fill) return {};
    
    const fill = cell.style.fill;
    if (fill.fgColor && fill.fgColor.argb) {
      // Convert ARGB to RGB
      const argb = fill.fgColor.argb;
      const rgb = argb.substring(2); // Remove 'FF' prefix
      return {
        backgroundColor: `#${rgb}`
      };
    }
    return {};
  };

  const getCellValue = (day) => {
    // Use daySummary or summary if available (new format with segments)
    const summary = day.daySummary || day.summary;
    if (summary?.segmentsText) {
      return summary.segmentsText;
    }
    // Fallback to old format
    const cell = day.cells?.[0] || {};
    if (cell.value === null || cell.value === undefined) return '';
    if (typeof cell.value === 'number') {
      return cell.value === 0.5 ? '0.5' : cell.value.toString();
    }
    return cell.value.toString();
  };

  const getCellSite = (day) => {
    const summary = day.daySummary || day.summary;
    if (summary?.site) {
      return summary.site;
    }
    return null;
  };

  const getCellStatus = (day) => {
    const summary = day.daySummary || day.summary;
    if (summary?.status) {
      return summary.status;
    }
    return null;
  };

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="planning-grid-container">
      <div className="planning-grid-wrapper">
        <table className="planning-grid">
          <thead>
            <tr>
              <th className="sticky-col">Agente</th>
              {dayNames.map((day, idx) => (
                <th key={idx} className="day-header">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.agents.map((agent, agentIdx) => (
              <tr key={agentIdx}>
                <td className="sticky-col agent-name">{agent.name}</td>
                {agent.week.map((day, dayIdx) => {
                  const segmentsText = getCellValue(day);
                  const site = getCellSite(day);
                  const status = getCellStatus(day);
                  const summary = day.daySummary || day.summary;
                  const firstCell = day.cells?.[0] || {};
                  const cellStyle = getCellStyle(summary?.style || firstCell);
                  
                  return (
                    <td
                      key={dayIdx}
                      className={`day-cell ${editable ? 'editable' : ''}`}
                      onClick={() => editable && onCellClick && onCellClick(agent, dayIdx)}
                      style={cellStyle}
                      title={segmentsText || 'Sin horario'}
                    >
                      <div className="cell-content">
                        {segmentsText && (
                          <div className="cell-segments">{segmentsText}</div>
                        )}
                        {(site || status) && (
                          <div className="cell-badges">
                            {site && <span className="badge badge-site">{site}</span>}
                            {status && status !== 'Present' && (
                              <span className="badge badge-status">{status}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PlanningGrid;
