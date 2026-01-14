import React, { useState, useEffect } from 'react';
import CoverageBoard from '../components/Copilot/CoverageBoard';
import AlertsPanel from '../components/Copilot/AlertsPanel';
import RecentChangesDrawer from '../components/Audit/RecentChangesDrawer';
import BatchAssignModal from '../components/Planning/BatchAssignModal';
import DragDropPlanner from '../components/Planning/DragDropPlanner';
import PrePlanWizard from '../components/Planning/PrePlanWizard';

const ManagerCopilot = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isPrePlanWizardOpen, setIsPrePlanWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'planning'
  // Placeholder para la selección de agentes. En una grilla real, esto se manejaría con checkboxes.
  const [selectedAgentRows, setSelectedAgentRows] = useState([]);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/insights/daily?date=${selectedDate}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setInsights(data);
      } catch (e) {
        setError(e.message);
        console.error("Failed to fetch insights:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleBatchAssignSuccess = () => {
    // Recargar los insights para mostrar la cobertura actualizada.
    // En una app más avanzada, se podría usar una actualización optimista.
    setLoading(true);
    fetch(`/api/insights/daily?date=${selectedDate}`).then(res => res.json()).then(data => {
      setInsights(data);
      setLoading(false);
    });
    setSelectedAgentRows([]); // Limpiar selección
  };

  const handleExportDaily = () => {
    window.open(`/api/reports/daily?date=${selectedDate}`, '_blank');
  };

  const handleExportAudit = () => {
    window.open('/api/reports/audit', '_blank');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#333' }}>Manager Copilot</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
           {/* Botones de demostración para las nuevas funcionalidades */}
           <button onClick={() => setSelectedAgentRows([57, 58, 59])}>Select Agents (Demo)</button>
           {selectedAgentRows.length > 0 && (
             <button onClick={() => setIsBatchModalOpen(true)}>Batch Assign ({selectedAgentRows.length})</button>
           )}
          <button onClick={() => setIsPrePlanWizardOpen(true)}>Generate Pre-Plan</button>
          <button onClick={() => setIsAuditDrawerOpen(true)}>Recent Changes</button>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={handleExportDaily} style={{ background: '#fff', border: '1px solid #ccc', cursor: 'pointer' }}>📥 Daily CSV</button>
            <button onClick={handleExportAudit} style={{ background: '#fff', border: '1px solid #ccc', cursor: 'pointer' }}>📥 Audit Log</button>
          </div>
          <div>
            <label htmlFor="date-picker" style={{ marginRight: '10px', fontWeight: 'bold' }}>Select Date:</label>
            <input type="date" id="date-picker" value={selectedDate} onChange={handleDateChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'dashboard' ? '3px solid #1890ff' : '3px solid transparent',
            fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Dashboard & Insights
        </button>
        <button
          onClick={() => setActiveTab('planning')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'planning' ? '3px solid #1890ff' : '3px solid transparent',
            fontWeight: activeTab === 'planning' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Planning Grid
        </button>
      </div>

      {activeTab === 'dashboard' && !loading && !error && insights && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
          <CoverageBoard coverage={insights.coverage} />
          <AlertsPanel alerts={insights.alerts} />
        </div>
      )}

      {activeTab === 'dashboard' && loading && <p>Loading insights...</p>}
      {activeTab === 'dashboard' && error && <p style={{ color: 'red', background: '#fffbe6', border: '1px solid #ffe58f', padding: '10px', borderRadius: '4px' }}>Error: {error}</p>}

      {activeTab === 'planning' && (
        <DragDropPlanner date={selectedDate} />
      )}

      <RecentChangesDrawer isOpen={isAuditDrawerOpen} onClose={() => setIsAuditDrawerOpen(false)} />

      {isBatchModalOpen && (
        <BatchAssignModal
          selectedAgentRows={selectedAgentRows}
          date={selectedDate}
          onClose={() => setIsBatchModalOpen(false)}
          onAssignSuccess={handleBatchAssignSuccess}
        />
      )}
    </div>
  );
};

export default ManagerCopilot;