const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { readLocalData, writeLocalData, logActivity } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../middleware/secret');
const { normalizeKenyanPhone } = require('../utils/phone');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_ALLOWED_DOMAINS = (process.env.GOOGLE_ALLOWED_DOMAINS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

// ---------------------------------------------------------------- brute force
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;

function checkLock(key) {
  const rec = loginAttempts.get(key);
  if (!rec || rec.count < MAX_FAILED_ATTEMPTS) return null;
  const elapsed = Date.now() - rec.last;
  if (elapsed >= LOCKOUT_MS) {
    loginAttempts.delete(key);
    return null;
  }
  return Math.ceil((LOCKOUT_MS - elapsed) / 1000);
}
const failAttempt = (key) => {
  const rec = loginAttempts.get(key) || { count: 0, last: 0 };
  loginAttempts.set(key, { count: rec.count + 1, last: Date.now() });
};
const clearAttempts = (key) => loginAttempts.delete(key);

// -------------------------------------------------------------------- helpers
function signAuthToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: String(user.role).toLowerCase(), name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' }
  );
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...safe } = user;
  return { ...safe, role: String(safe.role || 'student').toLowerCase() };
}

function verifyPassword(user, candidate) {
  if (!candidate || typeof candidate !== 'string' || !user.passwordHash) return false;
  return bcrypt.compareSync(candidate, user.passwordHash);
}

// Pre-computed hash used to equalize timing when the account does not exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

function passwordPolicyError(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createRoleProfile(db, user) {
  if (user.role === 'student') {
    db.student_profiles = db.student_profiles || [];
    db.student_profiles.push({
      id: `stud-prof-${Date.now()}`,
      userId: user.id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      program: user.department,
      faculty: 'SCES',
      yearOfStudy: 1,
      phone: user.phone,
      hostelResident: false,
      pastAttendanceRate: 0.8
    });
  } else if (user.role === 'organizer') {
    db.organizer_profiles = db.organizer_profiles || [];
    db.organizer_profiles.push({
      id: `org-prof-${Date.now()}`,
      userId: user.id,
      organizerCode: user.organizerCode,
      name: user.name,
      email: user.email,
      department: user.department,
      officeLocation: 'Strathmore University Campus',
      phone: user.phone,
      verified: false,
      eventsHostedCount: 0
    });
  }
}

function nextCode(db, prefix, field) {
  const nums = (db.users || [])
    .map((u) => String(u[field] || ''))
    .filter((c) => c.startsWith(prefix))
    .map((c) => parseInt(c.slice(prefix.length + 1), 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

function buildNewUser(db, { name, email, password, role, studentId, phone, department, organizationName, authProvider, extra = {} }) {
  const user = {
    id: `usr-${role}-${Date.now()}`,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    phone,
    department: department || 'School of Computing & Engineering Sciences',
    status: 'Active',
    authProvider,
    createdAt: new Date().toISOString(),
    ...extra
  };
  if (role === 'student') user.studentId = studentId;
  if (role === 'organizer') {
    user.organizerCode = nextCode(db, 'ORG', 'organizerCode');
    user.organizationName = organizationName || `${user.name} Events`;
  }
  return user;
}

// ------------------------------------------------------------------- SIGN UP
// POST /api/auth/signup - public registration for STUDENT and ORGANIZER only
router.post('/signup', (req, res) => {
  const { name, email, password, role, studentId, phone, department, organizationName } = req.body || {};

  if (!name || !String(name).trim() || !email || !password) {
    return res.status(400).json({ success: false, error: 'Full name, email address and password are required.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (!EMAIL_RE.test(normalizedEmail)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
  }
  const pwErr = passwordPolicyError(password);
  if (pwErr) return res.status(400).json({ success: false, error: pwErr });

  const requestedRole = String(role || 'student').trim().toLowerCase();
  if (requestedRole === 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Administrator accounts cannot be self-registered. Ask an existing administrator to create one.'
    });
  }
  if (!['student', 'organizer'].includes(requestedRole)) {
    return res.status(400).json({ success: false, error: "Role must be 'student' or 'organizer'." });
  }

  const normalizedPhone = normalizeKenyanPhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({
      success: false,
      error: 'Enter a valid Kenyan mobile number (e.g. 0712345678 or +254712345678) so you can receive SMS alerts.'
    });
  }

  const db = readLocalData();
  db.users = db.users || [];
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists. Please sign in instead.' });
  }

  let cleanStudentId;
  if (requestedRole === 'student') {
    cleanStudentId = String(studentId || '').trim();
    if (!/^\d{5,8}$/.test(cleanStudentId)) {
      return res.status(400).json({ success: false, error: 'Enter a valid admission number (5-8 digits).' });
    }
    if (db.users.some((u) => u.studentId === cleanStudentId)) {
      return res.status(409).json({ success: false, error: 'That admission number is already registered.' });
    }
  }

  const newUser = buildNewUser(db, {
    name,
    email: normalizedEmail,
    password,
    role: requestedRole,
    studentId: cleanStudentId,
    phone: normalizedPhone,
    department: department && String(department).trim(),
    organizationName: organizationName && String(organizationName).trim(),
    authProvider: 'local'
  });

  db.users.push(newUser);
  createRoleProfile(db, newUser);
  logActivity(db, 'USER_REGISTERED', `${newUser.name} registered as ${newUser.role.toUpperCase()}`);
  writeLocalData(db);

  res.status(201).json({
    success: true,
    message: 'Account registered successfully!',
    token: signAuthToken(newUser),
    user: sanitizeUser(newUser)
  });
});

// -------------------------------------------------------------------- LOG IN
// POST /api/auth/login - role is derived from the account; an optional `role`
// hint is verified (never trusted) to support role-specific login tabs.
router.post('/login', (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email address and password are required.' });
  }

  const key = String(email).trim().toLowerCase();
  const lockedFor = checkLock(key);
  if (lockedFor) {
    return res.status(429).json({
      success: false,
      error: `Too many failed attempts. This account is locked for another ${lockedFor}s.`
    });
  }

  const db = readLocalData();
  const user = (db.users || []).find((u) => u.email.toLowerCase() === key);

  if (!user) {
    bcrypt.compareSync(String(password), DUMMY_HASH); // equalize timing
    failAttempt(key);
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }
  if (!verifyPassword(user, password)) {
    failAttempt(key);
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }
  if (String(user.status || 'Active').toLowerCase() === 'suspended') {
    return res.status(403).json({ success: false, error: 'This account has been suspended. Contact a system administrator.' });
  }

  const actualRole = String(user.role).toLowerCase();
  const hint = role ? String(role).trim().toLowerCase() : 'auto';
  if (hint !== 'auto' && hint !== actualRole) {
    return res.status(403).json({
      success: false,
      error: `This account is registered as ${actualRole.toUpperCase()}, not ${hint.toUpperCase()}.`
    });
  }

  clearAttempts(key);
  user.lastLoginAt = new Date().toISOString();
  writeLocalData(db);

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token: signAuthToken(user),
    user: sanitizeUser(user)
  });
});

