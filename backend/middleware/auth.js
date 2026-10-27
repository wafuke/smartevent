const jwt = require('jsonwebtoken');
const { readLocalData } = require('../db');
const { JWT_SECRET } = require('./secret');

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

/**
 * Authentication middleware: verifies a signed JWT (Authorization: Bearer <token>)
 * and attaches the live user record to req.user. Anonymous requests continue with
 * req.user = null; protected routes use requireAuth / requireRole.
 * The `se_token` cookie is accepted ONLY for the server-rendered admin console.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.method === 'GET' && req.path === '/') {
    token = readCookie(req, 'se_token');
  }

  req.user = null;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const db = readLocalData();
    const user = (db.users || []).find((u) => u.id === decoded.id);
    if (user && String(user.status || 'Active').toLowerCase() !== 'suspended') {
      const { password, passwordHash, ...userPayload } = user;
      req.user = { ...userPayload, role: String(userPayload.role || 'student').toLowerCase() };
    }
  } catch (err) {
    // invalid / expired token -> treated as anonymous
  }
  return next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in with a valid session.'
    });
  }
  next();
}

/** Role-based access control. Roles are compared case-insensitively. */
function requireRole(allowedRoles = []) {
  const allowed = allowedRoles.map((r) => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please log in first.' });
    }
    if (!allowed.includes(String(req.user.role).toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role '${String(req.user.role).toUpperCase()}' is not authorized for this resource.`
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireAuth, requireRole };
