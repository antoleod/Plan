const express = require('express');
const router = express.Router();

// Mock users for MVP
const MOCK_USERS = [
  {
    id: 1,
    username: 'manager',
    password: 'manager123', // In production, this would be hashed
    role: 'MANAGER',
    name: 'Manager User'
  },
  {
    id: 2,
    username: 'juan',
    password: 'juan123',
    role: 'AGENT',
    name: 'DIOSES Juan'
  },
  {
    id: 3,
    username: 'agent1',
    password: 'agent123',
    role: 'AGENT',
    name: 'Agent One'
  }
];

// Simple login (MVP)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // In production, use JWT
    const token = `mock_token_${user.id}_${Date.now()}`;
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token (MVP)
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !token.startsWith('mock_token_')) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Extract user ID from mock token
    const userId = parseInt(token.split('_')[2]);
    const user = MOCK_USERS.find(u => u.id === userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.MOCK_USERS = MOCK_USERS;
