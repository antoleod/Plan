import React from 'react';

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1100,
};

const modalContentStyle = {
  background: 'white',
  padding: '24px',
  borderRadius: '8px',
  width: '480px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
};

const OverrideModal = ({ warnings = [], onConfirm, onCancel }) => {
  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={{ marginTop: 0, color: '#faad14' }}>Validation Warning</h3>
        <p>The requested move triggers the following checks:</p>
        <ul style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '10px 20px', borderRadius: '4px' }}>
          {warnings.map((warning, index) => (
            <li key={index} style={{ color: '#d48806' }}>{warning}</li>
          ))}
        </ul>
        <p>Would you like to force the assignment anyway?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{ padding: '8px 16px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Force Move
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverrideModal;
