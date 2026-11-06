const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { readLocalData, writeLocalData, logActivity } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { normalizeKenyanPhone } = require('../utils/phone');
const { normalizeTier, tierLabel, recomputeEventSms } = require('../utils/smsTier');
const { passwordPolicyError } = require('./auth');

const ROLES = ['admin', 'organizer', 'student'];
const STATUSES = ['Active', 'Suspended'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser(u) {
  if (!u) return null;
  const { password, passwordHash, ...safe } = u;
  return { ...safe, role: String(safe.role || 'student').toLowerCase() };
}

function nextCode(db, prefix, field) {
  const nums = (db.users || [])
    .map((u) => String(u[field] || ''))
    .filter((c) => c.startsWith(prefix))
    .map((c) => parseInt(c.slice(prefix.length + 1), 10) || 0);
  return `${prefix}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
}

/** Keep the role profile tables in sync with the user record. */
function syncProfile(db, user) {
  const base = { userId: user.id, name: user.name, email: user.email, phone: user.phone };
  const upsert = (table, extra, createDefaults) => {
    db[table] = db[table] || [];
    const found = db[table].find((p) => p.userId === user.id);
    if (found) Object.assign(found, base, extra);
    else db[table].push({ id: `${table.slice(0, 4)}-${Date.now()}`, ...createDefaults, ...base, ...extra });
  };
  if (user.role === 'student') {
    upsert('student_profiles', { studentId: user.studentId, program: user.department }, { faculty: 'SCES', yearOfStudy: 1, hostelResident: false, pastAttendanceRate: 0.8 });
  } else if (user.role === 'organizer') {
    upsert('organizer_profiles', { organizerCode: user.organizerCode, department: user.department }, { officeLocation: 'Strathmore University Campus', verified: true, eventsHostedCount: 0 });
  } else if (user.role === 'admin') {
    upsert('admin_profiles', { staffId: user.staffId, department: user.department }, { title: 'System Administrator', clearanceLevel: 'Admin' });
  }
}

function removeProfiles(db, userId) {
  ['student_profiles', 'organizer_profiles', 'admin_profiles'].forEach((t) => {
    if (db[t]) db[t] = db[t].filter((p) => p.userId !== userId);
  });
}

function adminCount(db) {
  return (db.users || []).filter((u) => String(u.role).toLowerCase() === 'admin' && String(u.status || 'Active') !== 'Suspended').length;
}

// GET /api/users - list users (ADMIN)
router.get('/', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  let list = (db.users || []).map(sanitizeUser);
  const { role, search, status } = req.query;

  if (role && role !== 'All') list = list.filter((u) => u.role === String(role).toLowerCase());
  if (status && status !== 'All') list = list.filter((u) => String(u.status || 'Active').toLowerCase() === String(status).toLowerCase());
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((u) =>
      [u.name, u.email, u.studentId, u.organizerCode, u.staffId, u.department].some((f) => f && String(f).toLowerCase().includes(q))
    );
  }

  res.json({ success: true, count: list.length, total: (db.users || []).length, data: list });
});

// POST /api/users - create a user of any role (ADMIN)
router.post('/', requireRole(['admin']), (req, res) => {
  const { name, email, password, role, studentId, phone, department, status } = req.body || {};
  if (!name || !String(name).trim() || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (!EMAIL_RE.test(normalizedEmail)) return res.status(400).json({ success: false, error: 'Invalid email address.' });

  const pwErr = passwordPolicyError(password);
  if (pwErr) return res.status(400).json({ success: false, error: pwErr });

  const validRole = String(role || 'student').toLowerCase();
  if (!ROLES.includes(validRole)) return res.status(400).json({ success: false, error: 'Invalid role.' });

  const normalizedPhone = normalizeKenyanPhone(phone);
  if (!normalizedPhone) return res.status(400).json({ success: false, error: 'Enter a valid Kenyan mobile number.' });

  const db = readLocalData();
  db.users = db.users || [];
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ success: false, error: 'A user with this email already exists.' });
  }

  let cleanStudentId;
  if (validRole === 'student') {
    cleanStudentId = String(studentId || '').trim();
    if (!/^\d{5,8}$/.test(cleanStudentId)) return res.status(400).json({ success: false, error: 'Students need a valid admission number (5-8 digits).' });
    if (db.users.some((u) => u.studentId === cleanStudentId)) return res.status(409).json({ success: false, error: 'Admission number already in use.' });
  }

  const user = {
    id: `usr-${validRole}-${Date.now()}`,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(password, 10),
    role: validRole,
    studentId: cleanStudentId,
    staffId: validRole === 'admin' ? nextCode(db, 'ADM', 'staffId') : undefined,
    organizerCode: validRole === 'organizer' ? nextCode(db, 'ORG', 'organizerCode') : undefined,
    phone: normalizedPhone,
    department: department ? String(department).trim() : 'School of Computing & Engineering Sciences',
    status: STATUSES.includes(status) ? status : 'Active',
    authProvider: 'local',
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  db.users.unshift(user);
  syncProfile(db, user);
  logActivity(db, 'USER_CREATED', `${req.user.name} created ${validRole.toUpperCase()} account for ${user.name}`);
  writeLocalData(db);

  res.status(201).json({ success: true, message: 'User created successfully', data: sanitizeUser(user) });
});

// GET /api/users/:id - own profile or ADMIN
router.get('/:id', requireAuth, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'You can only view your own profile.' });
  }
  const user = (readLocalData().users || []).find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
  res.json({ success: true, data: sanitizeUser(user) });
});

// PUT /api/users/:id - update own profile (limited fields) or any user (ADMIN)
router.put('/:id', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  if (req.user.id !== req.params.id && !isAdmin) {
    return res.status(403).json({ success: false, error: 'You can only modify your own account.' });
  }

  const db = readLocalData();
  const user = (db.users || []).find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

  const { name, email, department, studentId, phone, role, status, password, smsOptOut, smsPriority, applyToRegistrations } = req.body || {};

  if (smsOptOut !== undefined) user.smsOptOut = Boolean(smsOptOut);

  // The student's default SMS tier (0 none, 1 low, 2 medium, 3 high) - pre-selected on every new registration.
  if (smsPriority !== undefined) {
    const tier = normalizeTier(smsPriority, -1);
    if (tier === -1) return res.status(400).json({ success: false, error: 'SMS priority must be NONE, LOW, MEDIUM or HIGH.' });
    user.smsPriority = tier;
    if (applyToRegistrations) {
      (db.registrations || []).filter((r) => r.userId === user.id).forEach((r) => {
        r.smsPriority = tier;
        r.smsPriorityLabel = tierLabel(tier);
        recomputeEventSms(db, (db.events || []).find((e) => e.id === r.eventId));
      });
    }
  }

  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ success: false, error: 'Name cannot be empty.' });
    user.name = String(name).trim();
  }
  if (department !== undefined) user.department = String(department).trim();

  if (phone !== undefined && phone !== '') {
    const p = normalizeKenyanPhone(phone);
    if (!p) return res.status(400).json({ success: false, error: 'Enter a valid Kenyan mobile number.' });
    user.phone = p;
  }

  if (email !== undefined && String(email).toLowerCase() !== user.email) {
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Only an administrator can change an email address.' });
    const e = String(email).trim().toLowerCase();
    if (!EMAIL_RE.test(e)) return res.status(400).json({ success: false, error: 'Invalid email address.' });
    if (db.users.some((u) => u.id !== user.id && u.email.toLowerCase() === e)) {
      return res.status(409).json({ success: false, error: 'That email is already in use.' });
    }
    user.email = e;
  }

  if (studentId !== undefined && user.role === 'student' && String(studentId) !== String(user.studentId)) {
    if (!isAdmin) return res.status(403).json({ success: false, error: 'Only an administrator can change an admission number.' });
    if (!/^\d{5,8}$/.test(String(studentId))) return res.status(400).json({ success: false, error: 'Invalid admission number.' });
    if (db.users.some((u) => u.id !== user.id && u.studentId === String(studentId))) {
      return res.status(409).json({ success: false, error: 'Admission number already in use.' });
    }
    user.studentId = String(studentId);
  }

  if (isAdmin) {
    if (role !== undefined && String(role).toLowerCase() !== user.role) {
      const r = String(role).toLowerCase();
      if (!ROLES.includes(r)) return res.status(400).json({ success: false, error: 'Invalid role.' });
      if (user.role === 'admin' && adminCount(db) <= 1) {
        return res.status(400).json({ success: false, error: 'You cannot demote the last administrator.' });
      }
      user.role = r;
      if (r === 'organizer' && !user.organizerCode) user.organizerCode = nextCode(db, 'ORG', 'organizerCode');
      if (r === 'admin' && !user.staffId) user.staffId = nextCode(db, 'ADM', 'staffId');
    }
    if (status !== undefined) {
      if (!STATUSES.includes(status)) return res.status(400).json({ success: false, error: 'Status must be Active or Suspended.' });
      if (status === 'Suspended' && user.id === req.user.id) {
        return res.status(400).json({ success: false, error: 'You cannot suspend your own account.' });
      }
      if (status === 'Suspended' && user.role === 'admin' && adminCount(db) <= 1) {
        return res.status(400).json({ success: false, error: 'You cannot suspend the last administrator.' });
      }
      user.status = status;
    }
    if (password) {
      const pwErr = passwordPolicyError(password);
      if (pwErr) return res.status(400).json({ success: false, error: pwErr });
      user.passwordHash = bcrypt.hashSync(password, 10);
    }
  } else if (password) {
    return res.status(403).json({ success: false, error: 'Use the change-password form (requires your current password).' });
  }

  user.updatedAt = new Date().toISOString();
  syncProfile(db, user);
  if (isAdmin && req.user.id !== user.id) logActivity(db, 'USER_UPDATED', `${req.user.name} updated ${user.name}`);
  writeLocalData(db);

  res.json({ success: true, message: 'Profile updated successfully', data: sanitizeUser(user) });
});

// DELETE /api/users/:id - delete account and related data (ADMIN)
router.delete('/:id', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  const index = (db.users || []).findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'User not found.' });

  const target = db.users[index];
  if (target.id === req.user.id) return res.status(400).json({ success: false, error: 'You cannot delete your own account.' });
  if (target.role === 'admin' && adminCount(db) <= 1) {
    return res.status(400).json({ success: false, error: 'You cannot delete the last administrator.' });
  }

  db.users.splice(index, 1);
  removeProfiles(db, target.id);

  // cascade: their registrations, favourites, notifications
  const removedRegs = (db.registrations || []).filter((r) => r.userId === target.id);
  db.registrations = (db.registrations || []).filter((r) => r.userId !== target.id);
  removedRegs.forEach((r) => {
    const ev = (db.events || []).find((e) => e.id === r.eventId);
    if (ev && ev.registrationCount > 0) ev.registrationCount -= 1;
  });
  db.favorites = (db.favorites || []).filter((f) => f.userId !== target.id);
  db.notifications = (db.notifications || []).filter((n) => n.userId !== target.id);

  // an organizer's events are kept but marked as orphaned so history is not lost
  if (target.role === 'organizer') {
    (db.events || []).forEach((e) => {
      if (e.organizerId === target.id) e.status = 'Cancelled';
    });
  }

  logActivity(db, 'USER_DELETED', `${req.user.name} deleted ${target.role.toUpperCase()} account ${target.name}`);
  writeLocalData(db);

  res.json({ success: true, message: 'User account deleted successfully', data: sanitizeUser(target) });
});

module.exports = router;
