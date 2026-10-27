const express = require('express');
const router = express.Router();
const { readLocalData, writeLocalData, logActivity } = require('../db');
const { requireRole } = require('../middleware/auth');

// GET /api/venues - public list used by event forms
router.get('/', (req, res) => {
  const db = readLocalData();
  res.json({ success: true, count: (db.venues || []).length, data: db.venues || [] });
});

function validate(body, partial = false) {
  const out = {};
  const errors = [];
  if (!partial || body.name !== undefined) {
    const n = String(body.name || '').trim();
    if (n.length < 2 || n.length > 80) errors.push('Venue name must be 2-80 characters.');
    out.name = n;
  }
  if (!partial || body.capacity !== undefined) {
    const c = parseInt(body.capacity, 10);
    if (!Number.isInteger(c) || c < 1 || c > 100000) errors.push('Capacity must be between 1 and 100000.');
    out.capacity = c;
  }
  if (body.building !== undefined) out.building = String(body.building).trim().slice(0, 80);
  if (body.hasProjector !== undefined) out.hasProjector = Boolean(body.hasProjector);
  if (body.hasPA !== undefined) out.hasPA = Boolean(body.hasPA);
  return { out, errors };
}

router.post('/', requireRole(['admin']), (req, res) => {
  const { out, errors } = validate(req.body || {});
  if (errors.length) return res.status(400).json({ success: false, error: errors[0] });
  const db = readLocalData();
  db.venues = db.venues || [];
  if (db.venues.some((v) => v.name.toLowerCase() === out.name.toLowerCase())) {
    return res.status(409).json({ success: false, error: 'A venue with this name already exists.' });
  }
  const venue = { id: `ven-${Date.now()}`, building: '', hasProjector: false, hasPA: false, ...out };
  db.venues.push(venue);
  logActivity(db, 'VENUE_CREATED', `${req.user.name} added venue "${venue.name}"`);
  writeLocalData(db);
  res.status(201).json({ success: true, data: venue });
});

router.put('/:id', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  const venue = (db.venues || []).find((v) => v.id === req.params.id);
  if (!venue) return res.status(404).json({ success: false, error: 'Venue not found.' });
  const { out, errors } = validate(req.body || {}, true);
  if (errors.length) return res.status(400).json({ success: false, error: errors[0] });
  if (out.name && out.name !== venue.name) {
    (db.events || []).forEach((e) => {
      if (e.venue === venue.name) e.venue = out.name;
    });
  }
  Object.assign(venue, out);
  writeLocalData(db);
  res.json({ success: true, data: venue });
});

router.delete('/:id', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  const index = (db.venues || []).findIndex((v) => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Venue not found.' });
  const venue = db.venues[index];
  const inUse = (db.events || []).filter((e) => e.venue === venue.name).length;
  if (inUse) return res.status(409).json({ success: false, error: `Cannot delete - ${inUse} event(s) are held at this venue.` });
  db.venues.splice(index, 1);
  writeLocalData(db);
  res.json({ success: true, data: venue });
});

module.exports = router;
