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

  const getCellValue = (cell) => {
    if (cell.value === null || cell.value === undefined) return '';
    if (typeof cell.value === 'number') {
      return cell.value === 0.5 ? '0.5' : cell.value.toString();
    }
    return cell.value.toString();
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
                {agent.week.map((day, dayIdx) => (
                  <td
                    key={dayIdx}
                    className={`day-cell ${editable ? 'editable' : ''}`}
                    onClick={() => editable && onCellClick && onCellClick(agent, dayIdx)}
                    style={getCellStyle(day.cells[0] || {})}
                  >
                    <div className="cell-content">
                      {getCellValue(day.cells[0] || {})}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PlanningGrid;
