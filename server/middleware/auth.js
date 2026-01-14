/**
 * Authentication middleware
 * For MVP: simple token verification
 * Future: JWT with Microsoft Entra ID
 */
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // MVP: simple token check
  if (token.startsWith('mock_token_')) {
    req.user = {
      token,
      // Extract user info from token (simplified)
      userId: parseInt(token.split('_')[2])
    };
    return next();
  }
  
  // Future: JWT verification
  // const jwt = require('jsonwebtoken');
  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   req.user = decoded;
  //   next();
  // } catch (error) {
  //   return res.status(401).json({ error: 'Invalid token' });
  // }
  
  res.status(401).json({ error: 'Invalid token format' });
}

function requireRole(...roles) {
  return async (req, res, next) => {
    // If no roles specified, allow all authenticated users
    if (roles.length === 0) {
      return next();
    }
    
    // MVP: Get user from mock users
    try {
      const authRoutes = require('../routes/auth');
      const MOCK_USERS = authRoutes.MOCK_USERS || [];
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(403).json({ error: 'Insufficient permissions: No user ID' });
      }
      
      const user = MOCK_USERS.find(u => u.id === userId);
      
      if (!user) {
        return res.status(403).json({ error: 'Insufficient permissions: User not found' });
      }
      
      // Add user info to request
      req.user.role = user.role;
      req.user.name = user.name;
      req.user.username = user.username;
      
      // Check if user has required role
      if (roles.includes(user.role)) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Insufficient permissions', 
        required: roles,
        current: user.role 
      });
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(403).json({ error: 'Insufficient permissions', details: error.message });
    }
  };
}

module.exports = { authenticate, requireRole };
