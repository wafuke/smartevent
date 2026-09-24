import React, { useState } from 'react';
import { Calendar, Bell, User, Check, Search, MapPin, Clock, ArrowLeft, AlertTriangle, Info, LogIn, Sparkles } from 'lucide-react';

export default function StudentMobileView({ events, registeredEventIds, onRegisterEvent }) {
  const [currentScreen, setCurrentScreen] = useState('events'); // 'auth', 'events', 'detail', 'notifications'
  const [selectedEvent, setSelectedEvent] = useState(events[0] || null);
  const [isAuthLogin, setIsAuthLogin] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const studentInfo = { name: "Elvis Wanyama Wafuke", studentId: "154210" };

  const notifications = [
    {
      id: 'n-1',
      title: 'URGENT: Venue Changed',
      message: 'Tech Innovation Summit moved to Auditorium A. Please arrive by 8:45 AM.',
      priority: 'HIGH',
      time: '10m ago'
    },
    {
      id: 'n-2',
      title: 'Workshop Reminder',
      message: 'AI & Machine Learning Workshop tomorrow at 2:00 PM in SCES Lab 3.',
      priority: 'MEDIUM',
      time: '2h ago'
    },
    {
      id: 'n-3',
      title: 'Sports Day Registration',
      message: 'Inter-Faculty Sports Day registration is open for all students.',
      priority: 'LOW',
      time: '1d ago'
    }
  ];

  const filteredEvents = events.filter(e => {
    const matchesCat = activeCategory === 'All' || e.category === activeCategory;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col items-center py-4 space-y-6 max-w-7xl mx-auto">
      
      {/* Screen Mode Switcher Pills */}
      <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs">
        <button
          onClick={() => setCurrentScreen('auth')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${currentScreen === 'auth' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          Fig 4:7 Auth Screen
        </button>
        <button
          onClick={() => setCurrentScreen('events')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${currentScreen === 'events' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          Fig 4:8 Events Feed
        </button>
        <button
          onClick={() => {
            if (events.length > 0) setSelectedEvent(events[0]);
            setCurrentScreen('detail');
          }}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${currentScreen === 'detail' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          Fig 4:9 Event Details
        </button>
        <button
          onClick={() => setCurrentScreen('notifications')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${currentScreen === 'notifications' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
        >
          Fig 4:10 Priority Inbox
        </button>
      </div>

      {/* Smartphone Device Frame */}
      <div className="mobile-frame">
        <div className="mobile-notch"></div>

        {/* Top Status Header */}
        <div className="bg-slate-900 pt-8 pb-3 px-5 flex items-center justify-between border-b border-slate-800/80 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-[10px]">
              S
            </div>
            <span className="font-bold text-xs text-white">SmartEvent Student</span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            ID: {studentInfo.studentId}
          </span>
        </div>

        {/* Smartphone Screen Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 space-y-4">
          
          {/* SCREEN 1: Auth (Fig 4:7) */}
          {currentScreen === 'auth' && (
            <div className="space-y-6 pt-6 px-2">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-white">Strathmore SmartEvent</h3>
                <p className="text-xs text-slate-400">Student Sign In & Access Portal</p>
              </div>

              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setIsAuthLogin(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${isAuthLogin ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsAuthLogin(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${!isAuthLogin ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setCurrentScreen('events'); }} className="space-y-3">
                {!isAuthLogin && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Full Name</label>
                    <input type="text" defaultValue={studentInfo.name} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">Admission Number</label>
                  <input type="text" defaultValue={studentInfo.studentId} className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">Password</label>
                  <input type="password" defaultValue="••••••••" className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs" />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/30 mt-2">
                  {isAuthLogin ? 'Sign In to Portal' : 'Register Account'}
                </button>
              </form>
            </div>
          )}

          {/* SCREEN 2: Events Feed (Fig 4:8) */}
          {currentScreen === 'events' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search campus events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-1 overflow-x-auto pb-1 text-[10px]">
                {['All', 'Academic', 'Workshop', 'Sports'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {filteredEvents.map(evt => {
                  const isRegistered = registeredEventIds.includes(evt.id);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => { setSelectedEvent(evt); setCurrentScreen('detail'); }}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {evt.category}
                        </span>
                        {isRegistered && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Registered ✓
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-white leading-tight">{evt.title}</h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{evt.date}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[110px]">{evt.venue}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 3: Event Detail (Fig 4:9) */}
          {currentScreen === 'detail' && selectedEvent && (
            <div className="space-y-4">
              <button
                onClick={() => setCurrentScreen('events')}
                className="flex items-center space-x-1 text-xs text-blue-400 font-semibold mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="space-y-3">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedEvent.category}
                </span>

                <h3 className="text-sm font-extrabold text-white leading-snug">{selectedEvent.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{selectedEvent.description}</p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Date & Time:</span>
                    <span className="font-semibold">{selectedEvent.date} ({selectedEvent.time || selectedEvent.timeSlot})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Venue:</span>
                    <span className="font-semibold">{selectedEvent.venue}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Capacity:</span>
                    <span className="font-semibold text-emerald-400">{selectedEvent.registrationCount} / {selectedEvent.venueCapacity}</span>
                  </div>
                </div>

                <button
                  onClick={() => onRegisterEvent(selectedEvent.id)}
                  disabled={registeredEventIds.includes(selectedEvent.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 ${
                    registeredEventIds.includes(selectedEvent.id)
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                  }`}
                >
                  {registeredEventIds.includes(selectedEvent.id) ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>RSVP Confirmed</span>
                    </>
                  ) : (
                    <span>Register / RSVP Now</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4: Notifications Inbox (Fig 4:10) */}
          {currentScreen === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Priority SMS Inbox</span>
                </h3>
                <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                  1 Urgent
                </span>
              </div>

              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      n.priority === 'HIGH' ? 'bg-red-950/40 border-red-500/40' : n.priority === 'MEDIUM' ? 'bg-amber-950/40 border-amber-500/40' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        n.priority === 'HIGH' ? 'badge-priority-high' : n.priority === 'MEDIUM' ? 'badge-priority-medium' : 'badge-priority-low'
                      }`}>
                        {n.priority}
                      </span>
                      <span className="text-[9px] text-slate-500">{n.time}</span>
                    </div>
                    <h4 className="font-bold text-white text-[11px] mt-1">{n.title}</h4>
                    <p className="text-slate-300 text-[10px] leading-normal">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Mobile Navigation Bar */}
        <div className="bg-slate-900 border-t border-slate-800/80 px-4 py-2 flex items-center justify-around z-10">
          <button
            onClick={() => setCurrentScreen('events')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-semibold ${
              currentScreen === 'events' || currentScreen === 'detail' ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events</span>
          </button>

          <button
            onClick={() => setCurrentScreen('notifications')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-semibold relative ${
              currentScreen === 'notifications' ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-0 right-3"></span>
            <span>Alerts</span>
          </button>

          <button
            onClick={() => setCurrentScreen('auth')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-semibold ${
              currentScreen === 'auth' ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>

      </div>

    </div>
  );
}
