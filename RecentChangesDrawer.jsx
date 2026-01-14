import React, { useState, useEffect } from 'react';

const drawerStyle = (isOpen) => ({
  position: 'fixed',
  top: 0,
  right: 0,
  width: '400px',
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

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/audit')
        .then(res => res.json())
        .then(data => {
          setLogs(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch audit logs:", err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const formatTimestamp = (ts) => {
    return new Date(ts).toLocaleString();
  }

  return (
    <div style={drawerStyle(isOpen)}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>Recent Changes</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
      </div>
      <div style={contentStyle}>
        {loading && <p>Loading...</p>}
        {!loading && logs.length === 0 && <p>No recent changes found.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {logs.map((log, index) => (
            <li key={index} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
              <strong style={{ color: '#1890ff' }}>{log.action}</strong> by <strong>{log.user}</strong>
              <div style={{ fontSize: '0.9em', color: '#555' }}>{formatTimestamp(log.timestamp)}</div>
              <pre style={{ fontSize: '0.8em', background: '#fafafa', padding: '8px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(log.details, null, 2)}</pre>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RecentChangesDrawer;