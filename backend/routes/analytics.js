const express = require('express');
const router = express.Router();
const { readLocalData } = require('../db');
const { requireRole } = require('../middleware/auth');
const { buildSummary } = require('./admin');

// GET /api/analytics - live analytics (ADMIN: system-wide, ORGANIZER: own events only)
router.get('/', requireRole(['admin', 'organizer']), (req, res) => {
  const db = readLocalData();
  if (req.user.role === 'organizer') {
    // scope the dataset down to this organizer's events before summarising
    const mine = (db.events || []).filter((e) => e.organizerId === req.user.id);
    const ids = new Set(mine.map((e) => e.id));
    const scoped = {
      ...db,
      events: mine,
      registrations: (db.registrations || []).filter((r) => ids.has(r.eventId)),
      smsLogs: (db.smsLogs || []).filter((l) => ids.has(l.eventId))
    };
    return res.json({ success: true, scope: 'organizer', data: buildSummary(scoped) });
  }
  res.json({ success: true, scope: 'system', data: buildSummary(db) });
});

module.exports = router;
