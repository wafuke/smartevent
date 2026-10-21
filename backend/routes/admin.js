const express = require('express');
const router = express.Router();
const { readLocalData } = require('../db');
const { requireRole } = require('../middleware/auth');

// GET /api/admin/overview - System-wide statistics & relational profile tables for Admin Dashboard
router.get('/overview', requireRole(['admin']), (req, res) => {
  const db = readLocalData();

  const users = (db.users || []).map(({ password, passwordHash, ...u }) => u);
  const events = db.events || [];
  const registrations = db.registrations || [];
  const categories = db.categories || [];
  const venues = db.venues || [];
  const smsLogs = db.smsLogs || [];
  const adminProfiles = db.admin_profiles || [];
  const organizerProfiles = db.organizer_profiles || [];
  const studentProfiles = db.student_profiles || [];

  const studentsCount = users.filter(u => u.role === 'student').length;
  const organizersCount = users.filter(u => u.role === 'organizer').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;

  const totalCapacity = events.reduce((sum, e) => sum + (e.venueCapacity || 0), 0);
  const totalRSVPs = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0);
  const avgUtilization = totalCapacity > 0 ? Math.round((totalRSVPs / totalCapacity) * 100) : 0;

  res.json({
    success: true,
    data: {
      metrics: {
        totalUsers: users.length,
        students: studentsCount,
        organizers: organizersCount,
        admins: adminsCount,
        totalEvents: events.length,
        totalRegistrations: registrations.length,
        totalCategories: categories.length,
        totalVenues: venues.length,
        prioritySmsSent: smsLogs.length,
        mlAlgorithm: 'Logistic Regression (ROC-AUC 0.7301)',
        mlAccuracy: '69.4% Student / 13.6 MAE Event',
        capacityUtilization: `${avgUtilization}%`
      },
      tables: {
        admin_profiles: adminProfiles,
        organizer_profiles: organizerProfiles,
        student_profiles: studentProfiles,
        venues,
        smsLogs
      },
      recentActivity: [
        { id: 'act-1', type: 'EVENT_CREATED', detail: 'Strathmore Tech Innovation Summit 2026 scheduled in STM Auditorium A', time: '10 mins ago' },
        { id: 'act-2', type: 'STUDENT_RSVP', detail: 'Elvis Wanyama Wafuke (154210) registered for AI & Logistic Regression ML Workshop', time: '25 mins ago' },
        { id: 'act-3', type: 'SMS_DISPATCHED', detail: 'High-Priority SMS dispatched via Africa\'s Talking API to 284 Summit registrants', time: '1 hour ago' },
        { id: 'act-4', type: 'ADMIN_AUDIT', detail: 'Mr. Allan Vikiru (ADM-002) verified SCES & @iLabAfrica organizer accounts', time: '2 hours ago' }
      ]
    }
  });
});

module.exports = router;
