const express = require('express');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const { readLocalData, writeLocalData, logActivity, addNotification } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { normalizeKenyanPhone } = require('../utils/phone');
const sms = require('../services/sms');
const { runReminderCycle } = require('../services/reminderScheduler');

const { normalizeTier, tierLabel, tierReceivesKind, KIND_MIN_TIER } = require('../utils/smsTier');

const PRIORITIES = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };
// What the organiser is sending. Delivery by SMS depends on each STUDENT's own priority tier.
const KINDS = Object.keys(KIND_MIN_TIER);
const MAX_MESSAGE_LENGTH = 480; // 3 SMS segments

const sendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  message: { success: false, error: 'SMS rate limit reached (30 broadcasts per hour). Try again later.' }
});

const ownsEvent = (db, user, eventId) => (db.events || []).some((e) => e.id === eventId && e.organizerId === user.id);

/** Does this log entry belong to the given student? */
function logBelongsTo(log, user) {
  if (log.userId && log.userId === user.id) return true;
  const phone = normalizeKenyanPhone(user.phone);
  if (!phone) return false;
  if (log.recipient && normalizeKenyanPhone(log.recipient) === phone) return true;
  return Array.isArray(log.recipientsSample) && log.recipientsSample.some((p) => normalizeKenyanPhone(p) === phone);
}

// GET /api/sms/status - gateway health & statistics (ADMIN / ORGANIZER)
router.get('/status', requireRole(['admin', 'organizer']), async (req, res) => {
  const cfg = sms.getConfig();
  const db = readLocalData();
  let logs = db.smsLogs || [];
  if (req.user.role === 'organizer') {
    const mine = new Set((db.events || []).filter((e) => e.organizerId === req.user.id).map((e) => e.id));
    logs = logs.filter((l) => mine.has(l.eventId));
  }
  const count = (p) => logs.filter((l) => String(l.priority).toUpperCase() === p).length;
  const balance = req.user.role === 'admin' ? await sms.getBalance() : undefined;

  const modeDescription = {
    LIVE: "Live gateway (Option B) - real SMS are delivered to handsets via Africa's Talking.",
    SANDBOX: "Africa's Talking sandbox - API key configured; enter your Live App Username in Option B to send to real phones.",
    SIMULATION: 'Simulation mode - messages are logged locally without carrier dispatch.'
  }[cfg.mode];

  const payload = {
    gateway: "Africa's Talking SMS API",
    mode: cfg.mode,
    modeDescription,
    username: cfg.username || null,
    maskedApiKey: null,
    hasApiKey: cfg.hasApiKey,
    senderId: cfg.senderId || null,
    balance,
    stats: {
      totalDispatched: logs.length,
      highPriority: count('HIGH'),
      mediumPriority: count('MEDIUM'),
      lowPriority: count('LOW'),
      delivered: logs.filter((l) => /DELIVERED/i.test(l.status || '')).length,
      failed: logs.filter((l) => /FAILED/i.test(l.status || '')).length
    }
  };

  res.json({
    success: true,
    ...payload,
    data: payload
  });
});

// PUT /api/sms/config - configure Africa's Talking credentials & Option B Live Mode (ADMIN / ORGANIZER)
router.put('/config', requireRole(['admin', 'organizer']), (req, res) => {
  const { username, apiKey, senderId, mode } = req.body || {};
  const updated = sms.setRuntimeConfig({ username, apiKey, senderId, mode });
  res.json({
    success: true,
    message: `Africa's Talking gateway updated (${updated.mode} mode).`,
    mode: updated.mode,
    username: updated.username,
    maskedApiKey: updated.maskedApiKey,
    hasApiKey: updated.hasApiKey,
    senderId: updated.senderId
  });
});

// GET /api/sms/logs - role-scoped history
router.get('/logs', requireAuth, (req, res) => {
  const db = readLocalData();
  const { priority, eventId, status } = req.query;
  let logs = db.smsLogs || [];

  if (req.user.role === 'student') {
    logs = logs.filter((l) => logBelongsTo(l, req.user));
  } else if (req.user.role === 'organizer') {
    const mine = new Set((db.events || []).filter((e) => e.organizerId === req.user.id).map((e) => e.id));
    logs = logs.filter((l) => mine.has(l.eventId));
  }

  if (priority && priority !== 'ALL') logs = logs.filter((l) => String(l.priority).toUpperCase() === String(priority).toUpperCase());
  if (eventId) logs = logs.filter((l) => l.eventId === eventId);
  if (status && status !== 'ALL') logs = logs.filter((l) => String(l.status).toUpperCase().startsWith(String(status).toUpperCase()));

  res.json({ success: true, count: logs.length, data: logs.slice(0, 500) });
});

