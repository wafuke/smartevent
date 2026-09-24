import React, { useState } from 'react';
import { Plus, Users, Calendar, MessageSquare, Brain, Send, CheckCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function OrganizerDashboard({ events, setEvents, onOpenCreateModal, onOpenSmsModal, onPredictEvent }) {
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', 'Academic', 'Workshop', 'Seminar', 'Sports', 'Career Fair'];

  const filteredEvents = filterCategory === 'All' 
    ? events 
    : events.filter(e => e.category === filterCategory);

  const totalRegistrations = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/80 to-slate-900 border border-slate-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
              <Brain className="w-3.5 h-3.5" />
              <span>Machine Learning-Driven Event Management</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Strathmore Event Operations & Predictive Analytics
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">
              Organize campus events, forecast student turnout using trained machine learning models, and broadcast priority-classified SMS alerts via Africa's Talking API.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenCreateModal}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Active Events</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{events.length}</span>
            <span className="text-xs text-slate-400 ml-2">events registered</span>
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Student RSVPs</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{totalRegistrations}</span>
            <span className="text-xs text-emerald-400 ml-2">+14% this week</span>
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">ML Model Accuracy</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">91.2%</span>
            <span className="text-xs text-indigo-400 ml-2">Random Forest</span>
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Priority SMS Delivered</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">1,420</span>
            <span className="text-xs text-amber-400 ml-2">Africa's Talking API</span>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">University Events Directory</h3>
            <p className="text-xs text-slate-400">View real-time registrations and ML turnout projections</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {filteredEvents.map((evt) => {
            const utilPct = Math.round(((evt.registrationCount || 0) / evt.venueCapacity) * 100);
            const predictedAttendance = evt.predictedAttendance || Math.round((evt.registrationCount || 0) * (evt.pastAttendanceRate || 0.78));

            return (
              <div key={evt.id} className="glass-card p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {evt.category}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                          evt.smsPriority === 3 ? 'badge-priority-high' : evt.smsPriority === 2 ? 'badge-priority-medium' : 'badge-priority-low'
                        }`}>
                          {evt.smsPriority === 3 ? 'HIGH PRIORITY' : evt.smsPriority === 2 ? 'MEDIUM PRIORITY' : 'LOW PRIORITY'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-2 leading-snug">{evt.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{evt.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Date & Time</span>
                      <span className="font-semibold text-slate-200">{evt.date} • {evt.time || evt.timeSlot}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Venue & Cap</span>
                      <span className="font-semibold text-slate-200">{evt.venue} ({evt.venueCapacity})</span>
                    </div>
                  </div>
                </div>

                {/* Capacity & ML Prediction Progress Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      RSVPs: <strong className="text-white">{evt.registrationCount}</strong> / {evt.venueCapacity}
                    </span>
                    <span className="text-blue-400 font-semibold flex items-center space-x-1">
                      <Brain className="w-3.5 h-3.5 inline mr-1" />
                      Predicted Turnout: <span className="text-amber-400 font-bold ml-1">{predictedAttendance}</span> students
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(utilPct, 100)}%` }}
                      title="Registration level"
                    ></div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => onPredictEvent(evt)}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Run ML Predictor</span>
                  </button>
                  <button
                    onClick={() => onOpenSmsModal(evt)}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast SMS</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