// -------------------------------------------------------------------- GOOGLE
// GET /api/auth/google/config - tells clients which Google flow is active
router.get('/google/config', (req, res) => {
  const prod = process.env.NODE_ENV === 'production';
  res.json({
    success: true,
    mode: GOOGLE_CLIENT_ID ? 'google' : prod ? 'disabled' : 'demo',
    clientId: GOOGLE_CLIENT_ID || null,
    allowedDomains: GOOGLE_ALLOWED_DOMAINS
  });
});

let googleClient = null;
async function verifyGoogleIdToken(idToken) {
  if (!googleClient) {
    const { OAuth2Client } = require('google-auth-library');
    googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  }
  const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  return ticket.getPayload();
}

// POST /api/auth/google
//  * GOOGLE_CLIENT_ID configured -> a Google-signed ID token (`credential`) is cryptographically verified.
//  * not configured (development) -> "demo mode": the email AND that account's password are required.
//  * production without client id -> disabled.
router.post('/google', async (req, res) => {
  try {
    const { credential, email, password, name, role } = req.body || {};
    const db = readLocalData();
    db.users = db.users || [];

    let verifiedEmail;
    let displayName = name;
    let googleId;
    let picture;

    if (GOOGLE_CLIENT_ID) {
      if (!credential || typeof credential !== 'string') {
        return res.status(400).json({ success: false, error: 'Missing Google credential.' });
      }
      let payload;
      try {
        payload = await verifyGoogleIdToken(credential);
      } catch (e) {
        return res.status(401).json({ success: false, error: 'Google could not verify this sign-in. Please try again.' });
      }
      if (!payload || !payload.email || !payload.email_verified) {
        return res.status(401).json({ success: false, error: 'Your Google email address is not verified.' });
      }
      verifiedEmail = payload.email.toLowerCase();
      displayName = payload.name || displayName;
      googleId = payload.sub;
      picture = payload.picture;
      const domain = verifiedEmail.split('@')[1];
      if (GOOGLE_ALLOWED_DOMAINS.length && !GOOGLE_ALLOWED_DOMAINS.includes(domain)) {
        return res.status(403).json({
          success: false,
          error: `Please sign in with a ${GOOGLE_ALLOWED_DOMAINS.map((d) => '@' + d).join(' / ')} Google account.`
        });
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, error: 'Google Sign-In is not configured on this server.' });
      }
      if (!email || !EMAIL_RE.test(String(email).trim())) {
        return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
      }
      verifiedEmail = String(email).trim().toLowerCase();
      const existing = db.users.find((u) => u.email.toLowerCase() === verifiedEmail);
      const lockedFor = checkLock(verifiedEmail);
      if (lockedFor) {
        return res.status(429).json({ success: false, error: `Too many failed attempts. Try again in ${lockedFor}s.` });
      }
      if (existing) {
        if (!verifyPassword(existing, password)) {
          failAttempt(verifiedEmail);
          return res.status(401).json({ success: false, error: 'Incorrect password for this account.' });
        }
        clearAttempts(verifiedEmail);
      } else {
        const pwErr = passwordPolicyError(password);
        if (pwErr) return res.status(400).json({ success: false, error: pwErr });
      }
    }

    let user = db.users.find((u) => u.email.toLowerCase() === verifiedEmail);

    if (user) {
      if (String(user.status || 'Active').toLowerCase() === 'suspended') {
        return res.status(403).json({ success: false, error: 'This account has been suspended.' });
      }
      const actualRole = String(user.role).toLowerCase();
      const hint = role ? String(role).toLowerCase() : 'auto';
      if (hint !== 'auto' && hint !== actualRole) {
        return res.status(403).json({
          success: false,
          error: `This Google account is registered as ${actualRole.toUpperCase()}, not ${hint.toUpperCase()}.`
        });
      }
      user.googleId = googleId || user.googleId;
      user.picture = picture || user.picture;
      if (!String(user.authProvider || '').includes('google')) {
        user.authProvider = `${user.authProvider || 'local'},google`;
      }
      user.lastLoginAt = new Date().toISOString();
    } else {
      const requestedRole = String(role || 'student').toLowerCase();
      if (requestedRole === 'admin') {
        return res.status(403).json({ success: false, error: 'Administrator accounts cannot be created through Google Sign-In.' });
      }
      const finalRole = requestedRole === 'organizer' ? 'organizer' : 'student';
      const generatedStudentId = (() => {
        let id;
        do {
          id = String(150000 + Math.floor(Math.random() * 9000));
        } while (db.users.some((u) => u.studentId === id));
        return id;
      })();
      user = buildNewUser(db, {
        name: displayName || verifiedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: verifiedEmail,
        password: password && !GOOGLE_CLIENT_ID ? password : `G!${require('crypto').randomBytes(12).toString('hex')}1a`,
        role: finalRole,
        studentId: generatedStudentId,
        phone: '',
        authProvider: 'google',
        extra: { googleId, picture, phoneVerified: false }
      });
      db.users.push(user);
      createRoleProfile(db, user);
      logActivity(db, 'USER_REGISTERED', `${user.name} registered via Google as ${user.role.toUpperCase()}`);
    }

    writeLocalData(db);
    res.json({
      success: true,
      message: `Signed in as ${user.name}`,
      token: signAuthToken(user),
      user: sanitizeUser(user),
      needsPhone: !normalizeKenyanPhone(user.phone)
    });
  } catch (err) {
    console.error('[auth/google]', err.message);
    res.status(500).json({ success: false, error: 'Google sign-in failed. Please try again.' });
  }
});

// ------------------------------------------------------------ SESSION / ME
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});

// PUT /api/auth/password - change own password (current password required)
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const pwErr = passwordPolicyError(newPassword);
  if (pwErr) return res.status(400).json({ success: false, error: pwErr });

  const db = readLocalData();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user || !verifyPassword(user, currentPassword)) {
    return res.status(401).json({ success: false, error: 'Your current password is incorrect.' });
  }
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  user.updatedAt = new Date().toISOString();
  writeLocalData(db);
  res.json({ success: true, message: 'Password updated successfully.' });
});

// GET /api/auth/users - kept for backwards compatibility, ADMIN ONLY
router.get('/users', requireRole(['admin']), (req, res) => {
  const users = (readLocalData().users || []).map(sanitizeUser);
  res.json({ success: true, count: users.length, data: users });
});

module.exports = router;
module.exports.sanitizeUser = sanitizeUser;
module.exports.passwordPolicyError = passwordPolicyError;
