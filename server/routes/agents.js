const express = require('express');
const { getFixedAgents, setAgentFixedStatus } = require('../services/fixedAgentService');
const auditService = require('../../AuditService');

// Mocking a service that would interact with the Excel Adapter
const getAgentsFromExcel = async () => ([
    { id: '1', name: 'juan' }, { id: '2', name: 'maria' }, { id: '3', name: 'pedro' },
]);

// Mocking auth middleware from your architecture
const requireRole = (role) => (req, res, next) => {
    console.log(`Auth check: Role '${role}' required. Access granted for demo.`);
    next();
};

const router = express.Router();

/**
 * GET /api/agents
 * Returns a list of all agents, merging their "fixed" status from our JSON file.
 */
router.get('/', async (req, res) => {
    try {
        const [agentsFromExcel, fixedAgentsMap] = await Promise.all([
            getAgentsFromExcel(),
            getFixedAgents()
        ]);

        const agentsWithStatus = agentsFromExcel.map(agent => ({
            ...agent,
            fixed: fixedAgentsMap[agent.name] === true,
        }));

        res.json(agentsWithStatus);
    } catch (error) {
        console.error('Failed to get agents list:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * POST /api/agents/:name/fixed
 * Sets the fixed assignment status for an agent. Manager role required.
 */
router.post('/:name/fixed', requireRole('MANAGER'), async (req, res) => {
    const { name } = req.params;
    const { fixed } = req.body;

    if (typeof fixed !== 'boolean') return res.status(400).json({ error: 'Body must include a "fixed" boolean property.' });

    try {
        await setAgentFixedStatus(name, fixed);

        // Log the change to the audit file.
        // In a real implementation, an `authenticate` middleware would provide `req.user`.
        await auditService.log({
            user: req.user || { username: 'manager' }, // Mock user for audit log
            action: 'SET_FIXED_ASSIGNMENT',
            details: {
                agentName: name,
                fixed: fixed,
            }
        });

        res.status(200).json({ message: `Agent ${name} fixed status set to ${fixed}.` });
    } catch (error) {
        console.error(`Failed to set fixed status for agent ${name}:`, error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;