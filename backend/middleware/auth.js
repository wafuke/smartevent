const jwt = require('jsonwebtoken');
const { readLocalData } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'smartevent-strathmore-jwt-secret-key-2026';

/**
 * Authentication Middleware: Extracts & verifies cryptographically signed JWT token
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

  if (!token) {
    req.user = null;
    return next();
  }

  const db = readLocalData();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = (db.users || []).find(u => u.id === decoded.id);
    if (user && String(user.status || 'Active').toLowerCase() !== 'suspended') {
      const { password, passwordHash, ...userPayload } = user;
      req.user = {
        ...userPayload,
        role: String(userPayload.role || 'student').toLowerCase()
      };
      return next();
    }
  } catch (err) {
    // Invalid or expired JWT
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
      error: 'Authentication required. Please log in with a valid session.'
    });
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) Guard Middleware
 * @param {string[]} allowedRoles - Array of roles permitted (e.g. ['admin', 'organizer'])
 */
function requireRole(allowedRoles = []) {
  const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in first.'
      });
    }

    const userRole = String(req.user.role || '').toLowerCase();
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role '${userRole.toUpperCase()}' is not authorized to access this resource.`
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
