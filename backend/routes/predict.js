const express = require('express');
const axios = require('axios');
const router = express.Router();
const { readLocalData } = require('../db');
const { smsMixForEvent } = require('../utils/smsTier');

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
  const lift = { 0: 1, 1: 1.02, 2: 1.05, 3: 1.12 }[p.smsPriority] ?? 1.05;
  const predicted = Math.max(0, Math.min(p.venueCapacity, Math.round(reg * p.pastAttendanceRate * lift)));
  const util = Math.round((predicted / p.venueCapacity) * 1000) / 10;
  return {
    predictedAttendance: predicted,
    predictedTurnoutRate: Math.round((predicted / Math.max(reg, 1)) * 1000) / 1000,
    venueCapacity: p.venueCapacity,
    registrationCount: p.registrationCount,
    capacityUtilization: util,
    riskLevel: util > 95 ? 'HIGH_OVERCROWDING_RISK' : util < 40 ? 'LOW_TURNOUT_RISK' : 'OPTIMAL_ATTENDANCE',
    smsImpactBoostPct: { 0: 0, 1: 2.5, 2: 6.5, 3: 13.5 }[p.smsPriority] ?? 6.5,
    recommendation: 'Estimated with the built-in rule-based fallback because the ML service is offline.',
    isModelBased: false,
    algorithm: 'Rule-based fallback'
  };
}

// POST /api/predict
// Body: { eventId }  -> features are derived from the stored event (recommended)
//   or  { eventType, dayOfWeek, timeSlot, venueCapacity, registrationCount, pastAttendanceRate, smsPriority, ... }
function buildFeatures(body, res) {
  let features;

  if (body.eventId) {
    const event = (readLocalData().events || []).find((e) => e.id === body.eventId);
    if (!event) { res.status(404).json({ success: false, error: 'Event not found.' }); return null; }
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
    // SMS priority is chosen by the students themselves: feed the real split of their choices to the model.
    const mix = smsMixForEvent(readLocalData(), event.id);
    if (mix.none + mix.low + mix.medium + mix.high > 0) features.smsMix = mix;
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
    if (body.smsMix && typeof body.smsMix === 'object') {
      const m = {};
      ['none', 'low', 'medium', 'high'].forEach((k) => { m[k] = Math.max(0, Number(body.smsMix[k]) || 0); });
      if (m.none + m.low + m.medium + m.high > 0) features.smsMix = m;
    }
    if (body.weather) features.weather = String(body.weather);
    if (body.examPeriod !== undefined) features.examPeriod = body.examPeriod ? 1 : 0;
    if (body.leadDays !== undefined) features.leadDays = Math.min(60, Math.max(0, parseInt(body.leadDays, 10) || 0));
  }
  return features;
}

router.post('/', async (req, res) => {
  const features = buildFeatures(req.body || {}, res);
  if (!features) return;

  try {
    const { data } = await axios.post(`${ML_URL()}/predict`, features, { timeout: 8000 });
    res.json({ ...data, source: 'ml-service' });
  } catch (err) {
    console.warn('[predict] ML service unavailable, using fallback:', err.message);
    res.json({ ...heuristic(features), source: 'fallback', warning: 'ML service offline - showing a rule-based estimate.' });
  }
});

// POST /api/predict/simulate - what-if sweeps (SMS tier, registrations, time slot, weather, lead time, exams)
router.post('/simulate', async (req, res) => {
  const features = buildFeatures(req.body || {}, res);
  if (!features) return;
  try {
    const { data } = await axios.post(`${ML_URL()}/simulate`, features, { timeout: 20000 });
    res.json({ success: true, source: 'ml-service', features, ...data });
  } catch (err) {
    const row = (label, patch) => {
      const r = heuristic({ ...features, ...patch });
      return { label, predictedAttendance: r.predictedAttendance, predictedTurnoutRate: r.predictedTurnoutRate, capacityUtilization: r.capacityUtilization, riskLevel: r.riskLevel };
    };
    const cap = features.venueCapacity;
    res.json({
      success: true,
      source: 'fallback',
      warning: 'ML service offline - showing rule-based what-if estimates. Start it with: cd ml-service && python main.py',
      features,
      baseline: heuristic(features),
      sweeps: {
        studentSmsPriority: ['NONE', 'LOW', 'MEDIUM', 'HIGH'].map((n, i) => row(`All students ${n}`, { smsPriority: i, smsMix: undefined })),
        registrations: [0.25, 0.5, 0.75, 1].map((f) => row(`${f * 100}% of capacity`, { registrationCount: Math.max(1, Math.floor(cap * f)) }))
      }
    });
  }
});

// GET /api/predict/model - how the model was trained, evaluation metrics and what drives predictions
router.get('/model', async (req, res) => {
  try {
    const [info, importance, report] = await Promise.all([
      axios.get(`${ML_URL()}/model-info`, { timeout: 5000 }),
      axios.get(`${ML_URL()}/feature-importance?top=15`, { timeout: 5000 }),
      axios.get(`${ML_URL()}/training-report`, { timeout: 5000 })
    ]);
    res.json({ success: true, online: true, ...info.data, featureImportance: importance.data, trainingReport: report.data });
  } catch (err) {
    res.json({ success: true, online: false, error: err.message, howToStart: ['cd ml-service', 'pip install -r requirements.txt', 'python train_model.py', 'python main.py'] });
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
