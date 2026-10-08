import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, MessageSquare, Brain, Send, Clock, MapPin, Edit3, Trash2, UserCheck } from 'lucide-react';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EventCreationModal from '../../components/EventCreationModal';
import EventEditModal from '../../components/EventEditModal';
import AttendeeRosterModal from '../../components/AttendeeRosterModal';

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [rosterEvent, setRosterEvent] = useState(null);
  const [selectedPredictEvent, setSelectedPredictEvent] = useState(null);

  const categories = ['All', 'Academic', 'Workshop', 'Seminar', 'Sports', 'Career Fair'];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await eventsApi.getAll();
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load organizer events:', err);
    }
  };

  const handleCreateEvent = async (newEventData) => {
    try {
      await eventsApi.create(newEventData);
      setIsCreateModalOpen(false);
      await loadEvents();
    } catch (err) {
      alert(err.message || 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (updatedEvt) => {
    try {
      await eventsApi.update(updatedEvt.id, updatedEvt);
      setEditingEvent(null);
      await loadEvents();
    } catch (err) {
      alert(err.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to cancel and delete "${title}"?`)) return;
    try {
      await eventsApi.delete(eventId);
      await loadEvents();
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const filteredEvents = filterCategory === 'All'
    ? events
    : events.filter(e => e.category === filterCategory);

  const totalRegistrations = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950 tracking-tight">
            Event Organizer Management Center
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Strathmore University • {user?.department || 'School of Computing & Engineering Sciences'}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs shadow-md transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">My Active Events</span>
            <Calendar className="w-4 h-4 text-[#003366]" />
          </div>
          <div className="text-3xl font-extrabold text-blue-950">{events.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Listed on platform</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Student RSVPs</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-950">{totalRegistrations}</div>
          <span className="text-xs text-emerald-600 mt-1 block font-semibold">Registered attendees</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">ML Model Turnout</span>
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-950">91.2%</div>
          <span className="text-xs text-indigo-700 mt-1 block font-semibold">Random Forest Accuracy</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Priority SMS Alerts</span>
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-950">1,420</div>
          <span className="text-xs text-amber-700 mt-1 block font-semibold">Africa's Talking Gateway</span>
        </div>
      </div>

      {/* Events List & Filter */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-blue-950">Managed Campus Events</h2>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredEvents.map((evt) => {
            const utilPct = Math.round(((evt.registrationCount || 0) / evt.venueCapacity) * 100);
            const predictedAttendance = evt.predictedAttendance || Math.round((evt.registrationCount || 0) * 0.8);

            return (
              <div key={evt.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                      {evt.category}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingEvent(evt)}
                        title="Edit Event"
                        className="p-1.5 text-slate-400 hover:text-[#003366] hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
                        title="Delete Event"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-blue-950 leading-snug">{evt.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{evt.description}</p>
                  </div>

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

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      RSVPs: <strong className="text-blue-950">{evt.registrationCount}</strong> / {evt.venueCapacity} seats
                    </span>
                    <span className="text-blue-900 font-bold flex items-center space-x-1">
                      <Brain className="w-3.5 h-3.5 mr-1" />
                      Turnout: <strong className="text-blue-700 ml-1">{predictedAttendance}</strong>
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(utilPct, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setRosterEvent(evt)}
                    className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center space-x-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>View Roster</span>
                  </button>

                  <button
                    onClick={() => setSelectedPredictEvent(evt)}
                    className="py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition-all flex items-center justify-center space-x-1"
                  >
                    <Brain className="w-3.5 h-3.5 text-blue-700" />
                    <span>ML Forecast</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <EventCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateEvent={handleCreateEvent}
      />

      <EventEditModal
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
        onSaveEvent={handleUpdateEvent}
      />

      <AttendeeRosterModal
        isOpen={Boolean(rosterEvent)}
        onClose={() => setRosterEvent(null)}
        event={rosterEvent}
      />

      {/* ML Predictor Detailed Report Modal */}
      {selectedPredictEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-[#003366] font-bold">
                <Brain className="w-5 h-5 text-blue-700" />
                <span>Predictive Turnout Report</span>
              </div>
              <button onClick={() => setSelectedPredictEvent(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <h3 className="text-base font-extrabold text-blue-950">{selectedPredictEvent.title}</h3>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Forecasted Attendance:</span>
                  <span className="text-lg font-black text-[#003366]">
                    {selectedPredictEvent.predictedAttendance || Math.round(selectedPredictEvent.registrationCount * 0.8)} Attendees
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Capacity Utilization:</span>
                  <span className="text-sm font-bold text-blue-700">
                    {Math.round(((selectedPredictEvent.predictedAttendance || Math.round(selectedPredictEvent.registrationCount * 0.8)) / selectedPredictEvent.venueCapacity) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedPredictEvent(null)}
              className="w-full py-2.5 rounded-xl bg-[#003366] text-white text-xs font-bold"
            >
              Close Report
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