// POST /api/sms/preview - how many people would receive this and what it costs (ADMIN / ORGANIZER)
router.post('/preview', requireRole(['admin', 'organizer']), (req, res) => {
  const db = readLocalData();
  const plan = resolveAudience(db, req.user, req.body || {});
  if (plan.error) return res.status(plan.status || 400).json({ success: false, error: plan.error });
  const message = String((req.body || {}).message || '');
  res.json({
    success: true,
    recipientCount: plan.recipients.length,
    skippedOptOut: plan.skippedOptOut,
    skippedByPreference: plan.skippedByPreference,
    kind: plan.kind,
    byTier: tierBreakdown(plan.recipients),
    invalidNumbers: plan.invalid,
    segments: sms.estimateSegments(message),
    estimatedCostKES: sms.estimateCost(plan.recipients.length, message),
    mode: sms.getConfig().mode
  });
});

/** How many recipients sit on each student-chosen tier. */
function tierBreakdown(recipients) {
  const out = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  recipients.forEach((r) => { const l = tierLabel(r.tier); if (out[l] !== undefined) out[l] += 1; });
  return out;
}

/**
 * Work out who should receive a broadcast, enforcing role rules:
 *  - organizer: only the registered roster of an event THEY organise (or a test to their own phone / explicit numbers on their event)
 *  - admin: any event roster, an explicit list of numbers, or all students
 */
function resolveAudience(db, user, body) {
  const { eventId, audience, phoneNumbers, recipients, testToMe } = body;
  const kind = String(body.kind || 'REMINDER').toUpperCase();
  const out = { recipients: [], invalid: [], skippedOptOut: 0, skippedByPreference: 0, inAppOnly: [], kind };
  if (!KINDS.includes(kind)) return { error: `Message type must be one of ${KINDS.join(', ')}.` };
  const seen = new Set();
  const add = (phone, name, userId, tier) => {
    if (!phone || seen.has(phone)) return;
    seen.add(phone);
    out.recipients.push({ phone, name: name || 'Recipient', userId: userId || null, tier: normalizeTier(tier) });
  };
  // Student-chosen tier gate: students whose tier is too low for this kind of message get an in-app copy only.
  const addByPreference = (phone, name, userId, tier) => {
    if (!tierReceivesKind(tier, kind)) {
      out.skippedByPreference += 1;
      if (userId) out.inAppOnly.push({ userId, name });
      return;
    }
    add(phone, name, userId, tier);
  };
  const usersById = new Map((db.users || []).map((u) => [u.id, u]));

  if (testToMe) {
    const rawTarget = body.testPhone ? String(body.testPhone).trim() : user.phone;
    const own = normalizeKenyanPhone(rawTarget);
    if (!own) return { error: 'Enter a valid Kenyan mobile number (e.g. 0712345678 or +254712345678) to send a test SMS.' };
    add(own, user.name, user.id, user.smsPriority);
    return out;
  }

  if (user.role === 'organizer') {
    if (!eventId) return { error: 'Choose one of your events to message its registered students.' };
    if (!ownsEvent(db, user, eventId)) return { status: 403, error: 'You can only send SMS to students registered for events you organise.' };
  }

  const wantsAll = user.role === 'admin' && audience === 'ALL_STUDENTS';
  const explicit = user.role === 'admin' ? phoneNumbers || recipients : eventId ? phoneNumbers || recipients : null;
  const includeRoster = body.broadcastToEventRoster !== false;

  if (wantsAll) {
    (db.users || []).filter((u) => u.role === 'student' && String(u.status) !== 'Suspended').forEach((u) => {
      if (u.smsOptOut) return void (out.skippedOptOut += 1);
      const p = normalizeKenyanPhone(u.phone);
      p ? addByPreference(p, u.name, u.id, u.smsPriority) : out.invalid.push(u.phone || '(empty)');
    });
  } else if (eventId && (!explicit || includeRoster)) {
    if (!(db.events || []).some((e) => e.id === eventId)) return { status: 404, error: 'Event not found.' };
    if (includeRoster) {
      (db.registrations || []).filter((r) => r.eventId === eventId).forEach((r) => {
        const u = usersById.get(r.userId);
        if (u && u.smsOptOut) return void (out.skippedOptOut += 1);
        const p = normalizeKenyanPhone(r.phone || (u && u.phone));
        p ? addByPreference(p, r.studentName, r.userId, r.smsPriority) : out.invalid.push(r.phone || '(empty)');
      });
    }
    if (explicit) {
      const list = Array.isArray(explicit) ? explicit : String(explicit).split(/[,\n;]+/);
      list.map((s) => String(s).trim()).filter(Boolean).forEach((raw) => {
        const p = normalizeKenyanPhone(raw);
        if (!p) return void out.invalid.push(raw);
        const u = (db.users || []).find((x) => normalizeKenyanPhone(x.phone) === p);
        if (u && u.smsOptOut) return void (out.skippedOptOut += 1);
        add(p, u ? u.name : 'Recipient', u ? u.id : null, u ? u.smsPriority : undefined);
      });
    }
  } else if (explicit) {
    const list = Array.isArray(explicit) ? explicit : String(explicit).split(/[,\n;]+/);
    list.map((s) => String(s).trim()).filter(Boolean).forEach((raw) => {
      const p = normalizeKenyanPhone(raw);
      if (!p) return void out.invalid.push(raw);
      const u = (db.users || []).find((x) => normalizeKenyanPhone(x.phone) === p);
      if (u && u.smsOptOut) return void (out.skippedOptOut += 1);
      add(p, u ? u.name : 'Recipient', u ? u.id : null, u ? u.smsPriority : undefined);
    });
  } else {
    return { error: 'Choose an event, or (admins) enter phone numbers / select all students.' };
  }

  return out;
}

