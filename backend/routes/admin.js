const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { readLocalData } = require('../db');
const { requireRole } = require('../middleware/auth');

function sanitize(u) {
  const { password, passwordHash, ...safe } = u;
  return { ...safe, role: String(safe.role || 'student').toLowerCase() };
}

/** Real model metrics from the trained artifact's metadata (falls back gracefully). */
function loadModelInfo() {
  try {
    const file = path.join(__dirname, '..', '..', 'ml-service', 'models', 'model_metadata.json');
    const meta = JSON.parse(fs.readFileSync(file, 'utf8'));
    const t = (meta.test_metrics && meta.test_metrics.threshold_0_5) || {};
    const ev = (meta.test_metrics && meta.test_metrics.event_level) || {};
    return {
      algorithm: meta.algorithm,
      version: meta.version,
      trainedAt: meta.trained_at,
      rocAuc: t.roc_auc,
      accuracy: t.accuracy,
      f1: t.f1,
      eventMae: ev.mae_attendees,
      eventMapePct: ev.mape_pct,
      testEvents: ev.events
    };
  } catch (e) {
    return null;
  }
}

function buildSummary(db) {
  const users = db.users || [];
  const events = db.events || [];
  const regs = db.registrations || [];
  const live = events.filter((e) => e.status !== 'Cancelled');
  const capacity = live.reduce((s, e) => s + (e.venueCapacity || 0), 0);
  const rsvps = live.reduce((s, e) => s + (e.registrationCount || 0), 0);

  const byCategory = {};
  live.forEach((e) => {
    const c = (byCategory[e.category] = byCategory[e.category] || { name: e.category, events: 0, registrations: 0, capacity: 0 });
    c.events += 1;
    c.registrations += e.registrationCount || 0;
    c.capacity += e.venueCapacity || 0;
  });

  const logs = db.smsLogs || [];
  const sms = {
    totalSent: logs.length,
    highPriority: logs.filter((l) => String(l.priority).toUpperCase() === 'HIGH').length,
    mediumPriority: logs.filter((l) => String(l.priority).toUpperCase() === 'MEDIUM').length,
    lowPriority: logs.filter((l) => String(l.priority).toUpperCase() === 'LOW').length,
    delivered: logs.filter((l) => /DELIVERED/i.test(l.status || '')).length,
    failed: logs.filter((l) => /FAIL|REJECT/i.test(l.status || '')).length
  };
  sms.deliveryRate = logs.length ? Math.round((sms.delivered / logs.length) * 1000) / 10 : 0;

  return {
    totals: {
      users: users.length,
      students: users.filter((u) => u.role === 'student').length,
      organizers: users.filter((u) => u.role === 'organizer').length,
      admins: users.filter((u) => u.role === 'admin').length,
      suspended: users.filter((u) => String(u.status) === 'Suspended').length,
      events: events.length,
      upcomingEvents: events.filter((e) => e.status === 'Upcoming').length,
      registrations: regs.length,
      categories: (db.categories || []).length,
      venues: (db.venues || []).length
    },
    capacityUtilizationPct: capacity ? Math.round((rsvps / capacity) * 100) : 0,
    categoryBreakdown: Object.values(byCategory).sort((a, b) => b.registrations - a.registrations),
    topEvents: [...live]
      .sort((a, b) => (b.registrationCount || 0) - (a.registrationCount || 0))
      .slice(0, 5)
      .map((e) => ({ id: e.id, title: e.title, registrations: e.registrationCount, capacity: e.venueCapacity, predictedAttendance: e.predictedAttendance })),
    sms,
    model: loadModelInfo()
  };
}

// GET /api/admin/overview - ADMIN: full system snapshot for the admin console
router.get('/overview', requireRole(['admin']), (req, res) => {
  const db = readLocalData();
  const summary = buildSummary(db);
  const t = summary.totals;

  res.json({
    success: true,
    data: {
      // flat metrics (kept for existing clients)
      metrics: {
        totalUsers: t.users,
        students: t.students,
        organizers: t.organizers,
        admins: t.admins,
        totalEvents: t.events,
        totalRegistrations: t.registrations,
        totalCategories: t.categories,
        totalVenues: t.venues,
        prioritySmsSent: summary.sms.totalSent,
        capacityUtilization: `${summary.capacityUtilizationPct}%`,
        mlAlgorithm: summary.model ? `${summary.model.algorithm} (ROC-AUC ${summary.model.rocAuc})` : 'Model metadata not found',
        mlAccuracy: summary.model ? `${Math.round(summary.model.accuracy * 1000) / 10}% student-level / ${summary.model.eventMae} MAE event-level` : 'n/a'
      },
      summary,
      users: (db.users || []).map(sanitize),
      events: db.events || [],
      registrations: db.registrations || [],
      categories: db.categories || [],
      tables: {
        admin_profiles: db.admin_profiles || [],
        organizer_profiles: db.organizer_profiles || [],
        student_profiles: db.student_profiles || [],
        venues: db.venues || [],
        smsLogs: db.smsLogs || []
      },
      recentActivity: (db.activity || []).slice(0, 15)
    }
  });
});

// GET /api/admin/activity - ADMIN: activity feed
router.get('/activity', requireRole(['admin']), (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  res.json({ success: true, data: (readLocalData().activity || []).slice(0, limit) });
});

module.exports = router;
module.exports.buildSummary = buildSummary;
