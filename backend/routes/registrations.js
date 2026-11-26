const express = require('express');
const router = express.Router();
const { readLocalData, writeLocalData, logActivity, addNotification } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { normalizeKenyanPhone } = require('../utils/phone');
const { normalizeTier, tierLabel, recomputeEventSms } = require('../utils/smsTier');
const { VALID_FREQUENCIES, runReminderCycle } = require('../services/reminderScheduler');

function ownsEvent(db, user, eventId) {
  const ev = (db.events || []).find((e) => e.id === eventId);
  return Boolean(ev && ev.organizerId === user.id);
}

// GET /api/registrations - role-scoped listing
//   student   -> only their own
//   organizer -> registrations for events they organise
//   admin     -> everything
router.get('/', requireAuth, (req, res) => {
  const db = readLocalData();
  let list = db.registrations || [];
  const { eventId, status } = req.query;

  if (req.user.role === 'student') {
    list = list.filter((r) => r.userId === req.user.id);
  } else if (req.user.role === 'organizer') {
    const mine = new Set((db.events || []).filter((e) => e.organizerId === req.user.id).map((e) => e.id));
    list = list.filter((r) => mine.has(r.eventId));
  }
  if (eventId) list = list.filter((r) => r.eventId === eventId);
  if (status) list = list.filter((r) => (r.status || 'Confirmed').toLowerCase() === String(status).toLowerCase());

  res.json({ success: true, count: list.length, data: list });
});

// GET /api/registrations/mine - the logged-in student's registrations joined with event info
router.get('/mine', requireAuth, (req, res) => {
  const db = readLocalData();
  const regs = (db.registrations || []).filter((r) => r.userId === req.user.id);
  const data = regs.map((r) => ({
    ...r,
    event: (db.events || []).find((e) => e.id === r.eventId) || null
  }));
  res.json({ success: true, count: data.length, data });
});