// POST /api/sms/send - send a priority SMS (ADMIN / ORGANIZER)
router.post('/send', requireRole(['admin', 'organizer']), sendLimiter, async (req, res) => {
  const body = req.body || {};
  const message = String(body.message || '').trim();
  if (!message) return res.status(400).json({ success: false, error: 'Message text is required.' });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ success: false, error: `Message is too long (${message.length}/${MAX_MESSAGE_LENGTH} characters).` });
  }

  // SMS priority belongs to the STUDENT (chosen at registration). The organiser only picks the kind of message.
  const kind = String(body.kind || 'REMINDER').toUpperCase();
  if (!KINDS.includes(kind)) return res.status(400).json({ success: false, error: `Message type must be one of ${KINDS.join(', ')}.` });

  const db = readLocalData();
  db.smsLogs = db.smsLogs || [];

  const plan = resolveAudience(db, req.user, body);
  if (plan.error) return res.status(plan.status || 400).json({ success: false, error: plan.error });

  const event = (db.events || []).find((e) => e.id === body.eventId);
  const eventTitle = event ? event.title : 'SmartEvent Campus Alert';
  const text = `[SmartEvent ${kind}] ${eventTitle}: ${message}`;

  // Students whose own SMS tier is too low for this kind of message still get the in-app notification.
  const notifyInApp = (list) =>
    list.filter((r) => r.userId).forEach((r) =>
      addNotification(db, {
        userId: r.userId,
        title: `${kind === 'URGENT' ? 'Urgent' : kind === 'REMINDER' ? 'Reminder' : 'Announcement'}: ${eventTitle}`,
        message,
        type: 'SMS_PRIORITY',
        priority: kind === 'URGENT' ? 'HIGH' : kind === 'REMINDER' ? 'MEDIUM' : 'LOW'
      })
    );

  if (plan.recipients.length === 0) {
    if (plan.inAppOnly.length) {
      notifyInApp(plan.inAppOnly);
      logActivity(db, 'SMS_DISPATCHED', `${req.user.name} sent a ${kind} message "${eventTitle}" - ${plan.inAppOnly.length} student(s) receive it in-app only (their SMS priority is too low)`);
      writeLocalData(db);
      return res.json({
        success: true,
        message: `No SMS sent: all ${plan.inAppOnly.length} registered student(s) chose an SMS priority that excludes ${kind} messages. They received an in-app notification instead.`,
        mode: sms.getConfig().mode,
        kind,
        dispatchedCount: 0,
        failedCount: 0,
        skippedByPreference: plan.skippedByPreference,
        skippedOptOut: plan.skippedOptOut,
        invalidNumbers: plan.invalid,
        logs: [],
        data: { provider: "Africa's Talking", recipientCount: 0, status: 'IN_APP_ONLY' }
      });
    }
    return res.status(400).json({
      success: false,
      error: plan.invalid.length ? `No valid recipients. Invalid numbers: ${plan.invalid.slice(0, 5).join(', ')}` : 'No recipients found (nobody has registered yet, or everyone opted out).'
    });
  }

  const { mode, results, gatewayNote } = await sms.sendBulk(plan.recipients.map((r) => r.phone), text);
  const byPhone = new Map(results.map((r) => [r.phone, r]));
  const batchId = `batch-${Date.now()}`;
  const now = new Date().toISOString();

  const logs = plan.recipients.map((rec, i) => {
    const r = byPhone.get(rec.phone) || { status: 'FAILED', reason: 'No result' };
    const priority = tierLabel(rec.tier); // the RECIPIENT's own SMS priority
    const log = {
      id: `sms-${Date.now()}-${i}`,
      batchId,
      eventId: body.eventId || 'general',
      eventTitle,
      userId: rec.userId,
      recipient: rec.phone,
      recipientName: rec.name,
      message: text,
      kind,
      priority,
      priorityLevel: PRIORITIES[priority],
      priorityChosenBy: 'student',
      status: r.status,
      failureReason: r.reason || null,
      messageId: r.messageId,
      gatewayMode: mode,
      cost: r.cost,
      sentBy: `${req.user.name} (${req.user.role.toUpperCase()})`,
      sentById: req.user.id,
      sentAt: now
    };
    db.smsLogs.unshift(log);
    return log;
  });

  // in-app copy for every student on the roster (SMS recipients and in-app-only students)
  notifyInApp(plan.recipients);
  notifyInApp(plan.inAppOnly);

  const ok = logs.filter((l) => l.status !== 'FAILED').length;
  const failed = logs.length - ok;
  logActivity(db, 'SMS_DISPATCHED', `${req.user.name} sent ${kind} SMS "${eventTitle}" to ${logs.length} recipient(s) [${mode}] - ${failed} failed, ${plan.skippedByPreference} in-app only by student preference`);
  writeLocalData(db);

  const failedLogs = logs.filter((l) => l.status === 'FAILED');
  res.status(failed === logs.length ? 502 : 200).json({
    success: failed !== logs.length,
    message: gatewayNote
      ? gatewayNote
      : mode === 'SIMULATION'
      ? `SIMULATION: ${logs.length} message(s) recorded locally (NOT sent to carrier) - switch to Option B (Live Mode) with your AT App Username to deliver real SMS to handsets.`
      : `${ok} of ${logs.length} SMS accepted by Africa's Talking (${mode})${failed ? `, ${failed} failed` : ''}.`,
    mode,
    gatewayNote: gatewayNote || null,
    kind,
    byTier: tierBreakdown(plan.recipients),
    dispatchedCount: ok,
    failedCount: failed,
    skippedOptOut: plan.skippedOptOut,
    skippedByPreference: plan.skippedByPreference,
    invalidNumbers: plan.invalid,
    segments: sms.estimateSegments(text),
    batchId,
    failures: failedLogs.slice(0, 10).map((l) => ({ recipient: l.recipient, reason: l.failureReason })),
    logs: logs.slice(0, 50),
    // legacy shape for older clients
    data: { provider: "Africa's Talking", recipientCount: logs.length, status: mode === 'SIMULATION' ? 'SIMULATED' : failed ? 'PARTIAL' : 'SENT' }
  });
});

