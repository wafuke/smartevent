const express = require('express');
const router = express.Router();
const { readLocalData, writeLocalData } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/favorites - Get user's saved favorite events
router.get('/', requireAuth, (req, res) => {
  const db = readLocalData();
  db.favorites = db.favorites || [];
  
  const userFavorites = db.favorites.filter(f => f.userId === req.user.id);
  const favoriteEventIds = userFavorites.map(f => f.eventId);

  const favoriteEvents = (db.events || []).filter(e => favoriteEventIds.includes(e.id));

  res.json({
    success: true,
    count: favoriteEvents.length,
    data: favoriteEvents,
    favoriteIds: favoriteEventIds
  });
});

// POST /api/favorites/:eventId - Toggle / Save event to favorites
router.post('/:eventId', requireAuth, (req, res) => {
  const eventId = req.params.eventId;
  const db = readLocalData();
  
  db.favorites = db.favorites || [];
  db.events = db.events || [];

  const event = db.events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  const existingIndex = db.favorites.findIndex(
    f => f.userId === req.user.id && f.eventId === eventId
  );

  let isSaved = false;

  if (existingIndex > -1) {
    db.favorites.splice(existingIndex, 1);
    isSaved = false;
  } else {
    db.favorites.push({
      id: `fav-${Date.now()}`,
      userId: req.user.id,
      eventId,
      savedAt: new Date().toISOString()
    });
    isSaved = true;
  }

  writeLocalData(db);

  res.json({
    success: true,
    message: isSaved ? 'Event saved to favorites' : 'Event removed from favorites',
    isSaved,
    eventId
  });
});

module.exports = router;
