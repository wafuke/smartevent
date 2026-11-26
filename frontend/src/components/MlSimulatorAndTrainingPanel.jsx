import React, { useState, useEffect } from 'react';
import { Brain, Play, BookOpen, BarChart3, CheckCircle2, Sparkles } from 'lucide-react';
import { predictApi } from '../services/api';
import { Badge } from './ui';

const DEFAULT_TRAINING_METADATA = {
  algorithm: 'L2 Logistic Regression (C = 0.01)',
  kaggleRows: 20000,
  leakageDropped: 'absence_reason (target leakage removed)',
  strathmoreEvents: 700,
  strathmoreStudents: 4000,
  trainEvents: 560,
  testEvents: 140,
  rocAuc: 0.7301,
  f1Score: 0.805,
  brierScore: 0.1975,
  headcountMae: 13.61,
  features: [
    { feature: 'past_attendance_rate', coefficient: 0.4974, effect: 'raises turnout', oddsMultiplierPerStdUnit: 1.644 },
    { feature: 'sms_priority_high (student-chosen)', coefficient: 0.2802, effect: 'raises turnout', oddsMultiplierPerStdUnit: 1.323 },
    { feature: 'weather_rainy', coefficient: -0.2793, effect: 'lowers turnout', oddsMultiplierPerStdUnit: 0.756 },
    { feature: 'event_category_Workshop', coefficient: 0.2642, effect: 'raises turnout', oddsMultiplierPerStdUnit: 1.302 },
    { feature: 'exam_period', coefficient: -0.2418, effect: 'lowers turnout', oddsMultiplierPerStdUnit: 0.785 },
    { feature: 'time_slot_Evening', coefficient: -0.2190, effect: 'lowers turnout', oddsMultiplierPerStdUnit: 0.803 },
    { feature: 'sms_priority_medium (student-chosen)', coefficient: 0.1640, effect: 'raises turnout', oddsMultiplierPerStdUnit: 1.178 },
    { feature: 'hostel_resident', coefficient: 0.1585, effect: 'raises turnout', oddsMultiplierPerStdUnit: 1.172 }
  ]
};