// POST /api/sms/delivery-callback - Africa's Talking delivery report webhook.
// Configure in the AT dashboard: https://YOUR-HOST/api/sms/delivery-callback?secret=<SMS_CALLBACK_SECRET>
router.post('/delivery-callback', (req, res) => {
  const secret = process.env.SMS_CALLBACK_SECRET;
  if (secret ? req.query.secret !== secret : process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  const { id, status, failureReason } = req.body || {};
  if (!id) return res.status(400).json({ success: false, error: 'Missing id' });

  const db = readLocalData();
  const log = (db.smsLogs || []).find((l) => l.messageId === id);
  if (log) {
    const s = String(status || '').toUpperCase();
    log.status = s === 'SUCCESS' || s === 'DELIVERED' ? 'DELIVERED' : s === 'SENT' || s === 'SUBMITTED' || s === 'BUFFERED' ? 'SENT' : 'FAILED';
    if (log.status === 'FAILED') log.failureReason = failureReason || s || 'Delivery failed';
    log.deliveredAt = new Date().toISOString();
    writeLocalData(db);
  }
  res.json({ success: true });
});

// DELETE /api/sms/logs/:id - ADMIN: delete a single SMS log entry
router.delete('/logs/:id', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  const before = (db.smsLogs || []).length;
  db.smsLogs = (db.smsLogs || []).filter((l) => l.id !== req.params.id);
  if (db.smsLogs.length === before) {
    return res.status(404).json({ success: false, error: 'SMS log entry not found.' });
  }
  writeLocalData(db);
  res.json({ success: true, message: 'SMS log entry deleted.' });
});

// DELETE /api/sms/logs - ADMIN: clear all SMS logs
router.delete('/logs', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  const cleared = (db.smsLogs || []).length;
  db.smsLogs = [];
  logActivity(db, 'ADMIN_ACTION', `${req.user.name} cleared ${cleared} SMS log entries`);
  writeLocalData(db);
  res.json({ success: true, message: `Cleared ${cleared} SMS log entries.` });
});

// POST /api/sms/run-reminders - ADMIN / ORGANIZER: manually trigger automatic priority reminder cycle
router.post('/run-reminders', requireRole(['admin', 'organizer']), async (req, res) => {
  const { sentCount } = await runReminderCycle();
  res.json({ success: true, sentCount, message: `Auto-reminder cycle complete (${sentCount} reminder SMS sent).` });
});

module.exports = router;
