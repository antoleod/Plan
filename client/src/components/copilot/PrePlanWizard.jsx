import React, { useState } from 'react';
import api from '../../services/api';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1005,
};

const contentStyle = {
  background: '#fff',
  padding: '24px',
  borderRadius: '10px',
  width: '460px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
};

const PrePlanWizard = ({ onClose, onSuccess }) => {
  const [sourceDate, setSourceDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const getMonthYear = (value) => {
    const [year, month] = value.split('-').map(Number);
    return { year, month };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const source = getMonthYear(sourceDate);
    const targetMonth = source.month === 12 ? 1 : source.month + 1;
    const targetYear = source.month === 12 ? source.year + 1 : source.year;

    try {
      const response = await api.post('/preplan/generate', {
        sourceYear: source.year,
        sourceMonth: source.month,
        targetYear,
        targetMonth
      });
      setMessage(response.data?.message || 'Pre-plan generated successfully.');
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (submissionError) {
      setError(submissionError.response?.data?.message || 'Failed to generate pre-plan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={event => event.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Pre-plan Next Month</h3>
        <p>Select a source month and the system will copy it to the following month.</p>
        <form onSubmit={handleSubmit}>
          <label>Source month</label>
          <input
            type="month"
            value={sourceDate}
            onChange={event => setSourceDate(event.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '6px', marginBottom: '10px' }}
          />
          {error && <p style={{ color: '#ff4d4f' }}>{error}</p>}
          {message && <p style={{ color: '#52c41a' }}>{message}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} disabled={isLoading}>Close</button>
            <button
              type="submit"
              disabled={isLoading}
              style={{ background: '#1890ff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}
            >
              {isLoading ? 'Generating...' : 'Generate Pre-plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrePlanWizard;
