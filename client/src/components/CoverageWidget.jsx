import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CoverageWidget = () => {
  const [coverage, setCoverage] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchCoverage = async () => {
    try {
      const res = await fetch('/api/insights/coverage', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch coverage');
      const data = await res.json();
      setCoverage(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCoverage();
      const interval = setInterval(fetchCoverage, 60000); // Refresca cada 60 segundos
      return () => clearInterval(interval);
    }
  }, [token]);

  const StatusIndicator = ({ status }) => {
    const colorMap = {
      red: 'bg-red-500',
      yellow: 'bg-yellow-400',
      green: 'bg-green-500',
    };
    return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colorMap[status]}`}></span>;
  };

  if (loading) {
    return <div className="px-4 py-2 text-xs text-blue-300">Loading coverage...</div>;
  }

  return (
    <div className="px-4 py-4 border-t border-b border-blue-900/50">
      <h3 className="px-2 mb-3 text-[10px] font-bold text-blue-300 uppercase tracking-widest opacity-80">
        Live Coverage
      </h3>
      <ul className="space-y-2">
        {coverage.map(({ site, status, current, target }) => (
          <li key={site} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-[#002244]">
            <div className="flex items-center"><StatusIndicator status={status} /><span className="ml-2.5 text-blue-100">{site}</span></div>
            <span className={`font-mono text-xs ${status === 'red' ? 'text-red-400' : 'text-blue-200'}`}>{current}/{target}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CoverageWidget;