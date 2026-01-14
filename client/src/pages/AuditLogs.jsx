import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    
    const fetchLogs = () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      fetch(`/api/audit?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        setLogs(data);
      })
      .catch(err => {
        console.error(err);
        setLogs([]); // Clear logs on error
      })
      .finally(() => setLoading(false));
    };
    fetchLogs();
  }, [startDate, endDate, token]);

  return (
    <div className="p-8 bg-[#F1F5F9] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#002244]">System Audit Logs</h1>
          <div className="flex items-center space-x-4">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input px-3 py-2 border-slate-300 rounded-md shadow-sm text-sm"/>
            <span className="text-slate-500">to</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input px-3 py-2 border-slate-300 rounded-md shadow-sm text-sm"/>
          </div>
        </div>
        {/* El resto de tu componente de tabla para mostrar los logs iría aquí */}
        <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500">{loading ? 'Loading audit trail...' : `Found ${logs.length} log entries.`}</p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;