const express = require('express');
const router = express.Router();
const { readLocalData, writeLocalData } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/users - List all users with pagination/filtering (Admin only)
router.get('/', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  const users = (db.users || []).map(({ password, ...u }) => u);
  const roleFilter = req.query.role;
  const search = req.query.search;

  let filtered = users;
  if (roleFilter) {
    filtered = filtered.filter(u => u.role === roleFilter);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u => 
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
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

// GET /api/users/:id - Get specific user profile
router.get('/:id', requireAuth, (req, res) => {
  // Allow user to view their own profile, or Admin to view any profile
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized to view this user profile' });
  }

  const db = readLocalData();
  const user = (db.users || []).find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found' });
  }

  const { password, ...payload } = user;
  res.json({ success: true, data: payload });
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
  const { name, email, department, studentId, role } = req.body;

  // Only Admin can change role
  const updatedRole = (req.user.role === 'admin' && role) ? role : currentUser.role;

  db.users[index] = {
    ...currentUser,
    name: name || currentUser.name,
    email: email ? email.toLowerCase() : currentUser.email,
    department: department || currentUser.department,
    studentId: studentId || currentUser.studentId,
    role: updatedRole,
    updatedAt: new Date().toISOString()
  };

  writeLocalData(db);

  const { password, ...payload } = db.users[index];
  res.json({
    success: true,
    message: 'User profile updated successfully',
    data: payload
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

  // Prevent deleting self admin
  if (req.user.id === req.params.id) {
    return res.status(400).json({ success: false, error: 'Cannot delete your own active administrator account' });
  }

  const deleted = db.users.splice(index, 1);
  writeLocalData(db);

  const { password, ...payload } = deleted[0];
  res.json({
    success: true,
    message: 'User account deleted successfully',
    data: payload
  });
});

module.exports = router;
