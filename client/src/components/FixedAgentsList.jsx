import React, { useState, useEffect } from 'react';
import FixedStatusToggle from './FixedStatusToggle';

const FixedAgentsList = ({ isManager }) => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isManager) {
            setLoading(true);
            fetch('/api/agents')
                .then(res => res.json())
                .then(data => {
                    setAgents(data);
                })
                .catch(err => console.error('Error fetching agents:', err))
                .finally(() => setLoading(false));
        }
    }, [isManager]);

    if (!isManager) return null;

    const handleStatusChange = (agentName, newStatus) => {
        setAgents(prev => prev.map(a => 
            a.name === agentName ? { ...a, fixed: newStatus } : a
        ));
    };

    // Filter to show only fixed agents
    const fixedAgents = agents.filter(a => a.fixed);

    if (loading) return <div className="p-4 text-gray-500">Loading fixed assignments...</div>;

    return (
        <div className="bg-white shadow rounded-lg p-4 max-w-md">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Fixed Assignments</h2>
            {fixedAgents.length === 0 ? (
                <p className="text-gray-500 text-sm">No agents are currently marked as fixed.</p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {fixedAgents.map(agent => (
                        <li key={agent.id || agent.name} className="py-2 flex justify-between items-center">
                            <span className="text-gray-700">{agent.name}</span>
                            <FixedStatusToggle 
                                agentName={agent.name} 
                                isFixed={agent.fixed} 
                                isManager={isManager}
                                onStatusChange={(status) => handleStatusChange(agent.name, status)}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FixedAgentsList;