import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OrganizerDashboard from './components/OrganizerDashboard';
import EventCreationModal from './components/EventCreationModal';
import PrioritySmsStudio from './components/PrioritySmsStudio';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import StudentMobileView from './components/StudentMobileView';
import StudentLandingPage from './components/StudentLandingPage';
import StudentCalendarPage from './components/StudentCalendarPage';
import StudentFeaturesPage from './components/StudentFeaturesPage';
import AuthModal from './components/AuthModal';
import { Brain, X, ShieldCheck, User } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedPredictEvent, setSelectedPredictEvent] = useState(null);
  const [registeredEventIds, setRegisteredEventIds] = useState(['evt-101']);

  // Logged-in user state (loads from localStorage or defaults to Organizer account)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartevent_user');
      return saved ? JSON.parse(saved) : {
        id: "usr-org-1",
        name: "SCES Event Organizer",
        email: "organizer@strathmore.edu",
        role: "organizer",
        department: "School of Computing and Engineering Sciences"
      };
    } catch (e) {
      return null;
    }
  });

  const [events, setEvents] = useState([
    {
      id: "evt-101",
      title: "Strathmore Tech Innovation Summit 2026",
      category: "Academic",
      description: "Annual university technology showcase featuring student computing projects, keynote speakers, and industry partner networking.",
      date: "2026-10-15",
      timeSlot: "Morning",
      time: "09:00 AM",
      venue: "Sir Thomas More Building, Auditorium A",
      venueCapacity: 350,
      registrationCount: 240,
      pastAttendanceRate: 0.82,
      predictedAttendance: 215,
      smsPriority: 3,
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
      smsPriority: 2,
      status: "Upcoming",
      organizer: "Strathmore Tech Club"
    },
    {
      id: "evt-103",
      title: "Inter-Faculty Sports & Fitness Day",
      category: "Sports",
      description: "Annual campus-wide sports competition featuring football, basketball, athletics, and recreational activities.",
      date: "2026-10-22",
      timeSlot: "Morning",
      time: "08:30 AM",
      venue: "Strathmore Sports Complex Grounds",
      venueCapacity: 500,
      registrationCount: 310,
      pastAttendanceRate: 0.85,
      predictedAttendance: 320,
      smsPriority: 1,
      status: "Upcoming",
      organizer: "Sports Department"
    }
  ]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setEvents(data.data);
        }
      })
      .catch(err => console.log('Backend API state fallback:', err.message));
  }, []);

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    if (authenticatedUser.role === 'student') {
      setActiveTab('student');
    } else {
      setActiveTab('organizer');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('smartevent_user');
    localStorage.removeItem('smartevent_token');
    setUser(null);
    setIsAuthModalOpen(true);
  };

  const handleCreateEvent = (newEventData) => {
    const created = {
      ...newEventData,
      id: `evt-${Date.now()}`
    };
    setEvents([created, ...events]);
    
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).catch(e => console.log('Backend save error:', e.message));
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

  const handleUnregisterEvent = (eventId) => {
    setRegisteredEventIds(prev => prev.filter(id => id !== eventId));
    setEvents(events.map(e => {
      if (e.id === eventId) {
        const newReg = Math.max(0, (e.registrationCount || 1) - 1);
        return {
          ...e,
          registrationCount: newReg,
          predictedAttendance: Math.round(newReg * (e.pastAttendanceRate || 0.8))
        };
      }
      return e;
    }));
  };

  const handleOpenSmsModal = (evt) => {
    setActiveTab('sms');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <StudentLandingPage
            events={events}
            registeredEventIds={registeredEventIds}
            onRegisterEvent={handleRegisterEvent}
            onNavigateOrganizer={() => setActiveTab('organizer')}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'calendar' && (
          <StudentCalendarPage
            events={events}
            registeredEventIds={registeredEventIds}
            onUnregisterEvent={handleUnregisterEvent}
          />
        )}

        {activeTab === 'features' && (
          <StudentFeaturesPage />
        )}

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

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Single Event ML Predictor Detailed Modal */}
      {selectedPredictEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-blue-900 font-bold">
                <Brain className="w-5 h-5 text-blue-700" />
                <span>Predictive Turnout Report</span>
              </div>
              <button onClick={() => setSelectedPredictEvent(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-blue-950">{selectedPredictEvent.title}</h3>
              
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Venue & Capacity</span>
                  <span className="font-semibold text-slate-800">{selectedPredictEvent.venue} ({selectedPredictEvent.venueCapacity})</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Student RSVPs</span>
                  <span className="font-bold text-emerald-700">{selectedPredictEvent.registrationCount} students</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Forecasted Attendance:</span>
                  <span className="text-xl font-extrabold text-blue-950">
                    {selectedPredictEvent.predictedAttendance || Math.round(selectedPredictEvent.registrationCount * 0.82)} Attendees
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Expected Capacity Utilization:</span>
                  <span className="text-sm font-bold text-blue-700">
                    {Math.round(((selectedPredictEvent.predictedAttendance || Math.round(selectedPredictEvent.registrationCount * 0.82)) / selectedPredictEvent.venueCapacity) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-blue-900 pt-1">
                  High-priority SMS notifications sent via Africa's Talking API maintain attendance at ~85% expected turnout.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPredictEvent(null)}
              className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all"
            >
              Close Report
            </button>
          </div>
        </div>
      )}

      {/* Official Enterprise Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-2">
          <div>
            © 2026 <strong>Strathmore University</strong>. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-blue-900 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-blue-900 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-blue-900 cursor-pointer">Help & Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
