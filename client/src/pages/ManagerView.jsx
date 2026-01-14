import { useState, useEffect, useMemo, createRef } from 'react';
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
import FixedAgentsList from '../components/FixedAgentsList';
import RoleNav from '../components/RoleNav';
import ReportsDashboard from '../components/reports/ReportsDashboard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { managerNavSections } from '../config/navigation';
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
  const [copilotDate, setCopilotDate] = useState(new Date().toISOString().split('T')[0]);
  const [insights, setInsights] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState(null);
  const [selectedAgentRows, setSelectedAgentRows] = useState([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isPrePlanOpen, setIsPrePlanOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [recentChanges, setRecentChanges] = useState([]);
  const [changesLoading, setChangesLoading] = useState(false);
  const [changesError, setChangesError] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(null);
  const [activeSection, setActiveSection] = useState(managerNavSections[0]?.id || 'planning');

  const sectionRefs = useMemo(() => {
    const refs = {};
    managerNavSections.forEach((section) => {
      refs[section.id] = createRef();
    });
    return refs;
  }, []);

  useEffect(() => {
    loadData();
    loadRecentChanges();
    loadReports();
    const interval = setInterval(checkFileStatus, 30000);
    loadInsights(copilotDate);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadInsights(copilotDate);
  }, [copilotDate]);

  const handleNavSelect = (id) => {
    setActiveSection(id);
    const targetRef = sectionRefs[id];
    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  const loadRecentChanges = async () => {
    try {
      setChangesLoading(true);
      setChangesError(null);
      const response = await api.get('/audit');
      setRecentChanges(response.data.slice(0, 5));
    } catch (err) {
      setChangesError('Failed to load recent changes.');
    } finally {
      setChangesLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      setReportsError(null);
      const response = await api.get('/reports/dashboard');
      setReportsData(response.data);
    } catch (err) {
      setReportsError(err.response?.data?.error || 'Failed to load reports.');
    } finally {
      setReportsLoading(false);
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
        setData((prev) => ({
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
    setSelectedAgentRows((prev) =>
      prev.includes(row) ? prev.filter((r) => r !== row) : [...prev, row]
    );
  };

  const handleBatchSuccess = async () => {
    setIsBatchModalOpen(false);
    await loadData();
    loadInsights(copilotDate);
  };

  const handleCopilotDateChange = (event) => {
    setCopilotDate(event.target.value);
  };

  const handleExportCSV = () => {
    window.open('/api/reports/export/csv', '_blank');
  };

  const agentChecklist = (data?.agents || []).filter((agent) => agent.name).map((agent) => (
    <label key={agent.row} className="agent-checkbox">
      <input
        type="checkbox"
        checked={selectedAgentRows.includes(agent.row)}
        onChange={() => toggleAgentSelection(agent.row)}
      />
      <span>{agent.name}</span>
    </label>
  ));

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
        <button onClick={loadData} className="btn-primary">
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="manager-view">
      <Header user={user} onLogout={logout} />
      <div className="manager-layout">
        <RoleNav
          role="Manager"
          items={managerNavSections}
          activeId={activeSection}
          onSelect={handleNavSelect}
        />

        <main className="manager-main">
          {error && <div className="error-banner">{error}</div>}

          <section ref={sectionRefs.planning} className="manager-section" id="planning">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Planning</p>
                <h1>Manager Copilot</h1>
              </div>
            <div className="section-actions">
              <Button variant="primary" size="sm" onClick={() => setShowAddAgentModal(true)}>
                + Add Agent
              </Button>
              <Button variant="flat" size="sm" onClick={loadData}>
                Refresh
              </Button>
              <Button variant="flat" size="sm" onClick={handleDownload}>
                Download Excel
              </Button>
            </div>
            </div>
            {data && (
              <PlanningGrid data={data} onCellClick={handleCellClick} editable />
            )}
          </section>

          <section ref={sectionRefs.copilot} className="manager-section" id="copilot">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Copilot & Insights</p>
                <h2>Coverage health & real-time alerts</h2>
              </div>
            <div className="section-actions">
              <Input
                className="date-input"
                type="date"
                size="sm"
                value={copilotDate}
                onChange={handleCopilotDateChange}
              />
              <Button variant="flat" size="sm" onClick={() => loadInsights(copilotDate)}>
                Refresh insights
              </Button>
            </div>
            </div>

            {copilotLoading && <p className="section-note">Loading insights...</p>}
            {copilotError && <p className="section-note section-note--error">{copilotError}</p>}

            <div className="copilot-panels">
              <CoverageBoard coverage={insights?.coverage} />
              <AlertsPanel alerts={insights?.alerts} />
            </div>

            <div className="copilot-middle">
              <div className="agent-list-panel">
                <h3>Select agents for batch updates</h3>
                <div className="agent-list">{agentChecklist.length > 0 ? agentChecklist : <p>No agents available.</p>}</div>
                <Button
                  onClick={() => setIsBatchModalOpen(true)}
                  disabled={selectedAgentRows.length === 0}
                  variant="primary"
                >
                  Batch Assign ({selectedAgentRows.length})
                </Button>
              </div>
              <div className="copilot-actions">
                <Button variant="secondary" size="sm" onClick={() => setIsPrePlanOpen(true)}>
                  Generate Pre-plan
                </Button>
              </div>
            </div>

            <DragDropPlanner date={copilotDate} onPlanChange={() => loadInsights(copilotDate)} />
          </section>

          <section ref={sectionRefs.batch} className="manager-section" id="batch">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Batch Actions</p>
                <h2>High-impact workflows</h2>
              </div>
            </div>
            <div className="batch-grid">
              <article className="batch-card">
                <h3>Batch assign</h3>
                <p>Select archived agents and apply templates in one go.</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBatchModalOpen(true)}
                  disabled={selectedAgentRows.length === 0}
                >
                  Open batch modal
                </Button>
              </article>
              <article className="batch-card">
                <h3>Pre-plan copy</h3>
                <p>Duplicate a proven roster into the next month.</p>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsPrePlanOpen(true)}>
                  Start pre-plan
                </Button>
              </article>
              <article className="batch-card">
                <h3>Agent onboarding</h3>
                <p>Add new operational staff with a single click.</p>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddAgentModal(true)}>
                  Add agent
                </Button>
              </article>
            </div>
          </section>

          <section ref={sectionRefs.changes} className="manager-section" id="changes">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Recent Changes</p>
                <h2>Audit trail</h2>
              </div>
              <div className="section-actions">
                <Button variant="flat" size="sm" onClick={() => setIsAuditOpen(true)}>
                  View full log
                </Button>
              </div>
            </div>
            <div className="changes-list">
              {changesLoading && <p>Loading audit entries...</p>}
              {changesError && <p className="section-note section-note--error">{changesError}</p>}
              {!changesLoading && recentChanges.length === 0 && (
                <p className="section-note">No changes recorded yet.</p>
              )}
              {recentChanges.map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} className="changes-item">
                  <div className="changes-meta">
                    <strong>{entry.action}</strong>
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="changes-user">By {entry.user || 'system'}</p>
                  <pre className="changes-details">{JSON.stringify(entry.details, null, 2)}</pre>
                </div>
              ))}
            </div>
          </section>

          <section ref={sectionRefs.reports} className="manager-section" id="reports">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Reports & Export</p>
                <h2>Operational intelligence</h2>
              </div>
              <div className="section-actions">
                <Button variant="flat" size="sm" onClick={handleExportCSV}>
                  Export CSV
                </Button>
              </div>
            </div>
            <ReportsDashboard
              data={reportsData}
              loading={reportsLoading}
              error={reportsError}
              onRefresh={loadReports}
            />
          </section>

          <section ref={sectionRefs.settings} className="manager-section" id="settings">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Settings & Mapping</p>
                <h2>Fixed assignments</h2>
                <p className="section-note">
                  Lock in agents so the planner respects hard constraints.
                </p>
              </div>
            </div>
            <FixedAgentsList isManager />
          </section>
        </main>
      </div>

      <RecentChangesDrawer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />

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
