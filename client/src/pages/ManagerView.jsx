import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PlanningGrid from '../components/PlanningGrid';
import EditDayModal from '../components/EditDayModal';
import AddAgentModal from '../components/AddAgentModal';
import Header from '../components/Header';
import './ManagerView.css';

function ManagerView() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingAgent, setAddingAgent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    
    // Check for file changes periodically
    const interval = setInterval(checkFileStatus, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/planning/manager');
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const checkFileStatus = async () => {
    try {
      const response = await api.get('/excel/status');
      if (response.data.hasChanges) {
        if (confirm('El archivo Excel ha sido modificado. ¿Recargar?')) {
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
    setShowModal(true);
  };

  const handleSave = async (updateData) => {
    try {
      setSaving(true);
      setError(null);
      await api.put(
        `/planning/agent/${selectedCell.agent.name}/day/${selectedCell.dayIndex}`,
        updateData
      );
      
      // Reload data
      await loadData();
      setShowModal(false);
      setSelectedCell(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error saving';
      setError(errorMsg);
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAgent = async (agentData) => {
    try {
      setAddingAgent(true);
      const response = await api.post('/planning/agents', agentData);
      
      // Add agent to local state immediately (optimistic update)
      if (data && response.data.agent) {
        setData({
          ...data,
          agents: [...data.agents, response.data.agent]
        });
      }
      
      // Reload to get full data
      await loadData();
      setShowAddAgentModal(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al añadir agente');
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
      setError('Error downloading file');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Cargando planning...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={loadData} className="btn-primary">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="manager-view">
      <Header user={user} onLogout={logout} />
      
      <div className="container">
        <div className="view-header">
          <h1>Planning Manager</h1>
          <div className="header-actions">
            <button 
              onClick={() => setShowAddAgentModal(true)} 
              className="btn-add-agent"
              title="Añadir nuevo agente"
            >
              ➕ Añadir Agente
            </button>
            <button onClick={loadData} className="btn-secondary">
              Recargar
            </button>
            <button onClick={handleDownload} className="btn-primary">
              Descargar Excel
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {data && (
          <PlanningGrid
            data={data}
            onCellClick={handleCellClick}
            editable={true}
          />
        )}

        {showModal && selectedCell && (
          <EditDayModal
            agent={selectedCell.agent}
            dayIndex={selectedCell.dayIndex}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
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
    </div>
  );
}

export default ManagerView;
