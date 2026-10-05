import React, { useState } from 'react';
import { Plus, Users, Calendar, MessageSquare, Brain, Send, Clock, MapPin, Edit3, Trash2, UserCheck } from 'lucide-react';
import AttendeeRosterModal from './AttendeeRosterModal';
import EventEditModal from './EventEditModal';

export default function OrganizerDashboard({ events, setEvents, onOpenCreateModal, onOpenSmsModal, onPredictEvent, onUpdateEvent, onDeleteEvent }) {
  const [filterCategory, setFilterCategory] = useState('All');
  const [editingEvent, setEditingEvent] = useState(null);
  const [rosterEvent, setRosterEvent] = useState(null);

  const categories = ['All', 'Academic', 'Workshop', 'Seminar', 'Sports', 'Career Fair'];

  const filteredEvents = filterCategory === 'All' 
    ? events 
    : events.filter(e => e.category === filterCategory);

  const totalRegistrations = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0);

  const handleSaveEdit = (updatedEvt) => {
    if (onUpdateEvent) {
      onUpdateEvent(updatedEvt);
    } else {
      setEvents(events.map(e => e.id === updatedEvt.id ? updatedEvt : e));
    }
  };

  const handleDelete = (eventId, eventTitle) => {
    if (window.confirm(`Are you sure you want to cancel and delete "${eventTitle}"? Priority SMS notifications will be dispatched to all registered students.`)) {
      if (onDeleteEvent) {
        onDeleteEvent(eventId);
      } else {
        setEvents(events.filter(e => e.id !== eventId));
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-blue-950 tracking-tight">
            Event Management Dashboard
          </h2>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Strathmore University • Real-time Attendance Prediction & Priority SMS Center
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs shadow-md transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Metrics Row - Clean White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="clean-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Events</span>
            <Calendar className="w-4 h-4 text-blue-800" />
          </div>
          <div className="text-3xl font-extrabold text-blue-950">{events.length}</div>
          <span className="text-xs text-slate-500 mt-1 block font-medium">Active on platform</span>
        </div>

        <div className="clean-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Student RSVPs</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-950">{totalRegistrations}</div>
          <span className="text-xs text-emerald-600 mt-1 block font-semibold">Registered students</span>
        </div>

        <div className="clean-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">ML Accuracy</span>
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-950">91.2%</div>
          <span className="text-xs text-indigo-700 mt-1 block font-semibold">Random Forest Model</span>
        </div>

        <div className="clean-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Priority SMS Sent</span>
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-950">1,420</div>
          <span className="text-xs text-amber-700 mt-1 block font-semibold">Africa's Talking Gateway</span>
        </div>

      </div>

      {/* Events Section */}
      <div className="space-y-6">
        
        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-blue-950">Campus Events Directory</h3>

          <div className="flex items-center space-x-1.5 bg-slate-200/60 p-1 rounded-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterCategory === cat
                    ? 'bg-[#003366] text-white shadow-sm'
                    : 'text-slate-700 hover:text-blue-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredEvents.map((evt) => {
            const utilPct = Math.round(((evt.registrationCount || 0) / evt.venueCapacity) * 100);
            const predictedAttendance = evt.predictedAttendance || Math.round((evt.registrationCount || 0) * (evt.pastAttendanceRate || 0.78));

            return (
              <div key={evt.id} className="clean-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  
                  {/* Category & Priority Badge & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                        {evt.category}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                        evt.smsPriority === 3 ? 'badge-priority-high' : evt.smsPriority === 2 ? 'badge-priority-medium' : 'badge-priority-low'
                      }`}>
                        {evt.smsPriority === 3 ? 'High Priority' : evt.smsPriority === 2 ? 'Medium Priority' : 'Low Priority'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingEvent(evt)}
                        title="Edit Event Details"
                        className="p-1.5 text-slate-400 hover:text-[#003366] hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(evt.id, evt.title)}
                        title="Cancel/Delete Event"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-base font-bold text-blue-950 leading-snug">{evt.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{evt.description}</p>
                  </div>

                  {/* Meta Details */}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-700 pt-1">
                    <span className="flex items-center space-x-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-blue-700" />
                      <span>{evt.date} • {evt.time || evt.timeSlot}</span>
                    </span>
                    <span className="flex items-center space-x-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{evt.venue}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Turnout Stats */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      RSVPs: <strong className="text-blue-950">{evt.registrationCount}</strong> / {evt.venueCapacity} capacity
                    </span>
                    <span className="text-blue-900 font-bold flex items-center space-x-1">
                      <Brain className="w-3.5 h-3.5 mr-1" />
                      Predicted Turnout: <strong className="text-blue-700 ml-1">{predictedAttendance}</strong>
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(utilPct, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => setRosterEvent(evt)}
                    className="py-2 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center space-x-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>View Roster</span>
                  </button>

                  <button
                    onClick={() => onPredictEvent(evt)}
                    className="py-2 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition-all flex items-center justify-center space-x-1"
                  >
                    <Brain className="w-3.5 h-3.5 text-blue-700" />
                    <span>ML Turnout</span>
                  </button>

                  <button
                    onClick={() => onOpenSmsModal(evt)}
                    className="py-2 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center justify-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-700" />
                    <span>Send SMS</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Roster Modal */}
      <AttendeeRosterModal
        isOpen={Boolean(rosterEvent)}
        onClose={() => setRosterEvent(null)}
        event={rosterEvent}
      />

      {/* Edit Event Modal */}
      <EventEditModal
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
        onSaveEvent={handleSaveEdit}
      />

    </div>
  );
}

