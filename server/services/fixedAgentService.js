const fs = require('fs').promises;
const path = require('path');

const FIXED_AGENTS_PATH = path.join(__dirname, '..', 'data', 'fixed-agents.json');

/**
 * Reads the fixed agents mapping from the JSON file.
 * @returns {Promise<Object<string, boolean>>} A map of agent names to their fixed status.
 */
async function getFixedAgents() {
    try {
        await fs.access(FIXED_AGENTS_PATH);
        const data = await fs.readFile(FIXED_AGENTS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is empty/invalid, return an empty object.
        if (error.code === 'ENOENT') {
            return {};
        }
        console.error('Error reading fixed agents file:', error);
        return {};
    }
}

/**
 * Sets the fixed status for a specific agent and saves it to the JSON file.
 * @param {string} agentName - The name of the agent.
 * @param {boolean} isFixed - The fixed status to set.
 */
async function setAgentFixedStatus(agentName, isFixed) {
    const fixedAgents = await getFixedAgents();
    
    if (isFixed) {
        fixedAgents[agentName] = true;
    } else {
        delete fixedAgents[agentName]; // Clean up the file by removing the key if false
    }

    await fs.mkdir(path.dirname(FIXED_AGENTS_PATH), { recursive: true });
    await fs.writeFile(FIXED_AGENTS_PATH, JSON.stringify(fixedAgents, null, 2));
}

module.exports = {
    getFixedAgents,
    setAgentFixedStatus,
};