require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { readLocalData, isFirestoreEnabled } = require('./db');
const { verifyToken, requireRole } = require('./middleware/auth');
const { buildConsoleHtml, buildConsoleLoginHtml } = require('./console');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);
app.disable('x-powered-by');

// ---------------------------------------------------------------- security
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
if (isProd && corsOrigins.length === 0) {
  console.warn('[security] CORS_ORIGINS is not set - browsers from other origins will be blocked in production.');
}
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // mobile apps, curl, server-to-server
      if (corsOrigins.length) return cb(null, corsOrigins.includes(origin));
      return cb(null, !isProd); // dev: any origin; prod: none unless configured
    },
    maxAge: 600
  })
);

// Helmet for the JSON API; the console page gets its own nonce-based CSP below
app.use((req, res, next) => {
  if (req.path === '/') return next();
  return helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })(req, res, next);
});
app.use(express.json({ limit: '100kb' }));
// Africa's Talking delivery reports are form-encoded
app.use('/api/sms/delivery-callback', express.urlencoded({ extended: false, limit: '20kb' }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false, message: { success: false, error: 'Too many requests. Please slow down.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false, message: { success: false, error: 'Too many authentication attempts from this network. Try again later.' } });
app.use('/api', apiLimiter);
app.use(['/api/auth/login', '/api/auth/signup', '/api/auth/google'], authLimiter);

// Populate req.user from a verified JWT on every request
app.use(verifyToken);

// ---------------------------------------------------------------- admin console
// Server-rendered database tables - ADMIN ONLY (HttpOnly session cookie, set after admin login).
function consoleCsp(res) {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  return nonce;
}

app.get('/', (req, res) => {
  const nonce = consoleCsp(res);
  res.type('html');
  if (!req.user || req.user.role !== 'admin') {
    return res.status(req.user ? 403 : 200).send(buildConsoleLoginHtml({ nonce, forbidden: Boolean(req.user) }));
  }
  const db = readLocalData();
  res.send(buildConsoleHtml({ db, user: req.user, nonce, engine: isFirestoreEnabled() ? 'Firebase Firestore' : 'Local JSON store' }));
});

// Exchange an admin Bearer token for an HttpOnly cookie used by the console
app.post('/console/session', requireRole(['admin']), (req, res) => {
  const token = (req.headers.authorization || '').slice(7);
  res.setHeader(
    'Set-Cookie',
    `se_token=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${8 * 3600}${isProd ? '; Secure' : ''}`
  );
  res.json({ success: true });
});
app.post('/console/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'se_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ success: true });
});

// ---------------------------------------------------------------- misc
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SmartEvent Express Backend',
    database: isFirestoreEnabled() ? 'Firebase Firestore' : 'Local JSON store',
    smsGateway: process.env.AT_API_KEY ? `Africa's Talking (${process.env.AT_USERNAME || 'sandbox'})` : 'Simulation mode (no AT_API_KEY)',
    googleSignIn: process.env.GOOGLE_CLIENT_ID ? 'google' : isProd ? 'disabled' : 'demo',
    timestamp: new Date().toISOString()
  });
});

// ---------------------------------------------------------------- API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/predict', require('./routes/predict'));

app.use('/api', (req, res) => res.status(404).json({ success: false, error: `No such endpoint: ${req.method} ${req.originalUrl}` }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Malformed JSON body.' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Request body too large.' });
  }
  console.error('[server error]', err);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`[SmartEvent Backend] Running on http://localhost:${PORT}`));
}

module.exports = app;
