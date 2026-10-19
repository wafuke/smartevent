const jwt = require('jsonwebtoken');
const { readLocalData } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'smartevent-strathmore-jwt-secret-key-2026';

/**
 * Authentication Middleware: Extracts & verifies JWT or legacy user token
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (authHeader) {
    token = authHeader;
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  // Allow unauthenticated access if no token provided (req.user will be null)
  if (!token) {
    req.user = null;
    return next();
  }

  const db = readLocalData();

  // 1. Try JWT verification first
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = (db.users || []).find(u => u.id === decoded.id);
    if (user) {
      const { password, passwordHash, ...userPayload } = user;
      req.user = userPayload;
      return next();
    }
  } catch (err) {
    // Fall through to legacy token format check
  }

  // 2. Fallback support for legacy token pattern: token_{userId}_{timestamp}
  const parts = token.split('_');
  if (parts.length >= 2 && parts[0] === 'token') {
    const userId = parts[1];
    const user = (db.users || []).find(u => u.id === userId);
    
    if (user) {
      const { password, passwordHash, ...userPayload } = user;
      req.user = userPayload;
      return next();
    }
  }

  req.user = null;
  return next();
}

/**
 * Strict Authentication Guard Middleware: Requires a valid logged-in user
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to perform this action.'
    });
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) Guard Middleware
 * @param {string[]} allowedRoles - Array of roles permitted (e.g. ['admin', 'organizer'])
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in first.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireAuth,
  requireRole
};

