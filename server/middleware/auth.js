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
    // MVP: Get user from mock users
    try {
      const authRoutes = require('../routes/auth');
      const MOCK_USERS = authRoutes.MOCK_USERS || [];
      const userId = req.user?.userId;
      
      if (userId) {
        const user = MOCK_USERS.find(u => u.id === userId);
        if (user && roles.includes(user.role)) {
          req.user.role = user.role;
          req.user.name = user.name;
          req.user.username = user.username;
          return next();
        }
      }
      
      return res.status(403).json({ error: 'Insufficient permissions' });
    } catch (error) {
      // If roles array is empty, allow all authenticated users (for backward compatibility)
      if (roles.length === 0) {
        return next();
      }
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
}

module.exports = { authenticate, requireRole };
