const express = require('express');
const router = express.Router();
const { readLocalData, writeLocalData } = require('../db');
const { requireRole } = require('../middleware/auth');

// Students (and only students) can save events
router.use(requireRole(['student']));

// GET /api/favorites - saved events of the logged-in student
router.get('/', (req, res) => {
  const db = readLocalData();
  const ids = (db.favorites || []).filter((f) => f.userId === req.user.id).map((f) => f.eventId);
  const data = (db.events || []).filter((e) => ids.includes(e.id));
  res.json({ success: true, count: data.length, data, favoriteIds: data.map((e) => e.id) });
});

// POST /api/favorites/:eventId - toggle saved state
router.post('/:eventId', (req, res) => {
  const db = readLocalData();
  const event = (db.events || []).find((e) => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });

  db.favorites = db.favorites || [];
  const idx = db.favorites.findIndex((f) => f.userId === req.user.id && f.eventId === event.id);
  let isSaved;
  if (idx > -1) {
    db.favorites.splice(idx, 1);
    isSaved = false;
  } else {
    db.favorites.push({ id: `fav-${Date.now()}`, userId: req.user.id, eventId: event.id, savedAt: new Date().toISOString() });
    isSaved = true;
  }
  writeLocalData(db);
  res.json({ success: true, message: isSaved ? 'Event saved' : 'Event removed from saved', isSaved, eventId: event.id });
});

module.exports = router;
