import React from 'react';

const AlertIcon = ({ severity }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    marginRight: '12px',
    color: 'white',
    fontWeight: 'bold',
    flexShrink: 0,
  };

  if (severity === 'high') return <span style={{ ...baseStyle, backgroundColor: '#ff4d4f' }}>!</span>;
  if (severity === 'medium') return <span style={{ ...baseStyle, backgroundColor: '#faad14' }}>!</span>;
  return <span style={{ ...baseStyle, backgroundColor: '#1890ff' }}>i</span>;
};

const AlertsPanel = ({ alerts }) => {
  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.09)', maxHeight: '420px', overflowY: 'auto' }}>
      <h2 style={{ marginTop: 0 }}>Action Center</h2>
      {alerts && alerts.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {alerts.map((alert, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: index === alerts.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
              <AlertIcon severity={alert.severity} />
              <div>
                <p style={{ margin: 0, fontWeight: '500', color: '#333' }}>{alert.message}</p>
                {alert.site && <small style={{ color: '#888' }}>Site: {alert.site}</small>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>No critical alerts. Coverage looks stable.</p>
      )}
    </div>
  );
};

export default AlertsPanel;