export default function MlSimulatorAndTrainingPanel({ events = [], showTrainingSection = false }) {
  // Compute historical averages from past similar events so predictions work even with NO manual input
  const historicalBaseline = React.useMemo(() => {
    const withRegs = (events || []).filter((e) => Number(e.venueCapacity) > 0 && Number(e.registrationCount) > 0);
    const pool = withRegs.length > 0 ? withRegs : events || [];
    if (!pool.length) {
      return { avgCapacity: 150, avgFillRatio: 0.76, avgPastRate: 0.78, avgSmsPriority: 2, sampleCount: 560 };
    }
    const avgCapacity = Math.round(pool.reduce((s, e) => s + (Number(e.venueCapacity) || 150), 0) / pool.length);
    const avgFillRatio =
      withRegs.length > 0
        ? Math.min(1, Math.max(0.25, withRegs.reduce((s, e) => s + Number(e.registrationCount) / Number(e.venueCapacity), 0) / withRegs.length))
        : 0.76;
    const avgPastRate =
      pool.reduce((s, e) => s + Number(e.pastAttendanceRate ?? 0.78), 0) / pool.length;
    const avgSmsPriority = Math.round(
      pool.reduce((s, e) => s + Number(e.smsPriority ?? 2), 0) / pool.length
    );
    return {
      avgCapacity,
      avgFillRatio,
      avgPastRate: Math.round(avgPastRate * 100) / 100,
      avgSmsPriority: Math.min(3, Math.max(1, avgSmsPriority)),
      sampleCount: pool.length
    };
  }, [events]);

  const [simForm, setSimForm] = useState({
    eventType: 'Workshop',
    timeSlot: 'Morning',
    dayOfWeek: 2,
    venueCapacity: '',
    registrationCount: '',
    pastAttendanceRate: 0.78,
    weather: 'sunny',
    examPeriod: 0,
    leadDays: 5
  });

  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [showTrainingDetails, setShowTrainingDetails] = useState(true);

  const buildPayload = (rawForm) => {
    const cap = Number(rawForm.venueCapacity) > 0 ? Number(rawForm.venueCapacity) : historicalBaseline.avgCapacity;
    const regs =
      Number(rawForm.registrationCount) > 0
        ? Number(rawForm.registrationCount)
        : Math.max(1, Math.round(cap * historicalBaseline.avgFillRatio));
    return {
      eventType: rawForm.eventType || 'Workshop',
      timeSlot: rawForm.timeSlot || 'Morning',
      dayOfWeek: rawForm.dayOfWeek ?? 2,
      venueCapacity: cap,
      registrationCount: regs,
      pastAttendanceRate: rawForm.pastAttendanceRate ?? historicalBaseline.avgPastRate,
      weather: rawForm.weather || 'sunny',
      examPeriod: Number(rawForm.examPeriod) || 0,
      leadDays: rawForm.leadDays ?? 5,
      smsPriority: historicalBaseline.avgSmsPriority
    };
  };

  const runSimulation = async (overrideForm) => {
    const payload = buildPayload(overrideForm || simForm);
    setSimLoading(true);
    try {
      const res = await predictApi.simulate(payload);
      setSimResult(res);
    } catch (e) {
      // ignore
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    runSimulation(simForm);
    predictApi
      .model()
      .then((res) => setModelInfo(res))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historicalBaseline.avgCapacity, historicalBaseline.avgFillRatio]);

  const loadFromEvent = (evtId) => {
    if (!evtId) {
      const reset = { ...simForm, venueCapacity: '', registrationCount: '' };
      setSimForm(reset);
      runSimulation(reset);
      return;
    }
    const ev = events.find((e) => e.id === evtId);
    if (!ev) return;
    const next = {
      ...simForm,
      eventType: ev.category || 'Workshop',
      timeSlot: ev.timeSlot || 'Morning',
      venueCapacity: Number(ev.venueCapacity) || '',
      registrationCount: Number(ev.registrationCount) > 0 ? Number(ev.registrationCount) : '',
      pastAttendanceRate: Number(ev.pastAttendanceRate ?? historicalBaseline.avgPastRate)
    };
    setSimForm(next);
    runSimulation(next);
  };

  const isUsingHistoricalFallback = !Number(simForm.venueCapacity) || !Number(simForm.registrationCount);
  const baseline = simResult?.baseline;
  const sweeps = simResult?.sweeps || {};
  const featuresList =
    modelInfo?.featureImportance?.features?.length > 0
      ? modelInfo.featureImportance.features
      : DEFAULT_TRAINING_METADATA.features;

  return (
    <div className="space-y-6">
      {/* SECTION 1: INTERACTIVE WHAT-IF ML SIMULATOR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#003366]" />
              <span>ML Event Attendance Forecast & What-If Simulator</span>
            </h3>
            <p className="text-xs text-slate-500">
              Automatically predicts turnout from past similar events when inputs are left blank, or customize parameters to test scenarios.
            </p>
          </div>
          {events.length > 0 && (
            <select
              onChange={(e) => loadFromEvent(e.target.value)}
              defaultValue=""
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
            >
              <option value="">
                Auto-predict from past similar events...
              </option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.registrationCount || 0}/{ev.venueCapacity})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
              Capacity (Optional)
            </label>
            <input
              type="number"
              min="1"
              max="5000"
              placeholder={`Auto (~${historicalBaseline.avgCapacity})`}
              value={simForm.venueCapacity}
              onChange={(e) => setSimForm({ ...simForm, venueCapacity: e.target.value })}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
              Registrations (Optional)
            </label>
            <input
              type="number"
              min="0"
              max="5000"
              placeholder={`Auto (~${Math.round((Number(simForm.venueCapacity) || historicalBaseline.avgCapacity) * historicalBaseline.avgFillRatio)})`}
              value={simForm.registrationCount}
              onChange={(e) => setSimForm({ ...simForm, registrationCount: e.target.value })}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Weather</label>
            <select
              value={simForm.weather}
              onChange={(e) => setSimForm({ ...simForm, weather: e.target.value })}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
            >
              {['sunny', 'cloudy', 'rainy', 'hot', 'cold'].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Exam Period</label>
            <select
              value={simForm.examPeriod}
              onChange={(e) => setSimForm({ ...simForm, examPeriod: Number(e.target.value) })}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold"
            >
              <option value={0}>Normal Term</option>
              <option value={1}>Exam Week</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => runSimulation(simForm)}
              disabled={simLoading}
              className="w-full py-2 px-3 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-extrabold flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{simLoading ? 'Running...' : 'Simulate'}</span>
            </button>
          </div>
        </div>

        {baseline && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="text-[10px] font-extrabold uppercase text-blue-800">Predicted Attendance</div>
              <div className="text-2xl font-black text-[#003366] mt-1">
                {baseline.predictedAttendance} <span className="text-xs font-bold text-slate-500">/ {baseline.venueCapacity}</span>
              </div>
              {baseline.predictionInterval && (
                <div className="text-[11px] text-blue-800 font-semibold mt-1">
                  80% Interval: {baseline.predictionInterval.low} – {baseline.predictionInterval.high} students
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <div className="text-[10px] font-extrabold uppercase text-purple-800">Show-Up Probability</div>
              <div className="text-2xl font-black text-purple-900 mt-1">
                {Math.round((baseline.predictedTurnoutRate || 0.78) * 100)}%
              </div>
              <div className="text-[11px] text-purple-700 font-semibold mt-1">
                Of {baseline.registrationCount} {isUsingHistoricalFallback ? 'expected' : 'registered'} students
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-[10px] font-extrabold uppercase text-amber-800">Past Events Baseline</div>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {Math.round(historicalBaseline.avgFillRatio * 100)}% Fill
              </div>
              <div className="text-[11px] text-amber-800 font-semibold mt-1">
                {isUsingHistoricalFallback
                  ? `Auto-estimated from ${historicalBaseline.sampleCount} past events`
                  : `Avg across ${historicalBaseline.sampleCount} similar events`}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-[10px] font-extrabold uppercase text-emerald-800">Venue Utilization & Risk</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {baseline.capacityUtilization}%
              </div>
              <div className="text-[11px] text-emerald-800 font-bold mt-1">
                {baseline.riskLevel}
              </div>
            </div>
          </div>
        )}

        {(sweeps.weather || sweeps.registrations) && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="text-xs font-extrabold text-slate-900">
              What-If Weather & Registration Scenarios
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(sweeps.weather || sweeps.registrations || []).map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">{row.label}</span>
                  <span className="font-extrabold text-purple-800">
                    {row.predictedAttendance} attendees ({row.capacityUtilization}% cap)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: HOW THE MODEL WAS TRAINED & FEATURE IMPORTANCE (Admin/Technical view only) */}
      {showTrainingSection && (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#003366]" />
              <span>How the ML Model Was Trained & Evaluated (Methodology & Coefficients)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Full provenance of the Scikit-Learn Logistic Regression pipeline, datasets, leakage audit, and feature weights.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTrainingDetails(!showTrainingDetails)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold self-start sm:self-center"
          >
            {showTrainingDetails ? 'Hide Training Details' : 'Show Training Details'}
          </button>
        </div>

        {showTrainingDetails && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <Badge tone="blue">Stage 1 – 3: Datasets & Leakage Audit</Badge>
                <div className="font-extrabold text-slate-900 pt-1">
                  20,000 Kaggle Rows + 700 Strathmore Events
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Audited <code>Attendance_Prediction.csv</code> (20,000 rows), detected and dropped <code>absence_reason</code> (post-event target leakage), extracted behavioral log-odds, and generated 150,645 Strathmore event registrations across 4,000 student profiles and 700 campus events.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <Badge tone="purple">Stage 4 – 7: Validation & Model Selection</Badge>
                <div className="font-extrabold text-slate-900 pt-1">
                  Chronological 80/20 Split + 5-Fold GroupKFold
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Trained on 560 past events and tested on 140 untouched future events. Compared Dummy Baseline, Decision Tree, Random Forest, Gradient Boosting, and Logistic Regression (`C=0.01` L2 regularization), selecting Logistic Regression for interpretability and probability calibration.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <Badge tone="green">Stage 8: Held-Out Test Performance</Badge>
                <div className="font-extrabold text-slate-900 pt-1">
                  ROC-AUC: 0.730 • F1: 0.805 • Event MAE: 13.61 Attendees
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Achieved ROC-AUC of 0.7301, F1-score of 0.805 (recall 0.959, precision 0.694), and Brier score of 0.1975 on the 140 future test events. Artifacts are saved in <code>ml-service/models/attendance_model.joblib</code> and <code>ml-service/reports/training_report.md</code>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#003366]" />
                  <span>Top Standardized Logistic Regression Feature Coefficients</span>
                </div>
                <div className="space-y-1.5">
                  {featuresList.slice(0, 8).map((f) => (
                    <div
                      key={f.feature}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200"
                    >
                      <span className="font-mono font-bold text-slate-800">{f.feature}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-extrabold ${
                            f.coefficient >= 0 ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {f.coefficient >= 0 ? `+${f.coefficient}` : f.coefficient}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ({f.oddsMultiplierPerStdUnit}x odds)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-3">
                <div className="font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Where to Inspect the Training Code & Run Simulations</span>
                </div>
                <div className="space-y-2 text-[11px] leading-relaxed text-slate-300">
                  <div>
                    <b className="text-white">1. Full Training Pipeline Code:</b>
                    <div className="font-mono text-amber-300 mt-0.5">
                      ml-service/train_model.py &rarr; ml-service/smartevent_ml/train.py
                    </div>
                  </div>
                  <div>
                    <b className="text-white">2. Detailed Markdown Training Report & Diagnostic Plots:</b>
                    <div className="font-mono text-amber-300 mt-0.5">
                      ml-service/reports/training_report.md &amp; ml-service/reports/figures/
                    </div>
                  </div>
                  <div>
                    <b className="text-white">3. Re-train or Inspect via Terminal / FastAPI Swagger UI:</b>
                    <pre className="bg-slate-950 p-2.5 rounded-xl font-mono text-[11px] text-emerald-300 mt-1 overflow-x-auto">
{`cd ml-service
python train_model.py
python main.py
# Open http://localhost:8000/docs (POST /predict, POST /simulate, GET /training-report)`}
                    </pre>
                  </div>
                  <div>
                    <b className="text-white">4. Google Colab Notebook (1-Click Run All):</b>
                    <div className="font-mono text-sky-300 break-all mt-0.5">
                      notebooks/SmartEvent_ML_Attendance_Prediction.ipynb
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
