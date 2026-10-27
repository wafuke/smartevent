import React from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StudentCalendarPage({ events, registeredEventIds, onUnregisterEvent }) {
  const registeredEvents = events.filter(e => registeredEventIds.includes(e.id));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] tracking-tight flex items-center space-x-2">
          <CalendarIcon className="w-7 h-7 text-[#003366]" />
          <span>My Registered Event Schedule</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your upcoming campus event RSVPs and schedule notifications
        </p>
      </div>

      {registeredEvents.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-[#003366] rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Events Registered Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Browse the Discover Events tab to find workshops, competitions, and seminars, and click "RSVP Now" to add them to your calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {registeredEvents.map((evt) => (
            <div 
              key={evt.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#003366] border border-blue-200">
                    {evt.category}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 inline" />
                    <span>CONFIRMED RSVP</span>
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{evt.title}</h3>

                <div className="flex flex-wrap gap-4 text-xs text-slate-600">
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

              <div className="flex items-center space-x-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => onUnregisterEvent(evt.id)}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-all flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancel RSVP</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
