import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OrganizerDashboard from './components/OrganizerDashboard';
import EventCreationModal from './components/EventCreationModal';
import PrioritySmsStudio from './components/PrioritySmsStudio';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import StudentMobileView from './components/StudentMobileView';
import { Brain, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('organizer'); // organizer, sms, analytics, student
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPredictEvent, setSelectedPredictEvent] = useState(null);
  const [registeredEventIds, setRegisteredEventIds] = useState(['evt-101']);

  const [events, setEvents] = useState([
    {
      id: "evt-101",
      title: "Strathmore Tech Innovation Summit 2026",
      category: "Academic",
      description: "Annual university technology and computing project showcase featuring student capstone presentations, keynote speakers, and industry partner networking.",
      date: "2026-10-15",
      timeSlot: "Morning",
      time: "09:00 AM",
      venue: "Sir Thomas More Building, Auditorium A",
      venueCapacity: 350,
      registrationCount: 240,
      pastAttendanceRate: 0.82,
      predictedAttendance: 215,
      smsPriority: 3, // High
      status: "Upcoming",
      organizer: "School of Computing and Engineering Sciences"
    },
    {
      id: "evt-102",
      title: "AI & Machine Learning Workshop",
      category: "Workshop",
      description: "Hands-on session covering Python, Scikit-learn, and model deployment for predictive analytics.",
      date: "2026-10-18",
      timeSlot: "Afternoon",
      time: "02:00 PM",
      venue: "Lab 3, SCES Complex",
      venueCapacity: 80,
      registrationCount: 65,
      pastAttendanceRate: 0.78,
      predictedAttendance: 56,
      smsPriority: 2, // Medium
      status: "Upcoming",
      organizer: "Strathmore Tech Club"
    },
    {
      id: "evt-103",
      title: "Inter-Faculty Sports & Fitness Day",
      category: "Sports",
      description: "Annual campus-wide sports competition featuring football, basketball, athletics, and fun activities.",
      date: "2026-10-22",
      timeSlot: "Morning",
      time: "08:30 AM",
      venue: "Strathmore Sports Complex Grounds",
      venueCapacity: 500,
      registrationCount: 310,
      pastAttendanceRate: 0.85,
      predictedAttendance: 320,
      smsPriority: 1, // Low
      status: "Upcoming",
      organizer: "Sports Department"
    }
  ]);

  // Fetch initial events from backend API if running
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setEvents(data.data);
        }
      })
      .catch(err => console.log('Backend API offline, using initialized events state:', err.message));
  }, []);

  const handleCreateEvent = (newEventData) => {
    const created = {
      ...newEventData,
      id: `evt-${Date.now()}`
    };
    setEvents([created, ...events]);
    
    // Also post to backend
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).catch(e => console.log('Backend save:', e.message));
  };

  const handleRegisterEvent = (eventId) => {
    if (!registeredEventIds.includes(eventId)) {
      setRegisteredEventIds([...registeredEventIds, eventId]);
      setEvents(events.map(e => {
        if (e.id === eventId) {
          const newReg = (e.registrationCount || 0) + 1;
          return {
            ...e,
            registrationCount: newReg,
            predictedAttendance: Math.round(newReg * (e.pastAttendanceRate || 0.8))
          };
        }
        return e;
      }));
    }
  };

  const handleOpenSmsModal = (evt) => {
    setActiveTab('sms');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-sans">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'organizer' && (
          <OrganizerDashboard
            events={events}
            setEvents={setEvents}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenSmsModal={handleOpenSmsModal}
            onPredictEvent={(evt) => setSelectedPredictEvent(evt)}
          />
        )}

        {activeTab === 'sms' && (
          <PrioritySmsStudio events={events} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'student' && (
          <StudentMobileView
            events={events}
            registeredEventIds={registeredEventIds}
            onRegisterEvent={handleRegisterEvent}
          />
        )}
      </main>

      {/* Event Creation Modal */}
      <EventCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateEvent={handleCreateEvent}
      />

      {/* Single Event ML Predictor Detailed Modal */}
      {selectedPredictEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                <Brain className="w-5 h-5 animate-pulse" />
                <span>ML Turnout Prediction Report</span>
              </div>
              <button onClick={() => setSelectedPredictEvent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-white">{selectedPredictEvent.title}</h3>
              
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Venue & Max Cap</span>
                  <span className="font-semibold text-slate-200">{selectedPredictEvent.venue} ({selectedPredictEvent.venueCapacity})</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Current RSVPs</span>
                  <span className="font-semibold text-emerald-400">{selectedPredictEvent.registrationCount} students</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/30 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">ML Forecasted Headcount:</span>
                  <span className="text-xl font-black text-amber-400">
                    {selectedPredictEvent.predictedAttendance || Math.round(selectedPredictEvent.registrationCount * 0.82)} Attendees
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Predicted Capacity Fill:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {Math.round(((selectedPredictEvent.predictedAttendance || Math.round(selectedPredictEvent.registrationCount * 0.82)) / selectedPredictEvent.venueCapacity) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-2 bg-indigo-900/40 p-2.5 rounded-lg border border-indigo-500/20">
                  Recommendation: High-priority SMS notification sent to registered students is expected to maintain turnout at ~85%. Venue capacity is adequate.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPredictEvent(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
            >
              Close Report
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          SmartEvent • Strathmore University School of Computing and Engineering Sciences • Capstone Project by Elvis Wanyama Wafuke (154210)
        </div>
      </footer>
    </div>
  );
}
