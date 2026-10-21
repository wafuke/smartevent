const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { readLocalData, writeLocalData } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

function sanitizeUser(u) {
  if (!u) return null;
  const { password, passwordHash, ...safe } = u;
  return safe;
}

// GET /api/users - List all users with pagination/filtering (Admin only)
router.get('/', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  const users = (db.users || []).map(sanitizeUser);
  const roleFilter = req.query.role;
  const search = req.query.search;

  let filtered = users;
  if (roleFilter && roleFilter !== 'All') {
    filtered = filtered.filter(u => u.role === roleFilter);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.studentId && u.studentId.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    total: users.length,
    data: filtered
  });
});

// POST /api/users - Create a new user account (Admin only)
router.post('/', requireRole(['admin']), (req, res) => {
  const { name, email, password, role, studentId, phone, department, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const db = readLocalData();
  db.users = db.users || [];

  if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ success: false, error: 'A user with this email already exists' });
  }

  const validRole = ['admin', 'organizer', 'student'].includes(role) ? role : 'student';
  const passwordHash = bcrypt.hashSync(password || 'password123', 10);

  const newUser = {
    id: `usr-${validRole}-${Date.now()}`,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: validRole,
    studentId: validRole === 'student' ? (studentId || `15${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
    adminCode: validRole === 'admin' ? `ADM-00${(db.admin_profiles || []).length + 1}` : undefined,
    organizerCode: validRole === 'organizer' ? `ORG-00${(db.organizer_profiles || []).length + 1}` : undefined,
    phone: phone || '+254712345678',
    department: department || 'School of Computing & Engineering Sciences',
    status: status || 'Active',
    authProvider: 'local',
    createdAt: new Date().toISOString()
  };

  db.users.unshift(newUser);
  writeLocalData(db);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: sanitizeUser(newUser)
  });
});

// GET /api/users/:id - Get specific user profile
router.get('/:id', requireAuth, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized to view this user profile' });
  }

  const db = readLocalData();
  const user = (db.users || []).find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found' });
  }

  res.json({ success: true, data: sanitizeUser(user) });
});

// PUT /api/users/:id - Update user profile
router.put('/:id', requireAuth, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized to modify this user account' });
  }

  const db = readLocalData();
  db.users = db.users || [];
  const index = db.users.findIndex(u => u.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'User account not found' });
  }

  const currentUser = db.users[index];
  const { name, email, department, studentId, phone, role, status, password } = req.body;

  const updatedRole = (req.user.role === 'admin' && role) ? role : currentUser.role;
  const updatedStatus = (req.user.role === 'admin' && status) ? status : (currentUser.status || 'Active');

  db.users[index] = {
    ...currentUser,
    name: name || currentUser.name,
    email: email ? email.toLowerCase() : currentUser.email,
    department: department || currentUser.department,
    studentId: studentId !== undefined ? studentId : currentUser.studentId,
    phone: phone || currentUser.phone,
    role: updatedRole,
    status: updatedStatus,
    ...(password && String(password).length >= 6 ? { passwordHash: bcrypt.hashSync(password, 10) } : {}),
    updatedAt: new Date().toISOString()
  };

  writeLocalData(db);

  res.json({
    success: true,
    message: 'User profile updated successfully',
    data: sanitizeUser(db.users[index])
  });
});

// DELETE /api/users/:id - Delete user account (Admin only)
router.delete('/:id', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  db.users = db.users || [];

  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'User account not found' });
  }

  if (req.user.id === req.params.id) {
    return res.status(400).json({ success: false, error: 'Cannot delete your own active administrator account' });
  }

  const deleted = db.users.splice(index, 1);
  writeLocalData(db);

  res.json({
    success: true,
    message: 'User account deleted successfully',
    data: sanitizeUser(deleted[0])
  });
});

module.exports = router;
