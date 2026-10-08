const express = require('express');
const router = express.Router();
const { readLocalData, writeLocalData } = require('../db');
const { requireAuth } = require('../middleware/auth');

const defaultNotifications = [
  {
    id: 'notif-1',
    userId: 'usr-stud-1',
    title: 'Venue Change Alert',
    message: 'Strathmore Tech Summit keynote shifted to Auditorium A. Please arrive by 08:45 AM.',
    type: 'SMS_PRIORITY',
    priority: 'HIGH',
    read: false,
    createdAt: '2026-10-05T08:15:00Z'
  },
  {
    id: 'notif-2',
    userId: 'usr-stud-1',
    title: 'Registration Confirmation',
    message: 'Your spot for AI & Machine Learning Workshop is confirmed.',
    type: 'REGISTRATION',
    priority: 'MEDIUM',
    read: true,
    createdAt: '2026-10-04T14:20:00Z'
  }
];

// GET /api/notifications - List user's notifications
router.get('/', requireAuth, (req, res) => {
  const db = readLocalData();
  if (!db.notifications || db.notifications.length === 0) {
    db.notifications = defaultNotifications;
    writeLocalData(db);
  }

  const userNotifs = db.notifications.filter(
    n => n.userId === req.user.id || n.userId === 'all' || !n.userId
  );

  res.json({
    success: true,
    count: userNotifs.length,
    unreadCount: userNotifs.filter(n => !n.read).length,
    data: userNotifs
  });
});

// PUT /api/notifications/read-all - Mark all user notifications as read
router.put('/read-all', requireAuth, (req, res) => {
  const db = readLocalData();
  db.notifications = db.notifications || defaultNotifications;

  db.notifications.forEach(n => {
    if (n.userId === req.user.id || n.userId === 'all') {
      n.read = true;
    }
  });

  writeLocalData(db);

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

module.exports = router;
