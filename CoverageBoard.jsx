import React from 'react';

const CoverageBoard = ({ data }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'OK': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Site Coverage</h2>
      <div className="space-y-3">
        {data.map((site) => (
          <div key={site.site} className={`p-3 rounded border flex justify-between items-center ${getStatusColor(site.status)}`}>
            <div>
              <span className="font-medium block">{site.site}</span>
              <span className="text-xs opacity-75">Target: {site.target} | Min: {site.min}</span>
            </div>
            <div className="text-2xl font-bold">
              {site.current}
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-gray-500">No data for this day.</p>}
      </div>
    </div>
  );
};

export default CoverageBoard;