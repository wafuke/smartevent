const express = require('express');
const axios = require('axios');
const router = express.Router();
const { readLocalData } = require('../db');

const ML_URL = () => process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

function dayIndex(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? 2 : d.getUTCDay();
}

function leadDays(dateStr) {
  const diff = Math.round((new Date(`${dateStr}T00:00:00Z`) - new Date()) / 86400000);
  return Number.isFinite(diff) ? Math.min(Math.max(diff, 0), 60) : 5;
}

/** Heuristic used only when the ML microservice cannot be reached. */
function heuristic(p) {
  const reg = p.registrationCount > 0 ? p.registrationCount : Math.round(p.venueCapacity * 0.75);
  const lift = { 0: 1, 1: 1.02, 2: 1.05, 3: 1.12 }[p.smsPriority] || 1.05;
  const predicted = Math.max(0, Math.min(p.venueCapacity, Math.round(reg * p.pastAttendanceRate * lift)));
  const util = Math.round((predicted / p.venueCapacity) * 1000) / 10;
  return {
    predictedAttendance: predicted,
    predictedTurnoutRate: Math.round((predicted / Math.max(reg, 1)) * 1000) / 1000,
    venueCapacity: p.venueCapacity,
    registrationCount: p.registrationCount,
    capacityUtilization: util,
    riskLevel: util > 95 ? 'HIGH_OVERCROWDING_RISK' : util < 40 ? 'LOW_TURNOUT_RISK' : 'OPTIMAL_ATTENDANCE',
    smsImpactBoostPct: { 0: 0, 1: 2.5, 2: 6.5, 3: 13.5 }[p.smsPriority] || 6.5,
    recommendation: 'Estimated with the built-in rule-based fallback because the ML service is offline.',
    isModelBased: false,
    algorithm: 'Rule-based fallback'
  };
}

// POST /api/predict
// Body: { eventId }  -> features are derived from the stored event (recommended)
//   or  { eventType, dayOfWeek, timeSlot, venueCapacity, registrationCount, pastAttendanceRate, smsPriority, ... }
router.post('/', async (req, res) => {
  const body = req.body || {};
  let features;

  if (body.eventId) {
    const event = (readLocalData().events || []).find((e) => e.id === body.eventId);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });
    features = {
      eventType: event.category,
      dayOfWeek: dayIndex(event.date),
      timeSlot: event.timeSlot || 'Afternoon',
      venueCapacity: event.venueCapacity,
      registrationCount: event.registrationCount || 0,
      pastAttendanceRate: event.pastAttendanceRate ?? 0.75,
      smsPriority: event.smsPriority ?? 2,
      leadDays: leadDays(event.date)
    };
  } else {
    features = {
      eventType: String(body.eventType || 'Academic'),
      dayOfWeek: Number.isInteger(+body.dayOfWeek) ? +body.dayOfWeek : 2,
      timeSlot: String(body.timeSlot || 'Afternoon'),
      venueCapacity: Math.max(10, parseInt(body.venueCapacity, 10) || 150),
      registrationCount: Math.max(0, parseInt(body.registrationCount, 10) || 0),
      pastAttendanceRate: Math.min(1, Math.max(0, parseFloat(body.pastAttendanceRate ?? 0.75))),
      smsPriority: [0, 1, 2, 3].includes(+body.smsPriority) ? +body.smsPriority : 2
    };
    if (body.weather) features.weather = String(body.weather);
    if (body.examPeriod !== undefined) features.examPeriod = body.examPeriod ? 1 : 0;
    if (body.leadDays !== undefined) features.leadDays = Math.min(60, Math.max(0, parseInt(body.leadDays, 10) || 0));
  }

  try {
    const { data } = await axios.post(`${ML_URL()}/predict`, features, { timeout: 8000 });
    res.json({ ...data, source: 'ml-service' });
  } catch (err) {
    console.warn('[predict] ML service unavailable, using fallback:', err.message);
    res.json({ ...heuristic(features), source: 'fallback', warning: 'ML service offline - showing a rule-based estimate.' });
  }
});

// GET /api/predict/health - is the ML microservice reachable?
router.get('/health', async (req, res) => {
  try {
    const { data } = await axios.get(`${ML_URL()}/health`, { timeout: 3000 });
    res.json({ success: true, online: true, ...data });
  } catch (err) {
    res.json({ success: true, online: false, error: err.message });
  }
});

module.exports = router;
