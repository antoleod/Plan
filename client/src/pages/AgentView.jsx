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

      const myWeekResponse = await api.get(`/planning/agent/${encodeURIComponent(agentName)}/week`);
      const myWeek = myWeekResponse.data;

      const mySiteFromData = myWeek.week?.[0]?.daySummary?.site ||
        myWeek.week?.[0]?.summary?.site || null;
      setMySite(mySiteFromData);

      let allAgents = [];
      let hourHeaders = myWeek.hourHeaders || [];

      try {
        const allAgentsResponse = await api.get('/planning/agents/view');
        allAgents = allAgentsResponse.data.agents || [];
        hourHeaders = allAgentsResponse.data.hourHeaders || myWeek.hourHeaders || [];
      } catch (err) {
        console.log('Other agents are not available (manager role required):', err.response?.data?.error);
        allAgents = [];
      }

      const myGroup = [];
      const others = [];

      allAgents.forEach(agent => {
        const hasSameSite = agent.week?.some(day => {
          const daySite = day.daySummary?.site || day.summary?.site;
          return daySite === mySiteFromData && mySiteFromData;
        });

        const isMe = agent.name === agentName || agent.agent === agentName;

        if (isMe) {
          return;
        } else if (hasSameSite) {
          myGroup.push(agent);
        } else {
          others.push(agent);
        }
      });

      setData({
        myWeek,
        myGroup,
        others,
        hourHeaders
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load schedule');
      console.error('Agent view error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filterAgents = (agents) => {
    if (!searchQuery.trim()) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter(agent => agent.name.toLowerCase().includes(query));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading my schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={loadData} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="agent-view">
      <Header user={user} onLogout={logout} />

      <div className="container">
        <div className="view-header">
          <h1>My Schedule</h1>
          <div className="header-actions">
            <input
              type="text"
              placeholder="Search agent..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            <button onClick={loadData} className="btn-secondary">Refresh</button>
          </div>
        </div>

        {data && (
          <>
            <section className="planning-section">
              <h2 className="section-title">My Week</h2>
              <PlanningGrid
                data={{
                  agents: [data.myWeek],
                  hourHeaders: data.hourHeaders
                }}
                editable={false}
              />
            </section>

            {data.myGroup && data.myGroup.length > 0 && (
              <section className="planning-section">
                <h2 className="section-title">
                  Team {mySite && `(${mySite})`}
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

            {data.others && data.others.length > 0 && (
              <section className="planning-section">
                <button
                  className="section-toggle"
                  onClick={() => setShowOthers(!showOthers)}
                >
                  <h2 className="section-title">
                    {showOthers ? '▼' : '▶'} Other Agents ({filterAgents(data.others).length})
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
