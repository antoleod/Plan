import React, { useState, useEffect } from 'react';
import OverrideModal from './OverrideModal';

const DragDropPlanner = ({ date }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragData, setDragData] = useState(null);
  const [warningData, setWarningData] = useState(null); // { warnings: [], pendingMove: {} }

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/planning/daily?date=${date}`);
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [date]);

  const handleDragStart = (e, assignment) => {
    setDragData(assignment);
    e.dataTransfer.effectAllowed = 'move';
    // Visual feedback
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDragData(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetRow) => {
    e.preventDefault();
    if (!dragData) return;

    const movePayload = {
      sourceRow: dragData.row,
      sourceDate: date,
      targetRow: targetRow,
      targetDate: date, // For now, same day moves
    };

    // Initial attempt without override
    await executeMove(movePayload, null);
  };

  const executeMove = async (changes, override = null) => {
    try {
      const res = await fetch('/api/planning/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MOVE',
          changes: changes,
          override: override
        })
      });

      if (res.status === 409) {
        const data = await res.json();
        // If backend suggests a replacement, add it to warnings
        const warnings = data.suggestion ? [...data.warnings, data.suggestion] : data.warnings;
        setWarningData({ warnings: warnings, pendingMove: changes });
        return;
      }

      if (!res.ok) throw new Error('Move failed');

      // Success
      fetchPlan(); // Refresh grid
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmOverride = async (reason) => {
    if (warningData) {
      await executeMove(warningData.pendingMove, { allowed: true, reason });
      setWarningData(null);
    }
  };

  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
      <h3>Planning Grid ({date})</h3>
      {loading && <p>Loading...</p>}
      
      <div style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
        <div style={{ display: 'table-row', background: '#f0f0f0', fontWeight: 'bold' }}>
          <div style={{ display: 'table-cell', padding: '10px', border: '1px solid #ddd' }}>Agent</div>
          <div style={{ display: 'table-cell', padding: '10px', border: '1px solid #ddd' }}>Assignment (Drag me)</div>
        </div>
        
        {assignments.map((a) => (
          <div 
            key={a.row} 
            style={{ display: 'table-row' }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, a.row)}
          >
            <div style={{ display: 'table-cell', padding: '10px', border: '1px solid #ddd', width: '200px' }}>
              {a.agentName}
            </div>
            <div style={{ display: 'table-cell', padding: '10px', border: '1px solid #ddd', background: a.site ? '#e6f7ff' : 'white' }}>
              {a.site ? (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, a)}
                  onDragEnd={handleDragEnd}
                  style={{ 
                    cursor: 'grab', 
                    padding: '4px 8px', 
                    background: '#1890ff', 
                    color: 'white', 
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}
                >
                  {a.site}
                </div>
              ) : <span style={{ color: '#ccc' }}>Empty</span>}
            </div>
          </div>
        ))}
      </div>

      {warningData && (
        <OverrideModal 
          warnings={warningData.warnings} 
          onConfirm={handleConfirmOverride} 
          onCancel={() => setWarningData(null)} 
        />
      )}
    </div>
  );
};

export default DragDropPlanner;