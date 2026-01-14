import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PlanningGrid from '../components/PlanningGrid';
import Header from '../components/Header';
import './AgentView.css';

function AgentView() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const agentName = user?.name || 'DIOSES Juan';
      const response = await api.get(`/planning/agent/${encodeURIComponent(agentName)}/week`);
      setData({
        agents: [response.data],
        hourHeaders: response.data.hourHeaders
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Cargando mi planning...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={loadData} className="btn-primary">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="agent-view">
      <Header user={user} onLogout={logout} />
      
      <div className="container">
        <div className="view-header">
          <h1>Mi Planning</h1>
          <button onClick={loadData} className="btn-secondary">
            Actualizar
          </button>
        </div>

        {data && (
          <PlanningGrid
            data={data}
            editable={false}
          />
        )}
      </div>
    </div>
  );
}

export default AgentView;
