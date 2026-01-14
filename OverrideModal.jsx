import React, { useState } from 'react';

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
};

const modalContentStyle = {
  background: 'white', padding: '24px', borderRadius: '8px', width: '450px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
};

const OverrideModal = ({ warnings, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('A justification is required to override rules.');
      return;
    }
    onConfirm(reason);
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={{ marginTop: 0, color: '#faad14' }}>⚠️ Validation Warning</h3>
        <p>The requested move violates the following rules:</p>
        <ul style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '10px 20px', borderRadius: '4px' }}>
          {warnings.map((w, i) => <li key={i} style={{ color: '#d48806' }}>{w}</li>)}
        </ul>
        
        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' }}>
            Justification for Override (Required):
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            placeholder="e.g., Authorized by HR due to emergency..."
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: error ? '1px solid red' : '1px solid #ccc', minHeight: '60px' }}
          />
          {error && <p style={{ color: 'red', fontSize: '0.8em', marginTop: '4px' }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={handleConfirm} 
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