import React from 'react';

const AlertsPanel = ({ alerts }) => {
  const getAlertStyle = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' };
      case 'MEDIUM':
        return { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700' };
      default:
        return { border: 'border-gray-400', bg: 'bg-gray-50', text: 'text-gray-700' };
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Active Alerts</h2>
      <div className="space-y-2">
        {alerts.map((alert, idx) => {
          const styles = getAlertStyle(alert.severity);
          return (
            <div key={idx} className={`border-l-4 p-3 rounded ${styles.border} ${styles.bg}`}>
              <div className="flex justify-between">
                <span className={`font-bold text-sm ${styles.text}`}>{alert.type}</span>
                <span className="text-xs text-gray-500">{alert.time}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
              <div className="mt-1 text-xs font-semibold text-gray-500">{alert.site}</div>
            </div>
          );
        })}
        {alerts.length === 0 && <p className="text-green-600 text-sm">✅ No conflicts detected.</p>}
      </div>
    </div>
  );
};

export default AlertsPanel;