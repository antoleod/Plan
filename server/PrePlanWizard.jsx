import React, { useState } from 'react';

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
  justifyContent: 'center', alignItems: 'center', zIndex: 1001,
};

const modalContentStyle = {
  background: 'white', padding: '24px', borderRadius: '8px', width: '500px',
};

const PrePlanWizard = ({ onClose }) => {
  const [sourceDate, setSourceDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const getMonthYear = (date) => ({
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  });

  const getTargetDate = (date) => {
    const target = new Date(date);
    target.setMonth(target.getMonth() + 1);
    return target;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const source = getMonthYear(sourceDate);
    const target = getMonthYear(getTargetDate(sourceDate));

    try {
      const response = await fetch('/api/preplan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceYear: source.year,
          sourceMonth: source.month,
          targetYear: target.year,
          targetMonth: target.month,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to generate pre-plan.');

      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const source = getMonthYear(sourceDate);
  const target = getMonthYear(getTargetDate(sourceDate));

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <h3>Generate Next Month's Pre-Plan</h3>
        <p>This will copy the schedule from a source month to a target month. This action will overwrite any existing data in the target month.</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>Copy from:</label>
            <input
              type="month"
              value={`${sourceDate.getFullYear()}-${String(sourceDate.getMonth() + 1).padStart(2, '0')}`}
              onChange={e => setSourceDate(new Date(e.target.value + '-02T00:00:00'))} // Use day 2 to avoid timezone issues
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <p>This will generate a plan for: <strong>{target.year}-{String(target.month).padStart(2, '0')}</strong></p>

          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} disabled={isSubmitting}>Close</button>
            <button type="submit" disabled={isSubmitting} style={{ background: '#1890ff', color: 'white', border: 'none' }}>
              {isSubmitting ? 'Generating...' : 'Generate & Overwrite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrePlanWizard;