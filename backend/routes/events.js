const express = require('express');
const router = express.Router();
const { readLocalData, writeLocalData, logActivity, addNotification } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const EVENT_STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function deriveTimeSlot(time) {
  const m = String(time || '').match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!m) return 'Afternoon';
  let h = parseInt(m[1], 10);
  if (m[2]) {
    if (m[2].toUpperCase() === 'PM' && h < 12) h += 12;
    if (m[2].toUpperCase() === 'AM' && h === 12) h = 0;
  }
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}

function isRealDate(str) {
  if (!DATE_RE.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

function withOrganizer(db, e) {
  const org = (db.users || []).find((u) => u.id === e.organizerId);
  return {
    ...e,
    organizerName: org ? org.name : e.organizerName || e.organizer || 'Strathmore University',
    organizer: org ? org.name : e.organizer || e.organizerName || 'Strathmore University'
  };
}

function canManage(user, event) {
  return user.role === 'admin' || (user.role === 'organizer' && event.organizerId === user.id);
}

function validateEventInput(db, body, { partial = false } = {}) {
  const errors = [];
  const out = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has('title')) {
    const t = String(body.title || '').trim();
    if (t.length < 3 || t.length > 140) errors.push('Title must be 3-140 characters.');
    out.title = t;
  }
  if (!partial || has('category')) {
    const cat = (db.categories || []).find((c) => c.name.toLowerCase() === String(body.category || '').toLowerCase());
    if (!cat) errors.push(`Unknown category. Choose one of: ${(db.categories || []).map((c) => c.name).join(', ')}.`);
    else out.category = cat.name;
  }
  if (!partial || has('venue')) {
    const v = String(body.venue || '').trim();
    if (!v) errors.push('Venue is required.');
    out.venue = v;
  }
  if (!partial || has('venueCapacity')) {
    const cap = parseInt(body.venueCapacity, 10);
    if (!Number.isInteger(cap) || cap < 1 || cap > 100000) errors.push('Venue capacity must be a whole number between 1 and 100000.');
    out.venueCapacity = cap;
  }
  if (!partial || has('date')) {
    if (!isRealDate(body.date)) errors.push('Date must be a valid date in YYYY-MM-DD format.');
    out.date = body.date;
  }
  if (has('time')) out.time = String(body.time).trim();
  if (has('description')) out.description = String(body.description).trim().slice(0, 2000);
  if (has('smsPriority')) {
    const p = parseInt(body.smsPriority, 10);
    if (![1, 2, 3].includes(p)) errors.push('SMS priority must be 1 (Low), 2 (Medium) or 3 (High).');
    out.smsPriority = p;
  }
  if (has('featured')) out.featured = Boolean(body.featured);
  if (has('status')) {
    if (!EVENT_STATUSES.includes(body.status)) errors.push(`Status must be one of ${EVENT_STATUSES.join(', ')}.`);
    out.status = body.status;
  }
  return { errors, out };
}

// GET /api/events - public listing with search / filter / sort
router.get('/', (req, res) => {
  const db = readLocalData();
  const { search, category, organizerId, status, featured, from, to, sort } = req.query;
  const canSeeCancelled = req.user && ['admin', 'organizer'].includes(req.user.role);

  let list = (db.events || []).filter((e) => canSeeCancelled || e.status !== 'Cancelled');

  if (category && category !== 'All') list = list.filter((e) => e.category === category);
  if (organizerId) list = list.filter((e) => e.organizerId === organizerId);
  if (status && status !== 'All') list = list.filter((e) => e.status === status);
  if (featured === 'true') list = list.filter((e) => e.featured);
  if (from) list = list.filter((e) => e.date >= from);
  if (to) list = list.filter((e) => e.date <= to);
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((e) =>
      [e.title, e.description, e.venue, e.category, e.organizerName].some((f) => f && String(f).toLowerCase().includes(q))
    );
  }

  const enriched = list.map((e) => withOrganizer(db, e));
  if (sort === 'popular') enriched.sort((a, b) => (b.registrationCount || 0) - (a.registrationCount || 0));
  else if (sort === 'newest') enriched.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  else enriched.sort((a, b) => String(a.date).localeCompare(String(b.date)));

  res.json({ success: true, count: enriched.length, total: (db.events || []).length, data: enriched });
});

// GET /api/events/mine - events owned by the logged-in organizer
router.get('/mine', requireRole(['organizer', 'admin']), (req, res) => {
  const db = readLocalData();
  const list = (db.events || [])
    .filter((e) => req.user.role === 'admin' || e.organizerId === req.user.id)
    .map((e) => withOrganizer(db, e))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  res.json({ success: true, count: list.length, data: list });
});

// GET /api/events/:id - public event details
router.get('/:id', (req, res) => {
  const db = readLocalData();
  const event = (db.events || []).find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });
  res.json({ success: true, data: withOrganizer(db, event) });
});

// GET /api/events/:id/attendees - roster (owning organizer or admin)
router.get('/:id/attendees', requireRole(['organizer', 'admin']), (req, res) => {
  const db = readLocalData();
  const event = (db.events || []).find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });
  if (!canManage(req.user, event)) {
    return res.status(403).json({ success: false, error: "You can only view the attendee list of events you organise." });
  }
  const attendees = (db.registrations || []).filter((r) => r.eventId === event.id);
  res.json({ success: true, count: attendees.length, data: attendees });
});

