/**
 * Student-controlled SMS priority.
 *
 * Every student chooses how much SMS they want for each event they register for.
 * Organisers never set a priority; they only choose WHAT they are sending
 * (an urgent change, a reminder or a general announcement) and the platform
 * delivers it to each student according to that student's own tier:
 *
 *   tier 0  NONE    in-app notifications only, no SMS
 *   tier 1  LOW     SMS for urgent changes only (cancellation, venue/time change)
 *   tier 2  MEDIUM  urgent changes + event reminders
 *   tier 3  HIGH    urgent changes + reminders + general announcements
 */
const TIER_LABEL = { 0: 'NONE', 1: 'LOW', 2: 'MEDIUM', 3: 'HIGH' };
const LABEL_TIER = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3 };

// Minimum student tier required to receive each kind of organiser message by SMS.
const KIND_MIN_TIER = { URGENT: 1, REMINDER: 2, ANNOUNCEMENT: 3 };
const DEFAULT_TIER = 2;

/** Accepts 0-3 or NONE/LOW/MEDIUM/HIGH; returns a tier number or the fallback. */
function normalizeTier(value, fallback = DEFAULT_TIER) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string' && LABEL_TIER[value.trim().toUpperCase()] !== undefined) {
    return LABEL_TIER[value.trim().toUpperCase()];
  }
  const n = parseInt(value, 10);
  return [0, 1, 2, 3].includes(n) ? n : fallback;
}

const tierLabel = (tier) => TIER_LABEL[normalizeTier(tier)] || 'MEDIUM';

/** Does a student on this tier receive this kind of message by SMS? */
function tierReceivesKind(tier, kind) {
  return normalizeTier(tier) >= (KIND_MIN_TIER[kind] || KIND_MIN_TIER.ANNOUNCEMENT);
}

/** Count how the registered students of an event split across the four tiers. */
function smsMixForEvent(db, eventId) {
  const mix = { none: 0, low: 0, medium: 0, high: 0 };
  (db.registrations || [])
    .filter((r) => r.eventId === eventId)
    .forEach((r) => {
      mix[['none', 'low', 'medium', 'high'][normalizeTier(r.smsPriority)]] += 1;
    });
  return mix;
}

/**
 * Re-derive the event-level SMS summary from the students' own choices.
 * event.smsMix is the exact split; event.smsPriority is the audience average
 * (0-3) which feeds the ML turnout model.
 */
function recomputeEventSms(db, event) {
  if (!event) return;
  const mix = smsMixForEvent(db, event.id);
  const total = mix.none + mix.low + mix.medium + mix.high;
  event.smsMix = mix;
  if (total > 0) {
    const avg = (mix.low * 1 + mix.medium * 2 + mix.high * 3) / total;
    event.smsPriority = Math.min(3, Math.max(0, Math.round(avg)));
  } else if (event.smsPriority === undefined) {
    event.smsPriority = DEFAULT_TIER;
  }
}

module.exports = {
  TIER_LABEL,
  KIND_MIN_TIER,
  DEFAULT_TIER,
  normalizeTier,
  tierLabel,
  tierReceivesKind,
  smsMixForEvent,
  recomputeEventSms
};
