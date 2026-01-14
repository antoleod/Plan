// This file contains conceptual tests for the "Fixed Assignment" feature.

// --- Unit Test ---
// This tests a hypothetical rule engine function that suggests agents for rotation.

function findRotationCandidates(allAgents) {
    // The logic should filter out agents marked as 'fixed'.
    return allAgents.filter(agent => !agent.fixed);
}

describe('Rotation Rule Engine', () => {
    it('should not include fixed agents in rotation candidates', () => {
        const allAgents = [
            { name: 'juan', fixed: false },
            { name: 'maria', fixed: true }, // Maria is fixed
            { name: 'pedro', fixed: false },
            { name: 'ana', fixed: true },   // Ana is fixed
        ];

        const candidates = findRotationCandidates(allAgents);

        expect(candidates).toHaveLength(2);
        expect(candidates.map(a => a.name)).toEqual(['juan', 'pedro']);
    });
});


// --- Integration Test ---
// This describes an end-to-end test for the API and data persistence.

describe('Fixed Agent API Integration', () => {
    const API_URL = 'http://localhost:3001';
    const agentName = 'maria';

    const getAgentStatus = async (name) => {
        const res = await fetch(`${API_URL}/api/agents`);
        const agents = await res.json();
        return agents.find(a => a.name === name);
    };

    const setAgentFixed = async (name, status) => {
        return fetch(`${API_URL}/api/agents/${name}/fixed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fixed: status }),
        });
    };

    it('should set an agent as fixed and reflect it in the GET endpoint', async () => {
        // Set to true
        await setAgentFixed(agentName, true);
        let agent = await getAgentStatus(agentName);
        expect(agent.fixed).toBe(true);

        // Set to false
        await setAgentFixed(agentName, false);
        agent = await getAgentStatus(agentName);
        expect(agent.fixed).toBe(false);
    });
});