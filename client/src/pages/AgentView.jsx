import { useState, useEffect, useMemo, createRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PlanningGrid from '../components/PlanningGrid';
import Header from '../components/Header';
import RoleNav from '../components/RoleNav';
import RecentChangesDrawer from '../components/copilot/RecentChangesDrawer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { agentNavSections } from '../config/navigation';
import './AgentView.css';

function AgentView() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOthers, setShowOthers] = useState(false);
  const [mySite, setMySite] = useState(null);
  const [recentChanges, setRecentChanges] = useState([]);
  const [changesLoading, setChangesLoading] = useState(false);
  const [changesError, setChangesError] = useState(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(agentNavSections[0]?.id || 'myschedule');

  const sectionRefs = useMemo(() => {
    const refs = {};
    agentNavSections.forEach((section) => {
      refs[section.id] = createRef();
    });
    return refs;
  }, []);

  useEffect(() => {
    loadData();
    loadRecentChanges();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const agentName = user?.name || 'DIOSES Juan';
      const myWeekResponse = await api.get(`/planning/agent/${encodeURIComponent(agentName)}/week`);
      const myWeek = myWeekResponse.data;

      const mySiteFromData =
        myWeek.week?.[0]?.daySummary?.site || myWeek.week?.[0]?.summary?.site || null;
      setMySite(mySiteFromData);

      let allAgents = [];
      let hourHeaders = myWeek.hourHeaders || [];

      try {
        const allAgentsResponse = await api.get('/planning/agents/view');
        allAgents = allAgentsResponse.data.agents || [];
        hourHeaders = allAgentsResponse.data.hourHeaders || myWeek.hourHeaders || [];
      } catch (err) {
        console.log('Other agents not available:', err.response?.data?.error);
        allAgents = [];
      }

      const myGroup = [];
      const others = [];

      allAgents.forEach((agent) => {
        const hasSameSite = agent.week?.some((day) => {
          const daySite = day.daySummary?.site || day.summary?.site;
          return daySite === mySiteFromData && mySiteFromData;
        });

        const isMe = agent.name === agentName || agent.agent === agentName;

        if (isMe) {
          return;
        }
        if (hasSameSite) {
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

  const loadRecentChanges = async () => {
    try {
      setChangesLoading(true);
      setChangesError(null);
      const response = await api.get('/audit');
      setRecentChanges(response.data.slice(0, 4));
    } catch (err) {
      setChangesError('Failed to load audit entries.');
    } finally {
      setChangesLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filterAgents = (agents) => {
    if (!searchQuery.trim()) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter((agent) => agent.name.toLowerCase().includes(query));
  };

  const handleNavSelect = (id) => {
    setActiveSection(id);
    const target = sectionRefs[id];
    if (target && target.current) {
      target.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading my schedule...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <Button variant="flat" size="sm" onClick={loadData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="agent-view">
      <Header user={user} onLogout={logout} />
      <div className="agent-layout">
        <RoleNav
          role="Agent"
          items={agentNavSections}
          activeId={activeSection}
          onSelect={handleNavSelect}
        />

        <main className="agent-main">
          <section ref={sectionRefs.myschedule} id="myschedule" className="agent-section">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">My Schedule</p>
                <h1>Weekly plan</h1>
              </div>
              <div className="section-actions">
                <Input
                  className="search-input"
                  size="md"
                  type="text"
                  placeholder="Search agent..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <Button variant="flat" size="sm" onClick={loadData}>
                  Refresh
                </Button>
              </div>
            </div>
            {data && (
              <PlanningGrid
                data={{
                  agents: [data.myWeek],
                  hourHeaders: data.hourHeaders
                }}
                editable={false}
              />
            )}
          </section>

          <section ref={sectionRefs.team} id="team" className="agent-section">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Team View</p>
                <h2>{mySite ? `Team (${mySite})` : 'Team'}</h2>
              </div>
            </div>
            {data?.myGroup?.length > 0 && (
              <PlanningGrid
                data={{
                  agents: filterAgents(data.myGroup),
                  hourHeaders: data.hourHeaders
                }}
                editable={false}
              />
            )}
            {data?.others?.length > 0 && (
              <div className="team-others">
                <Button
                  type="button"
                  variant="flat"
                  size="sm"
                  onClick={() => setShowOthers((prev) => !prev)}
                >
                  {showOthers ? 'Hide' : 'Show'} other agents ({filterAgents(data.others).length})
                </Button>
                {showOthers && (
                  <PlanningGrid
                    data={{
                      agents: filterAgents(data.others),
                      hourHeaders: data.hourHeaders
                    }}
                    editable={false}
                  />
                )}
              </div>
            )}
          </section>

          <section ref={sectionRefs.changes} id="changes" className="agent-section">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Changes (read-only)</p>
                <h2>Recent audit notes</h2>
              </div>
              <div className="section-actions">
                <Button variant="flat" size="sm" onClick={loadRecentChanges}>
                  Reload
                </Button>
                <Button variant="flat" size="sm" onClick={() => setIsAuditOpen(true)}>
                  View full log
                </Button>
              </div>
            </div>
            <div className="changes-list">
              {changesLoading && <p className="section-note">Loading audit entries...</p>}
              {changesError && <p className="section-note section-note--error">{changesError}</p>}
              {!changesLoading && recentChanges.length === 0 && (
                <p className="section-note">No recent changes.</p>
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
        </main>
      </div>

      <RecentChangesDrawer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </div>
  );
}

export default AgentView;
