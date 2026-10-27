const express = require('express');
const router = express.Router();
const { readLocalData, writeLocalData } = require('../db');
const { requireAuth } = require('../middleware/auth');

const visibleTo = (user) => (n) => n.userId === user.id || n.userId === 'all';

// GET /api/notifications - the logged-in user's notifications (newest first)
router.get('/', requireAuth, (req, res) => {
  const db = readLocalData();
  const list = (db.notifications || [])
    .filter(visibleTo(req.user))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json({ success: true, count: list.length, unreadCount: list.filter((n) => !n.read).length, data: list });
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, (req, res) => {
  const db = readLocalData();
  (db.notifications || []).filter((n) => n.userId === req.user.id).forEach((n) => (n.read = true));
  writeLocalData(db);
  res.json({ success: true, message: 'All notifications marked as read' });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, (req, res) => {
  const db = readLocalData();
  const n = (db.notifications || []).find((x) => x.id === req.params.id && x.userId === req.user.id);
  if (!n) return res.status(404).json({ success: false, error: 'Notification not found.' });
  n.read = true;
  writeLocalData(db);
  res.json({ success: true, data: n });
});

// DELETE /api/notifications/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = readLocalData();
  const before = (db.notifications || []).length;
  db.notifications = (db.notifications || []).filter((x) => !(x.id === req.params.id && x.userId === req.user.id));
  if (db.notifications.length === before) return res.status(404).json({ success: false, error: 'Notification not found.' });
  writeLocalData(db);
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = router;
