import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PlanningGrid from '../components/PlanningGrid';
import EditDayModal from '../components/EditDayModal';
import AddAgentModal from '../components/AddAgentModal';
import Header from '../components/Header';
import CoverageBoard from '../components/copilot/CoverageBoard';
import AlertsPanel from '../components/copilot/AlertsPanel';
import DragDropPlanner from '../components/copilot/DragDropPlanner';
import BatchAssignModal from '../components/copilot/BatchAssignModal';
import PrePlanWizard from '../components/copilot/PrePlanWizard';
import RecentChangesDrawer from '../components/copilot/RecentChangesDrawer';
import './ManagerView.css';

function ManagerView() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingAgent, setAddingAgent] = useState(false);
  const [activeTab, setActiveTab] = useState('grid');
  const [copilotDate, setCopilotDate] = useState(new Date().toISOString().split('T')[0]);
  const [insights, setInsights] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState(null);
  const [selectedAgentRows, setSelectedAgentRows] = useState([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isPrePlanOpen, setIsPrePlanOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  useEffect(() => {
    loadData();

    const interval = setInterval(checkFileStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'copilot') {
      loadInsights(copilotDate);
    }
  }, [activeTab, copilotDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/planning/manager');
      setData(response.data);
      setSelectedAgentRows([]);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load planning.');
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async (date) => {
    try {
      setCopilotLoading(true);
      setCopilotError(null);
      const response = await api.get('/insights/daily', { params: { date } });
      setInsights(response.data);
    } catch (err) {
      setCopilotError(err.response?.data?.message || 'Unable to load insights.');
    } finally {
      setCopilotLoading(false);
    }
  };

  const checkFileStatus = async () => {
    try {
      const response = await api.get('/excel/status');
      if (response.data.hasChanges) {
        if (window.confirm('The Excel file changed on disk. Reload now?')) {
          await api.post('/excel/reload');
          loadData();
        }
      }
    } catch (err) {
      console.error('Error checking file status:', err);
    }
  };

  const handleCellClick = (agent, dayIndex) => {
    setSelectedCell({ agent, dayIndex });
    setShowEditModal(true);
  };

  const handleSave = async (updateData) => {
    try {
      setSaving(true);
      setError(null);
      await api.put(
        `/planning/agent/${encodeURIComponent(selectedCell.agent.name)}/day/${selectedCell.dayIndex}`,
        updateData
      );
      await loadData();
      setShowEditModal(false);
      setSelectedCell(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes.');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAgent = async (agentData) => {
    try {
      setAddingAgent(true);
      const response = await api.post('/planning/agents', agentData);
      if (data && response.data.agent) {
        setData(prev => ({
          ...prev,
          agents: [...(prev?.agents || []), response.data.agent]
        }));
      }
      await loadData();
      setShowAddAgentModal(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to add agent.');
      throw err;
    } finally {
      setAddingAgent(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get('/excel/download', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Planning_2026-01_FULLY_EDITABLE.xlsm');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Unable to download the official Excel.');
    }
  };

  const toggleAgentSelection = (row) => {
    setSelectedAgentRows(prev => (
      prev.includes(row) ? prev.filter(r => r !== row) : [...prev, row]
    ));
  };

  const handleBatchSuccess = async () => {
    setIsBatchModalOpen(false);
    await loadData();
    if (activeTab === 'copilot') {
      loadInsights(copilotDate);
    }
  };

  const handleCopilotDateChange = (event) => {
    setCopilotDate(event.target.value);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading planning...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={loadData} className="btn-primary">Reload</button>
      </div>
    );
  }

  const agentChecklist = data?.agents?.filter(agent => agent.name).map(agent => (
    <label key={agent.row} className="agent-checkbox">
      <input
        type="checkbox"
        checked={selectedAgentRows.includes(agent.row)}
        onChange={() => toggleAgentSelection(agent.row)}
      />
      <span>{agent.name}</span>
    </label>
  ));

  return (
    <div className="manager-view">
      <Header user={user} onLogout={logout} />

      <div className="container">
        <div className="view-header">
          <h1>Manager Copilot</h1>
          <div className="header-actions">
            <button
              onClick={() => setShowAddAgentModal(true)}
              className="btn-add-agent"
              title="Add a new agent"
            >
              + Add Agent
            </button>
            <button onClick={loadData} className="btn-secondary">Refresh Planning</button>
            <button onClick={handleDownload} className="btn-primary">Download Excel</button>
            <button onClick={() => setIsAuditOpen(true)} className="btn-secondary">Recent Changes</button>
          </div>
        </div>

        <div className="tab-switcher">
          <button
            className={activeTab === 'grid' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('grid')}
          >
            Planning Grid
          </button>
          <button
            className={activeTab === 'copilot' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('copilot')}
          >
            Copilot Dashboard
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {activeTab === 'grid' && data && (
          <PlanningGrid
            data={data}
            onCellClick={handleCellClick}
            editable
          />
        )}

        {activeTab === 'copilot' && (
          <section className="copilot-section">
            <div className="copilot-header">
              <div>
                <h2>Coverage & Alerts</h2>
                <p style={{ margin: 0, color: '#555' }}>Selected date: </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="date" value={copilotDate} onChange={handleCopilotDateChange} />
                <button onClick={() => loadInsights(copilotDate)} disabled={copilotLoading} className="btn-secondary">
                  Refresh
                </button>
              </div>
            </div>
            {copilotLoading && <p>Loading insights...</p>}
            {!copilotLoading && copilotError && (
              <p style={{ color: '#ff4d4f' }}>{copilotError}</p>
            )}
            {!copilotLoading && insights && (
              <div className="copilot-panels">
                <CoverageBoard coverage={insights.coverage} />
                <AlertsPanel alerts={insights.alerts} />
              </div>
            )}

            <div className="copilot-middle">
              <div className="agent-list-panel">
                <h3>Select agents for batch updates</h3>
                <div className="agent-list">
                  {agentChecklist.length > 0 ? agentChecklist : <p>No agents available.</p>}
                </div>
                <button
                  onClick={() => setIsBatchModalOpen(true)}
                  disabled={selectedAgentRows.length === 0}
                  className="btn-primary"
                >
                  Batch Assign ({selectedAgentRows.length})
                </button>
              </div>
              <div className="copilot-actions">
                <button onClick={() => setIsPrePlanOpen(true)} className="btn-secondary">
                  Generate Pre-plan
                </button>
              </div>
            </div>

            <DragDropPlanner date={copilotDate} onPlanChange={() => loadInsights(copilotDate)} />
          </section>
        )}

        {showEditModal && selectedCell && (
          <EditDayModal
            agent={selectedCell.agent}
            dayIndex={selectedCell.dayIndex}
            onSave={handleSave}
            onClose={() => {
              setShowEditModal(false);
              setSelectedCell(null);
            }}
            saving={saving}
          />
        )}

        {showAddAgentModal && (
          <AddAgentModal
            onSave={handleAddAgent}
            onClose={() => setShowAddAgentModal(false)}
            saving={addingAgent}
          />
        )}
      </div>

      <RecentChangesDrawer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />

      {isBatchModalOpen && (
        <BatchAssignModal
          selectedAgentRows={selectedAgentRows}
          date={copilotDate}
          onClose={() => setIsBatchModalOpen(false)}
          onAssignSuccess={handleBatchSuccess}
        />
      )}

      {isPrePlanOpen && (
        <PrePlanWizard
          onClose={() => setIsPrePlanOpen(false)}
          onSuccess={() => {
            setIsPrePlanOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default ManagerView;
