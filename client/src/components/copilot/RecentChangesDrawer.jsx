import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const drawerStyle = (isOpen) => ({
  position: 'fixed',
  top: 0,
  right: 0,
  width: '360px',
  height: '100%',
  backgroundColor: 'white',
  boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
  transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
  transition: 'transform 0.3s ease-in-out',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
});

const headerStyle = {
  padding: '16px',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const contentStyle = {
  padding: '16px',
  overflowY: 'auto',
  flexGrow: 1,
};

const RecentChangesDrawer = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoading(true);
      setError(null);
      api.get('/reports/audit')
        .then(response => {
          if (isMounted) {
            setLogs(response.data);
            setLoading(false);
          }
        })
        .catch(fetchError => {
          if (isMounted) {
            setError('Failed to load audit log');
            setLoading(false);
          }
          console.error(fetchError);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const formatTimestamp = (ts) => new Date(ts).toLocaleString();

  return (
    <div style={drawerStyle(isOpen)}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>Recent Changes</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
      </div>
      <div style={contentStyle}>
        {loading && <p>Loading audit log...</p>}
        {error && <p style={{ color: '#ff4d4f' }}>{error}</p>}
        {!loading && logs.length === 0 && !error && <p>No recent changes.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {logs.map((logEntry, index) => (
            <li key={index} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
              <strong style={{ color: '#1890ff' }}>{logEntry.action}</strong> by <strong>{logEntry.user}</strong>
              <div style={{ fontSize: '0.9em', color: '#555' }}>{formatTimestamp(logEntry.timestamp)}</div>
              <pre style={{ fontSize: '0.75em', background: '#fafafa', padding: '8px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(logEntry.details, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecentChangesDrawer;
