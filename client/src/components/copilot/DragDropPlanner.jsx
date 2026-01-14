import React, { useState, useEffect } from 'react';
import OverrideModal from './OverrideModal';
import api from '../../services/api';

const DragDropPlanner = ({ date, onPlanChange }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragData, setDragData] = useState(null);
  const [warningData, setWarningData] = useState(null);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const response = await api.get('/planning/daily', { params: { date } });
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [date]);

  const handleDragStart = (event, assignment) => {
    setDragData(assignment);
    event.dataTransfer.effectAllowed = 'move';
    event.target.style.opacity = '0.5';
  };

  const handleDragEnd = (event) => {
    event.target.style.opacity = '1';
    setDragData(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (event, targetRow) => {
    event.preventDefault();
    if (!dragData) return;

    const payload = {
      sourceRow: dragData.row,
      sourceDate: date,
      targetRow,
      targetDate: date,
      force: false
    };

    await executeMove(payload);
  };

  const executeMove = async (payload) => {
    try {
      const response = await api.post('/planning/move', payload);
      if (response.status === 200) {
        fetchPlan();
        setWarningData(null);
        if (typeof onPlanChange === 'function') {
          onPlanChange();
        }
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setWarningData({
          warnings: error.response.data?.warnings || [],
          pendingMove: payload
        });
        return;
      }
      alert(error.response?.data?.message || 'Failed to move assignment');
    }
  };

  const handleConfirmOverride = async () => {
    if (!warningData?.pendingMove) return;
    await executeMove({ ...warningData.pendingMove, force: true });
  };

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginTop: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginTop: 0 }}>Drag & Drop Planner ({date})</h3>
      {loading && <p>Loading daily plan...</p>}
      <div style={{ display: 'table', width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'table-row', background: '#f6f6f6', fontWeight: 'bold' }}>
          <div style={{ display: 'table-cell', padding: '10px', border: '1px solid #ddd', width: '220px' }}>Agent</div>
          <div style={{ display: 'table-cell', padding: '10px', border: '1px solid #ddd' }}>Assignment</div>
        </div>
        {assignments.map(assignment => (
          <div
            key={`${assignment.row}-${assignment.agentName}`}
            style={{ display: 'table-row' }}
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, assignment.row)}
          >
            <div style={{ display: 'table-cell', padding: '10px', border: '1px solid #ddd' }}>
              {assignment.agentName}
            </div>
            <div style={{ display: 'table-cell', padding: '10px', border: '1px solid #ddd', background: assignment.site ? '#e6f7ff' : '#fff' }}>
              {assignment.site ? (
                <div
                  draggable
                  onDragStart={(event) => handleDragStart(event, assignment)}
                  onDragEnd={handleDragEnd}
                  style={{
                    cursor: 'grab',
                    padding: '6px 12px',
                    background: '#1890ff',
                    color: '#fff',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}
                >
                  {assignment.site}
                </div>
              ) : (
                <span style={{ color: '#999' }}>Unassigned</span>
              )}
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
