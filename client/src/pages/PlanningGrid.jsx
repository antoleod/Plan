import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EditDaySlideOver from '../components/EditDaySlideOver';

const GridDisplay = ({ data, onCellClick, editable }) => {
  if (!data || !data.agents) return <p className="text-slate-500">Loading grid data...</p>;
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 bg-slate-50 px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider z-10">Agent</th>
              {dayNames.map((day, idx) => (
                <th key={idx} className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.agents.map((agent, agentIdx) => (
              <tr key={agent.row || agentIdx} className="hover:bg-slate-50">
                <td className="sticky left-0 bg-white hover:bg-slate-50 px-4 py-2 font-medium text-slate-900 whitespace-nowrap z-10">{agent.name}</td>
                {agent.week.map((day, dayIdx) => {
                  const summary = day.summary || {};
                  const site = summary.site;
                  const status = summary.status;
                  const segmentsText = summary.segmentsText;
                  return (
                    <td key={dayIdx} className={`px-4 py-3 whitespace-nowrap text-center ${editable ? 'cursor-pointer' : ''}`} onClick={() => editable && onCellClick(agent, day, dayIdx)}>
                      <div className="font-medium text-slate-800">{site || <span className="text-slate-400 font-normal">OFF</span>}</div>
                      <div className="text-xs text-slate-500">{segmentsText || (status !== 'OFF' ? status : '')}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PlanningGrid = ({ readOnly = false }) => {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isSlideOverOpen, setSlideOverOpen] = useState(false);

  const isManager = user?.role === 'manager';
  const editable = isManager && !readOnly;

  useEffect(() => {
    loadData();
  }, [user, token]);

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      let url = '/api/planning/manager'; // Default for manager
      if (!isManager && user?.name) {
        // The backend returns week data for a specific agent
        url = `/api/planning/agent/${encodeURIComponent(user.name)}/week`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch planning data: ${response.statusText}`);
      }

      let responseData = await response.json();

      // Agent data comes as a single object, wrap it in an array to match the manager's data structure
      if (!isManager) {
        responseData = { agents: [responseData] };
      }

      setData(responseData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load planning data. Please check the connection to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (agent, day, dayIndex) => {
    const summary = day.summary || {};
    setSelectedCell({
      agentName: agent.name,
      date: day.date, // NOTE: This relies on the backend providing the date for each day.
      site: summary.site,
      status: summary.status,
      dayIndex: dayIndex
    });
    setSlideOverOpen(true);
  };

  const handleSave = async (updateData) => {
    if (!token || !selectedCell) return;
    const { agentName, dayIndex } = selectedCell;
    const url = `/api/planning/agent/${encodeURIComponent(agentName)}/day/${dayIndex}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData)
      });
      if (!response.ok) throw new Error('Failed to save changes.');
      handleClose();
      await loadData(); // Refresh data
    } catch (err) {
      console.error(err);
      setError('Failed to save changes.');
    }
  };

  const handleClose = () => {
    setSlideOverOpen(false);
    setSelectedCell(null);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#002244] mb-6">Planning Grid</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
      <GridDisplay data={data} onCellClick={editable ? handleCellClick : null} editable={editable} />
      {selectedCell && <EditDaySlideOver isOpen={isSlideOverOpen} onClose={handleClose} onSave={handleSave} data={selectedCell} isManager={isManager} />}
    </div>
  );
};

export default PlanningGrid;