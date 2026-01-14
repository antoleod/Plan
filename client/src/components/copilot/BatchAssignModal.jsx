import React, { useState } from 'react';
import api from '../../services/api';

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
  zIndex: 1001,
};

const modalContentStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '8px',
  width: '420px',
  boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
};

const BatchAssignModal = ({ selectedAgentRows, date, onClose, onAssignSuccess }) => {
  const [site, setSite] = useState('');
  const [status, setStatus] = useState('Present');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const availableSites = ['WD Spinelli', 'WD Kohl', 'WD Martens', 'WD LUX/STR', 'Serv. phone'];
  const availableStatuses = ['Present', 'Mission', 'Training', 'Break', 'Leave', 'Maladie'];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/planning/batch-assign', {
        agentRowNumbers: selectedAgentRows,
        date,
        template: { site, status }
      });
      onAssignSuccess();
      onClose();
    } catch (submissionError) {
      setError(submissionError.response?.data?.message || 'Batch assignment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={event => event.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Batch Assign ({selectedAgentRows.length} agents)</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label>Site</label>
            <select value={site} onChange={event => setSite(event.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
              <option value="" disabled>Select a site</option>
              {availableSites.map(siteOption => (
                <option key={siteOption} value={siteOption}>{siteOption}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>Status</label>
            <select value={status} onChange={event => setStatus(event.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
              {availableStatuses.map(statusOption => (
                <option key={statusOption} value={statusOption}>{statusOption}</option>
              ))}
            </select>
          </div>
          {error && <p style={{ color: '#ff4d4f' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" disabled={isSubmitting || !site} style={{ background: '#1890ff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}>
              {isSubmitting ? 'Applying...' : 'Apply to selected agents'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchAssignModal;
