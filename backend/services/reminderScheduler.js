/**
 * Automatic Priority-Based SMS Reminder Scheduler
 *
 * Checks upcoming registered events every 60 seconds and automatically sends
 * Africa's Talking SMS reminders based on each student's SMS Priority Tier
 * or custom SMS Frequency setting:
 *   - HIGH (3)   : every 60 minutes when event is within 24 hours
 *   - MEDIUM (2) : every 180 minutes (3 hours) when event is within 12 hours
 *   - LOW (1)    : once within 24 hours
 *   - NONE (0)   : no automatic SMS reminders
 *   - Custom     : student-selected interval (30, 60, 180, 360, or 1440 mins)
 */
const { readLocalData, writeLocalData, addNotification } = require('../db');
const { normalizeKenyanPhone } = require('../utils/phone');
const { normalizeTier, tierLabel } = require('../utils/smsTier');
const sms = require('./sms');

const VALID_FREQUENCIES = [30, 60, 180, 360, 1440];

function parseEventStartMs(event) {
  if (!event || !event.date) return NaN;
  const timeMatch = String(event.time || '09:00').match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  let hours = 9;
  let minutes = 0;
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const mer = (timeMatch[3] || '').toUpperCase();
    if (mer === 'PM' && hours < 12) hours += 12;
    if (mer === 'AM' && hours === 12) hours = 0;
  }
  const hh = String(Math.min(23, Math.max(0, hours))).padStart(2, '0');
  const mm = String(Math.min(59, Math.max(0, minutes))).padStart(2, '0');
  return new Date(`${event.date}T${hh}:${mm}:00`).getTime();
}

function getEffectiveFrequencyMinutes(reg, user) {
  const tier = normalizeTier(reg?.smsPriority, normalizeTier(user?.smsPriority, 2));
  if (tier === 0 || user?.smsOptOut) return null;

  const custom = Number(reg?.smsFrequencyMinutes ?? user?.smsFrequencyMinutes);
  if (VALID_FREQUENCIES.includes(custom)) return custom;

  if (tier === 3) return 60; // HIGH: every 1 hour
  if (tier === 2) return 180; // MEDIUM: every 3 hours
  return 1440; // LOW: once per 24 hours
}

function formatTimeUntil(hoursUntil) {
  if (hoursUntil <= 0) return 'starting now';
  if (hoursUntil < 1) {
    const mins = Math.max(1, Math.round(hoursUntil * 60));
    return `in ${mins} min${mins === 1 ? '' : 's'}`;
  }
  const hrs = Math.round(hoursUntil * 10) / 10;
  return `in ${hrs} hr${hrs === 1 ? '' : 's'}`;
}

async function runReminderCycle(nowMs = Date.now()) {
  const db = readLocalData();
  const eventsById = new Map((db.events || []).map((e) => [e.id, e]));
  const usersById = new Map((db.users || []).map((u) => [u.id, u]));

  let sentCount = 0;
  let modified = false;

  for (const reg of db.registrations || []) {
    if (String(reg.status || 'Confirmed').toLowerCase() === 'cancelled') continue;
    const event = eventsById.get(reg.eventId);
    if (!event || event.status === 'Cancelled' || event.status === 'Completed') continue;

    const user = usersById.get(reg.userId);
    const phone = normalizeKenyanPhone(reg.phone || user?.phone);
    if (!phone) continue;

    const freqMinutes = getEffectiveFrequencyMinutes(reg, user);
    if (!freqMinutes) continue;

    const startMs = parseEventStartMs(event);
    if (Number.isNaN(startMs)) continue;

    const hoursUntil = (startMs - nowMs) / 3600000;
    const tier = normalizeTier(reg.smsPriority, normalizeTier(user?.smsPriority, 2));
    const maxWindowHours = tier === 2 && !reg.smsFrequencyMinutes ? 12 : 24;

    if (hoursUntil > maxWindowHours || hoursUntil < -0.25) continue;

    const lastSentMs = reg.lastAutoReminderAt ? Date.parse(reg.lastAutoReminderAt) : 0;
    if (lastSentMs && nowMs - lastSentMs < freqMinutes * 60 * 1000) continue;

    const priorityName = tierLabel(tier);
    const whenText = formatTimeUntil(hoursUntil);
    const message = `[SmartEvent ${priorityName} REMINDER] ${event.title} is ${whenText} (${event.date} ${event.time || ''}) at ${event.venue}.`;

    try {
      const { mode, results } = await sms.sendBulk([phone], message);
      const r = results && results[0];
      const status = (r && r.status) || 'SENT';

      db.smsLogs = db.smsLogs || [];
      db.smsLogs.unshift({
        id: `sms-auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        eventId: event.id,
        eventTitle: event.title,
        kind: 'AUTO_REMINDER',
        kindLabel: 'Automatic Reminder',
        priority: priorityName,
        minTier: tier,
        message,
        recipient: phone,
        recipientsSample: [phone],
        recipientCount: 1,
        sentCount: status === 'FAILED' ? 0 : 1,
        failedCount: status === 'FAILED' ? 1 : 0,
        status: status === 'FAILED' ? 'FAILED' : mode === 'SIMULATION' ? 'SIMULATED' : 'SENT',
        mode,
        messageId: r?.messageId || null,
        cost: r?.cost || null,
        userId: reg.userId,
        sentBy: 'SmartEvent Auto-Scheduler',
        sentAt: new Date(nowMs).toISOString()
      });

      addNotification(db, {
        userId: reg.userId,
        title: `Upcoming Event Reminder: ${event.title}`,
        message,
        type: 'SMS_REMINDER',
        priority: priorityName
      });

      reg.lastAutoReminderAt = new Date(nowMs).toISOString();
      modified = true;
      if (status !== 'FAILED') sentCount += 1;
    } catch (err) {
      console.error('[reminderScheduler] Failed sending reminder:', err.message);
    }
  }

  if (modified) {
    db.smsLogs = (db.smsLogs || []).slice(0, 500);
    writeLocalData(db);
  }
  return { sentCount };
}

let timer = null;
function startReminderScheduler() {
  if (process.env.NODE_ENV === 'test' || timer) return;
  setTimeout(() => {
    runReminderCycle().catch((err) => console.error('[reminderScheduler]', err.message));
  }, 8000);
  timer = setInterval(() => {
    runReminderCycle().catch((err) => console.error('[reminderScheduler]', err.message));
  }, 60 * 1000);
  if (timer.unref) timer.unref();
}

module.exports = {
  VALID_FREQUENCIES,
  parseEventStartMs,
  getEffectiveFrequencyMinutes,
  runReminderCycle,
  startReminderScheduler
};
