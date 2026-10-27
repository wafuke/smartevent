const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * JWT signing secret.
 *  1. JWT_SECRET env var (required in production)
 *  2. otherwise a random secret generated once and persisted to backend/.jwt_secret
 *     (git-ignored) so tokens survive restarts without a guessable hard-coded default.
 */
function loadSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET (min 16 chars) must be set when NODE_ENV=production');
  }
  const file = path.join(__dirname, '..', '.jwt_secret');
  try {
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(file, generated, { mode: 0o600 });
    return generated;
  } catch (e) {
    console.warn('[security] Could not persist JWT secret, using an in-memory one:', e.message);
    return crypto.randomBytes(48).toString('hex');
  }
}

module.exports = { JWT_SECRET: loadSecret(), JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h' };