// POST /api/events - create an event
router.post('/', requireRole(['organizer', 'admin']), (req, res) => {
  const db = readLocalData();
  const { errors, out } = validateEventInput(db, req.body || {});
  if (errors.length) return res.status(400).json({ success: false, error: errors[0], errors });

  const today = new Date().toISOString().slice(0, 10);
  if (out.date < today && req.user.role !== 'admin') {
    return res.status(400).json({ success: false, error: 'Event date cannot be in the past.' });
  }

  // Admins may create events on behalf of an organizer
  let owner = req.user;
  if (req.user.role === 'admin' && req.body.organizerId) {
    const o = (db.users || []).find((u) => u.id === req.body.organizerId && u.role === 'organizer');
    if (!o) return res.status(400).json({ success: false, error: 'organizerId does not match an organizer account.' });
    owner = o;
  }

  const time = out.time || '10:00 - 12:00';
  const newEvent = {
    id: `evt-${Date.now()}`,
    title: out.title,
    category: out.category,
    description: out.description || '',
    date: out.date,
    dayOfWeek: DAYS[new Date(`${out.date}T00:00:00Z`).getUTCDay()],
    time,
    timeSlot: deriveTimeSlot(time),
    venue: out.venue,
    venueCapacity: out.venueCapacity,
    registrationCount: 0,
    pastAttendanceRate: 0.75,
    predictedAttendance: Math.round(out.venueCapacity * 0.6),
    smsPriority: out.smsPriority || 2,
    featured: Boolean(out.featured && req.user.role === 'admin'),
    status: 'Upcoming',
    organizerId: owner.id,
    organizerName: owner.name,
    createdAt: new Date().toISOString()
  };

  db.events = db.events || [];
  db.events.unshift(newEvent);
  logActivity(db, 'EVENT_CREATED', `${owner.name} listed "${newEvent.title}" (${newEvent.date})`);
  writeLocalData(db);

  res.status(201).json({ success: true, message: 'Event created successfully', data: withOrganizer(db, newEvent) });
});

// PUT /api/events/:id - update (owner or admin). Only whitelisted fields are writable.
router.put('/:id', requireRole(['organizer', 'admin']), (req, res) => {
  const db = readLocalData();
  const event = (db.events || []).find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });
  if (!canManage(req.user, event)) {
    return res.status(403).json({ success: false, error: 'You can only edit events that you organise.' });
  }

  const { errors, out } = validateEventInput(db, req.body || {}, { partial: true });
  if (errors.length) return res.status(400).json({ success: false, error: errors[0], errors });

  if (out.venueCapacity !== undefined && out.venueCapacity < (event.registrationCount || 0)) {
    return res.status(400).json({
      success: false,
      error: `Capacity cannot be lower than the ${event.registrationCount} students already registered.`
    });
  }
  if (out.featured !== undefined && req.user.role !== 'admin') delete out.featured;

  const previous = { date: event.date, venue: event.venue, time: event.time, status: event.status };
  Object.assign(event, out);
  if (out.date) event.dayOfWeek = DAYS[new Date(`${out.date}T00:00:00Z`).getUTCDay()];
  if (out.time) event.timeSlot = deriveTimeSlot(out.time);
  event.updatedAt = new Date().toISOString();

  // Tell registered students when something that affects them changes
  const changed = [];
  if (out.date && out.date !== previous.date) changed.push(`date is now ${event.date}`);
  if (out.venue && out.venue !== previous.venue) changed.push(`venue is now ${event.venue}`);
  if (out.time && out.time !== previous.time) changed.push(`time is now ${event.time}`);
  if (out.status === 'Cancelled' && previous.status !== 'Cancelled') changed.push('this event has been CANCELLED');
  if (changed.length) {
    (db.registrations || [])
      .filter((r) => r.eventId === event.id && r.userId)
      .forEach((r) =>
        addNotification(db, {
          userId: r.userId,
          title: `Update: ${event.title}`,
          message: `Heads up - ${changed.join(', ')}.`,
          type: 'EVENT_UPDATE',
          priority: 'HIGH'
        })
      );
  }

  logActivity(db, 'EVENT_UPDATED', `${req.user.name} updated "${event.title}"`);
  writeLocalData(db);
  res.json({ success: true, message: 'Event updated successfully', data: withOrganizer(db, event) });
});

// DELETE /api/events/:id - delete (owner or admin) and cascade
router.delete('/:id', requireRole(['organizer', 'admin']), (req, res) => {
  const db = readLocalData();
  const index = (db.events || []).findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Event not found.' });

  const event = db.events[index];
  if (!canManage(req.user, event)) {
    return res.status(403).json({ success: false, error: 'You can only delete events that you organise.' });
  }

  (db.registrations || [])
    .filter((r) => r.eventId === event.id && r.userId)
    .forEach((r) =>
      addNotification(db, {
        userId: r.userId,
        title: `Event removed: ${event.title}`,
        message: 'This event has been removed by the organiser and your registration was cancelled.',
        type: 'EVENT_UPDATE',
        priority: 'HIGH'
      })
    );

  db.events.splice(index, 1);
  db.registrations = (db.registrations || []).filter((r) => r.eventId !== event.id);
  db.favorites = (db.favorites || []).filter((f) => f.eventId !== event.id);
  logActivity(db, 'EVENT_DELETED', `${req.user.name} deleted "${event.title}"`);
  writeLocalData(db);

  res.json({ success: true, message: 'Event deleted successfully', data: event });
});

module.exports = router;
