import React from 'react';

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
};

const modalContentStyle = {
  background: 'white', padding: '24px', borderRadius: '8px', width: '450px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
};

const OverrideModal = ({ warnings, onConfirm, onCancel }) => {
  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={{ marginTop: 0, color: '#faad14' }}>⚠️ Validation Warning</h3>
        <p>The requested move violates the following rules:</p>
        <ul style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '10px 20px', borderRadius: '4px' }}>
          {warnings.map((w, i) => <li key={i} style={{ color: '#d48806' }}>{w}</li>)}
        </ul>
        <p>Do you want to force this assignment anyway?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={onConfirm} 
            style={{ padding: '8px 16px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Force Override
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverrideModal;