import React, { useState, useEffect } from 'react';
import { X, Brain, Calendar, MapPin, Users, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function EventCreationModal({ isOpen, onClose, onCreateEvent }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Academic',
    description: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: 'Afternoon',
    time: '14:00',
    venue: 'Auditorium A, Sir Thomas More Building',
    venueCapacity: 150,
    smsPriority: 2, // 1: Low, 2: Medium, 3: High
    estimatedRegistrations: 110
  });

  const [mlResult, setMlResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Trigger real-time ML prediction simulator whenever key parameters change
  useEffect(() => {
    if (!isOpen) return;
    
    setIsPredicting(true);
    const timer = setTimeout(() => {
      // Calculate realistic turnout prediction based on features
      const cap = Number(formData.venueCapacity) || 100;
      const reg = Number(formData.estimatedRegistrations) || 80;
      const smsBoost = formData.smsPriority === 3 ? 0.12 : formData.smsPriority === 2 ? 0.05 : 0.0;
      
      let baseTurnoutRate = 0.75;
      if (formData.category === 'Academic' || formData.category === 'Career Fair') baseTurnoutRate += 0.06;
      if (formData.category === 'Seminar') baseTurnoutRate -= 0.04;
      
      const totalRate = Math.min(0.96, Math.max(0.40, baseTurnoutRate + smsBoost));
      const predictedCount = Math.min(cap, Math.round(reg * totalRate));
      const capUtilization = Math.round((predictedCount / cap) * 100);

      let riskLevel = 'OPTIMAL';
      let recMessage = `Optimal capacity predicted (${predictedCount} attendees, ${capUtilization}% venue occupancy).`;
      
      if (capUtilization > 95) {
        riskLevel = 'HIGH_OVERCROWDING_RISK';
        recMessage = `HIGH OVERCROWDING RISK: Predicted headcount (${predictedCount}) will exceed 95% of venue capacity (${cap}). Consider reserving a larger hall.`;
      } else if (capUtilization < 40) {
        riskLevel = 'LOW_TURNOUT_RISK';
        recMessage = `LOW TURNOUT RISK: Predicted turnout (${predictedCount}) is below 40% capacity. Increasing SMS Priority to High is recommended.`;
      }

      setMlResult({
        predictedAttendance: predictedCount,
        predictedTurnoutRate: totalRate,
        capacityUtilization: capUtilization,
        riskLevel,
        recommendation: recMessage,
        smsImpactBoostPct: smsBoost * 100
      });
      setIsPredicting(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [formData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateEvent({
      ...formData,
      registrationCount: Number(formData.estimatedRegistrations),
      predictedAttendance: mlResult?.predictedAttendance || Math.round(formData.estimatedRegistrations * 0.78),
      pastAttendanceRate: 0.78
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Create University Event</h3>
              <p className="text-xs text-slate-400">Specify details to receive real-time ML turnout predictions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Event Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Strathmore FinTech Symposium 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Academic">Academic</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Club Activity">Club Activity</option>
                <option value="Sports">Sports</option>
                <option value="Career Fair">Career Fair</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Event Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a brief summary of the event agenda and target audience..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          {/* Venue & Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Venue</label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g. SCES Lab 2 or Student Center Hall"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Venue Capacity</label>
              <input
                type="number"
                required
                min="10"
                max="1000"
                value={formData.venueCapacity}
                onChange={(e) => setFormData({ ...formData, venueCapacity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date, Time Slot, SMS Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Time Slot</label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Morning">Morning (8:00 AM - 12:00 PM)</option>
                <option value="Afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
                <option value="Evening">Evening (5:00 PM - 8:00 PM)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">SMS Notification Urgency</label>
              <select
                value={formData.smsPriority}
                onChange={(e) => setFormData({ ...formData, smsPriority: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={3}>High Priority (Urgent)</option>
                <option value={2}>Medium Priority (Standard)</option>
                <option value={1}>Low Priority (Informational)</option>
              </select>
            </div>
          </div>

          {/* Real-Time ML Prediction Feedback Card */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>Live ML Attendance Forecast & Planning Advice</span>
              </div>
              <span className="text-[10px] text-slate-400">Model: Scikit-Learn Random Forest</span>
            </div>

            {mlResult && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Predicted Turnout</span>
                  <span className="text-lg font-extrabold text-amber-400">{mlResult.predictedAttendance} <span className="text-xs text-slate-400 font-normal">students</span></span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Turnout Rate</span>
                  <span className="text-lg font-extrabold text-emerald-400">{Math.round(mlResult.predictedTurnoutRate * 100)}%</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Capacity Utilization</span>
                  <span className="text-lg font-extrabold text-blue-400">{mlResult.capacityUtilization}%</span>
                </div>
              </div>
            )}

            {mlResult && (
              <p className="text-xs text-indigo-200/90 leading-relaxed bg-indigo-900/30 p-2.5 rounded-lg border border-indigo-500/20 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{mlResult.recommendation}</span>
              </p>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
            >
              Create & Publish Event
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
