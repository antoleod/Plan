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
  const [searchQuery, setSearchQuery] = useState('');
  const [showOthers, setShowOthers] = useState(false);
  const [mySite, setMySite] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const agentName = user?.name || 'DIOSES Juan';
      
      // Load agent's own week (this endpoint works for AGENT role)
      const myWeekResponse = await api.get(`/planning/agent/${encodeURIComponent(agentName)}/week`);
      const myWeek = myWeekResponse.data;
      
      // Determine my site from first day with site
      const mySiteFromData = myWeek.week?.[0]?.daySummary?.site || 
                            myWeek.week?.[0]?.summary?.site || null;
      setMySite(mySiteFromData);
      
      // Try to load all agents for grouping (read-only view)
      // This endpoint allows AGENT role to see other agents
      let allAgents = [];
      let hourHeaders = myWeek.hourHeaders || [];
      
      try {
        const allAgentsResponse = await api.get('/planning/agents/view');
        allAgents = allAgentsResponse.data.agents || [];
        hourHeaders = allAgentsResponse.data.hourHeaders || myWeek.hourHeaders || [];
      } catch (err) {
        // If it fails, agent will just see their own planning
        console.log('Could not load other agents (may require MANAGER role):', err.response?.data?.error);
        allAgents = [];
      }
      
      // Group agents by site
      const myGroup = [];
      const others = [];
      
      allAgents.forEach(agent => {
        // Check if agent has same site on any day
        const hasSameSite = agent.week?.some(day => {
          const daySite = day.daySummary?.site || day.summary?.site;
          return daySite === mySiteFromData && mySiteFromData;
        });
        
        const isMe = agent.name === agentName || agent.agent === agentName;
        
        if (isMe) {
          // My planning goes first, skip it here
          return;
        } else if (hasSameSite) {
          myGroup.push(agent);
        } else {
          others.push(agent);
        }
      });
      
      setData({
        myWeek: myWeek,
        myGroup: myGroup,
        others: others,
        hourHeaders: hourHeaders
      });
      
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error loading data';
      setError(errorMsg);
      console.error('Error loading agent data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Filter locally, don't reload
  };

  // Filter agents locally based on search query
  const filterAgents = (agents) => {
    if (!searchQuery.trim()) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(query)
    );
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
          <div className="header-actions">
            <input
              type="text"
              placeholder="Buscar agente..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            <button onClick={loadData} className="btn-secondary">
              Actualizar
            </button>
          </div>
        </div>

        {data && (
          <>
            {/* Mi Planning */}
            <section className="planning-section">
              <h2 className="section-title">📅 Mi Planning</h2>
              <PlanningGrid
                data={{
                  agents: [data.myWeek],
                  hourHeaders: data.hourHeaders
                }}
                editable={false}
              />
            </section>

            {/* Mi Grupo - Solo visible si hay datos */}
            {data.myGroup && data.myGroup.length > 0 && (
              <section className="planning-section">
                <h2 className="section-title">
                  👥 Mi Grupo {mySite && `(${mySite})`}
                </h2>
                <PlanningGrid
                  data={{
                    agents: filterAgents(data.myGroup),
                    hourHeaders: data.hourHeaders
                  }}
                  editable={false}
                />
              </section>
            )}

            {/* Otros Agentes - Solo visible si hay datos */}
            {data.others && data.others.length > 0 && (
              <section className="planning-section">
                <button
                  className="section-toggle"
                  onClick={() => setShowOthers(!showOthers)}
                >
                  <h2 className="section-title">
                    {showOthers ? '▼' : '▶'} Otros Agentes ({filterAgents(data.others).length})
                  </h2>
                </button>
                {showOthers && (
                  <PlanningGrid
                    data={{
                      agents: filterAgents(data.others),
                      hourHeaders: data.hourHeaders
                    }}
                    editable={false}
                  />
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AgentView;
