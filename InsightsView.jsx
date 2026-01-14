import React, { useState, useEffect } from 'react';
import CoverageBoard from '../components/CoverageBoard';
import AlertsPanel from '../components/AlertsPanel';

const InsightsView = () => {
  const [coverage, setCoverage] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [covRes, alertRes] = await Promise.all([
          fetch(`/api/insights/coverage?date=${date}`),
          fetch(`/api/insights/alerts?date=${date}`)
        ]);
        setCoverage(await covRes.json());
        setAlerts(await alertRes.json());
      } catch (error) {
        console.error("Failed to load insights", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date]);

  if (loading) return <div className="p-4">Loading Insights...</div>;

  return (
    <div className="insights-container p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manager Copilot</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 rounded" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CoverageBoard data={coverage} />
        <AlertsPanel alerts={alerts} />
      </div>
    </div>
  );
};

export default InsightsView;