// POST /api/registrations - a student registers for an event
router.post('/', requireRole(['student']), (req, res) => {
  const { eventId } = req.body || {};
  if (!eventId) return res.status(400).json({ success: false, error: 'eventId is required.' });

  const db = readLocalData();
  db.registrations = db.registrations || [];

  const event = (db.events || []).find((e) => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });
  if (event.status === 'Cancelled') return res.status(400).json({ success: false, error: 'This event has been cancelled.' });
  if (event.status === 'Completed' || event.date < new Date().toISOString().slice(0, 10)) {
    return res.status(400).json({ success: false, error: 'Registration is closed - this event has already taken place.' });
  }

  if (db.registrations.some((r) => r.eventId === eventId && r.userId === req.user.id)) {
    return res.status(409).json({ success: false, error: 'You are already registered for this event.' });
  }
  if ((event.registrationCount || 0) >= event.venueCapacity) {
    return res.status(409).json({ success: false, error: 'Sorry, this event is fully booked.' });
  }

  const me = (db.users || []).find((u) => u.id === req.user.id) || {};
  const phone = normalizeKenyanPhone(me.phone || req.user.phone);
  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'Add a valid mobile number to your profile first so we can send you SMS alerts.'
    });
  }

  // The STUDENT decides how much SMS they want for this event (0 none, 1 low, 2 medium, 3 high).
  // Falls back to their saved default preference, then to MEDIUM.
  const rawTier = (req.body || {}).smsPriority;
  if (rawTier !== undefined && normalizeTier(rawTier, -1) === -1) {
    return res.status(400).json({ success: false, error: 'SMS priority must be NONE, LOW, MEDIUM or HIGH.' });
  }
  const smsPriority = normalizeTier(rawTier, normalizeTier(me.smsPriority));
  const rawFreq = (req.body || {}).smsFrequencyMinutes;
  const parsedFreq = rawFreq === null || rawFreq === undefined || rawFreq === '' ? null : Number(rawFreq);
  const smsFrequencyMinutes = parsedFreq && VALID_FREQUENCIES.includes(parsedFreq) ? parsedFreq : (me.smsFrequencyMinutes || null);

  const registration = {
    id: `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    eventId,
    eventTitle: event.title,
    userId: req.user.id,
    studentId: req.user.studentId,
    studentName: req.user.name,
    studentEmail: req.user.email,
    phone,
    smsPriority,
    smsPriorityLabel: tierLabel(smsPriority),
    smsFrequencyMinutes,
    status: 'Confirmed',
    registeredAt: new Date().toISOString()
  };
  db.registrations.push(registration);

  event.registrationCount = (event.registrationCount || 0) + 1;
  event.predictedAttendance = Math.round(event.registrationCount * (event.pastAttendanceRate || 0.8));
  recomputeEventSms(db, event);

  addNotification(db, {
    userId: req.user.id,
    title: 'Registration confirmed',
    message: `You are registered for "${event.title}" on ${event.date} at ${event.venue}.`,
    type: 'REGISTRATION',
    priority: 'MEDIUM'
  });
  logActivity(db, 'STUDENT_RSVP', `${req.user.name} (${req.user.studentId}) registered for "${event.title}"`);
  writeLocalData(db);

  if (process.env.NODE_ENV !== 'test') {
    runReminderCycle().catch(() => {});
  }

  res.status(201).json({ success: true, message: 'Registration successful!', data: registration });
});

function cancelRegistration(db, index, actor) {
  const [removed] = db.registrations.splice(index, 1);
  const event = (db.events || []).find((e) => e.id === removed.eventId);
  if (event && event.registrationCount > 0) {
    event.registrationCount -= 1;
    event.predictedAttendance = Math.round(event.registrationCount * (event.pastAttendanceRate || 0.8));
  }
  recomputeEventSms(db, event);
  if (removed.userId && removed.userId !== actor.id) {
    addNotification(db, {
      userId: removed.userId,
      title: 'Registration cancelled',
      message: `Your registration for "${removed.eventTitle || 'an event'}" was cancelled by ${actor.role === 'admin' ? 'an administrator' : 'the organiser'}.`,
      type: 'REGISTRATION',
      priority: 'MEDIUM'
    });
  }
  logActivity(db, 'RSVP_CANCELLED', `${actor.name} cancelled the registration of ${removed.studentName} for "${removed.eventTitle || removed.eventId}"`);
  return removed;
}

// PUT /api/registrations/event/:eventId/sms-priority - the student changes their own SMS tier or frequency for an event
router.put('/event/:eventId/sms-priority', requireRole(['student']), (req, res) => {
  const body = req.body || {};
  const hasTier = body.smsPriority !== undefined;
  const hasFreq = body.smsFrequencyMinutes !== undefined;
  if (!hasTier && !hasFreq) {
    return res.status(400).json({ success: false, error: 'Provide smsPriority or smsFrequencyMinutes.' });
  }

  const tier = hasTier ? normalizeTier(body.smsPriority, -1) : null;
  if (hasTier && tier === -1) {
    return res.status(400).json({ success: false, error: 'SMS priority must be NONE, LOW, MEDIUM or HIGH.' });
  }

  let freq = undefined;
  if (hasFreq) {
    if (body.smsFrequencyMinutes === null || body.smsFrequencyMinutes === '' || body.smsFrequencyMinutes === 'auto') {
      freq = null;
    } else {
      const n = Number(body.smsFrequencyMinutes);
      if (!VALID_FREQUENCIES.includes(n)) {
        return res.status(400).json({ success: false, error: 'SMS frequency must be Auto, 30, 60, 180, 360, or 1440 minutes.' });
      }
      freq = n;
    }
  }

  const db = readLocalData();
  const reg = (db.registrations || []).find((r) => r.eventId === req.params.eventId && r.userId === req.user.id);
  if (!reg) return res.status(404).json({ success: false, error: 'You are not registered for this event.' });

  if (hasTier) {
    reg.smsPriority = tier;
    reg.smsPriorityLabel = tierLabel(tier);
    recomputeEventSms(db, (db.events || []).find((e) => e.id === reg.eventId));
  }
  if (hasFreq) {
    reg.smsFrequencyMinutes = freq;
  }
  writeLocalData(db);
  res.json({ success: true, message: 'SMS reminder preference updated.', data: reg });
});

// DELETE /api/registrations/event/:eventId - the student cancels their own RSVP for an event
router.delete('/event/:eventId', requireRole(['student']), (req, res) => {
  const db = readLocalData();
  db.registrations = db.registrations || [];
  const index = db.registrations.findIndex((r) => r.eventId === req.params.eventId && r.userId === req.user.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'You are not registered for this event.' });
  const removed = cancelRegistration(db, index, req.user);
  writeLocalData(db);
  res.json({ success: true, message: 'Registration cancelled successfully', data: removed });
});

// DELETE /api/registrations/:id - cancel by registration id
//   student -> own only, organizer -> registrations of own events, admin -> any
router.delete('/:id', requireAuth, (req, res) => {
  const db = readLocalData();
  db.registrations = db.registrations || [];
  const index = db.registrations.findIndex((r) => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Registration not found.' });

  const reg = db.registrations[index];
  const allowed =
    req.user.role === 'admin' ||
    (req.user.role === 'student' && reg.userId === req.user.id) ||
    (req.user.role === 'organizer' && ownsEvent(db, req.user, reg.eventId));
  if (!allowed) return res.status(403).json({ success: false, error: 'You are not allowed to cancel this registration.' });

  const removed = cancelRegistration(db, index, req.user);
  writeLocalData(db);
  res.json({ success: true, message: 'Registration cancelled successfully', data: removed });
});

module.exports = router;
