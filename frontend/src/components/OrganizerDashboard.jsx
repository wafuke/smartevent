import React, { useState } from 'react';
import { Plus, Users, Calendar, MessageSquare, Brain, Send, ArrowRight, Sparkles, MapPin, Clock } from 'lucide-react';

export default function OrganizerDashboard({ events, setEvents, onOpenCreateModal, onOpenSmsModal, onPredictEvent }) {
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', 'Academic', 'Workshop', 'Seminar', 'Sports', 'Career Fair'];

  const filteredEvents = filterCategory === 'All' 
    ? events 
    : events.filter(e => e.category === filterCategory);

  const totalRegistrations = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Clean, Spacious Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Event Management & Attendance Intelligence
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Strathmore University Event Portal • Real-time ML Attendance Predictions & Priority SMS Broadcasts
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Metrics Row - Clean, Uncluttered Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Events</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{events.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Scheduled on campus</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Student RSVPs</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalRegistrations}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block font-medium">Registered participants</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ML Accuracy Rate</span>
            <Brain className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-300">91.2%</div>
          <span className="text-[11px] text-indigo-400 mt-1 block font-medium">Random Forest Model</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Priority SMS Sent</span>
            <MessageSquare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300">1,420</div>
          <span className="text-[11px] text-amber-400 mt-1 block font-medium">Africa's Talking API</span>
        </div>

      </div>

      {/* Main Events Feed Section */}
      <div className="space-y-6">
        
        {/* Category Filters Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">Upcoming Events</h3>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800/80">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Event Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredEvents.map((evt) => {
            const utilPct = Math.round(((evt.registrationCount || 0) / evt.venueCapacity) * 100);
            const predictedAttendance = evt.predictedAttendance || Math.round((evt.registrationCount || 0) * (evt.pastAttendanceRate || 0.78));

            return (
              <div 
                key={evt.id} 
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Category & Priority Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {evt.category}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      evt.smsPriority === 3 ? 'badge-priority-high' : evt.smsPriority === 2 ? 'badge-priority-medium' : 'badge-priority-low'
                    }`}>
                      {evt.smsPriority === 3 ? 'High Priority' : evt.smsPriority === 2 ? 'Medium Priority' : 'Low Priority'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight">{evt.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{evt.description}</p>
                  </div>

                  {/* Meta Pills */}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-1">
                    <span className="flex items-center space-x-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>{evt.date} • {evt.time || evt.timeSlot}</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{evt.venue}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Turnout Stats */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      RSVPs: <strong className="text-white">{evt.registrationCount}</strong> / {evt.venueCapacity} cap
                    </span>
                    <span className="text-indigo-400 font-semibold flex items-center space-x-1">
                      <Brain className="w-3.5 h-3.5 mr-1" />
                      Predicted Turnout: <strong className="text-amber-400 ml-1">{predictedAttendance}</strong>
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(utilPct, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Clean Action Buttons */}
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => onPredictEvent(evt)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Run Predictor</span>
                  </button>

                  <button
                    onClick={() => onOpenSmsModal(evt)}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
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
