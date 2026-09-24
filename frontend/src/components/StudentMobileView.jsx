import React, { useState } from 'react';
import { Smartphone, Calendar, Bell, User, Check, Search, MapPin, Clock, ArrowLeft, ShieldAlert, AlertCircle, Info, ChevronRight, LogIn, UserPlus } from 'lucide-react';

export default function StudentMobileView({ events, registeredEventIds, onRegisterEvent }) {
  // Mobile Screen State: 'auth' (Fig 4:7), 'events' (Fig 4:8), 'detail' (Fig 4:9), 'notifications' (Fig 4:10)
  const [currentScreen, setCurrentScreen] = useState('events');
  const [selectedEvent, setSelectedEvent] = useState(events[0] || null);
  const [isAuthLogin, setIsAuthLogin] = useState(true);
  const [studentUser, setStudentUser] = useState({ name: 'Elvis Wanyama Wafuke', studentId: '154210', authenticated: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabCategory, setActiveTabCategory] = useState('All');

  const notifications = [
    {
      id: 'n-1',
      title: 'URGENT: Venue Change',
      message: 'Strathmore Tech Innovation Summit 2026 moved to Sir Thomas More Auditorium A. Please arrive by 8:45 AM.',
      priority: 'HIGH',
      time: '10 mins ago',
      read: false
    },
    {
      id: 'n-2',
      title: 'Event Reminder',
      message: 'AI & Machine Learning Workshop is tomorrow at 2:00 PM in SCES Lab 3.',
      priority: 'MEDIUM',
      time: '2 hours ago',
      read: true
    },
    {
      id: 'n-3',
      title: 'Campus Announcement',
      message: 'Registration for Inter-Faculty Sports Day is now open for all undergraduate students.',
      priority: 'LOW',
      time: 'Yesterday',
      read: true
    }
  ];

  const filteredEvents = events.filter(e => {
    const matchesCat = activeTabCategory === 'All' || e.category === activeTabCategory;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col items-center py-4 space-y-6">
      
      {/* Screen Selector Banner */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 font-medium px-2">Wireframe View:</span>
        <button
          onClick={() => setCurrentScreen('auth')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all ${currentScreen === 'auth' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
        >
          Fig 4:7 Sign In/Up
        </button>
        <button
          onClick={() => setCurrentScreen('events')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all ${currentScreen === 'events' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
        >
          Fig 4:8 Available Events
        </button>
        <button
          onClick={() => {
            if (events.length > 0) setSelectedEvent(events[0]);
            setCurrentScreen('detail');
          }}
          className={`px-3 py-1 rounded-lg font-semibold transition-all ${currentScreen === 'detail' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
        >
          Fig 4:9 Event Details
        </button>
        <button
          onClick={() => setCurrentScreen('notifications')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all ${currentScreen === 'notifications' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
        >
          Fig 4:10 Notifications
        </button>
      </div>

      {/* Smartphone Outer Device Shell */}
      <div className="mobile-frame">
        <div className="mobile-notch"></div>

        {/* Mobile App Header Bar */}
        <div className="bg-slate-900 pt-8 pb-3 px-4 flex items-center justify-between border-b border-slate-800 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              S
            </div>
            <span className="font-bold text-sm text-white tracking-tight">SmartEvent Mobile</span>
          </div>
          {studentUser.authenticated && (
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-amber-400 border border-slate-700">
              ID: {studentUser.studentId}
            </span>
          )}
        </div>

        {/* Smartphone Screen Contents */}
        <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 space-y-4">
          
          {/* SCREEN 1: Auth / Sign In / Sign Up (Figure 4:7) */}
          {currentScreen === 'auth' && (
            <div className="space-y-6 pt-4">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Strathmore SmartEvent</h3>
                <p className="text-xs text-slate-400">Student Access Portal</p>
              </div>

              {/* Form Toggle */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAuthLogin(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold ${isAuthLogin ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuthLogin(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold ${!isAuthLogin ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setCurrentScreen('events'); }} className="space-y-4">
                {!isAuthLogin && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Full Name</label>
                    <input
                      type="text"
                      placeholder="Elvis Wanyama Wafuke"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Admission Number</label>
                  <input
                    type="text"
                    defaultValue="154210"
                    placeholder="154210"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Password</label>
                  <input
                    type="password"
                    defaultValue="••••••••"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-600/30 mt-2"
                >
                  {isAuthLogin ? 'Sign In to Student Portal' : 'Register Account'}
                </button>
              </form>
            </div>
          )}

          {/* SCREEN 2: Available Events Page (Figure 4:8) */}
          {currentScreen === 'events' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search events, workshops, venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Categories */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
                {['All', 'Academic', 'Workshop', 'Sports'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveTabCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap ${
                      activeTabCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Events List Feed */}
              <div className="space-y-3">
                {filteredEvents.map(evt => {
                  const isRegistered = registeredEventIds.includes(evt.id);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setSelectedEvent(evt);
                        setCurrentScreen('detail');
                      }}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-blue-500/50 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50">
                          {evt.category}
                        </span>
                        {isRegistered && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 flex items-center space-x-1">
                            <Check className="w-3 h-3 inline" />
                            <span>RSVP'D</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-white leading-tight">{evt.title}</h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{evt.date}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[120px]">{evt.venue}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 3: Event Details & RSVP Page (Figure 4:9) */}
          {currentScreen === 'detail' && selectedEvent && (
            <div className="space-y-4">
              <button
                onClick={() => setCurrentScreen('events')}
                className="flex items-center space-x-1 text-xs text-blue-400 font-semibold mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Events</span>
              </button>

              <div className="space-y-3">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedEvent.category}
                </span>

                <h3 className="text-base font-extrabold text-white leading-snug">{selectedEvent.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{selectedEvent.description}</p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Date & Time</span>
                    </span>
                    <span className="font-semibold text-white">{selectedEvent.date} ({selectedEvent.time || selectedEvent.timeSlot})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>Venue</span>
                    </span>
                    <span className="font-semibold text-white">{selectedEvent.venue}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Registered</span>
                    </span>
                    <span className="font-semibold text-emerald-400">{selectedEvent.registrationCount} / {selectedEvent.venueCapacity}</span>
                  </div>
                </div>

                {/* RSVP Button */}
                <button
                  onClick={() => onRegisterEvent(selectedEvent.id)}
                  disabled={registeredEventIds.includes(selectedEvent.id)}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${
                    registeredEventIds.includes(selectedEvent.id)
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
                  }`}
                >
                  {registeredEventIds.includes(selectedEvent.id) ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>You Are Registered!</span>
                    </>
                  ) : (
                    <span>Register / Confirm Attendance</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4: Notifications Page (Figure 4:10) */}
          {currentScreen === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Priority SMS & Alerts Inbox</span>
                </h3>
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                  1 Urgent
                </span>
              </div>

              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      n.priority === 'HIGH'
                        ? 'bg-red-950/40 border-red-500/40'
                        : n.priority === 'MEDIUM'
                        ? 'bg-amber-950/40 border-amber-500/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                        n.priority === 'HIGH' ? 'bg-red-500 text-white' : n.priority === 'MEDIUM' ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white'
                      }`}>
                        {n.priority} PRIORITY
                      </span>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>

                    <h4 className="font-bold text-white">{n.title}</h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Mobile Navigation Bottom Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-around z-10">
          <button
            onClick={() => setCurrentScreen('events')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-semibold ${
              currentScreen === 'events' || currentScreen === 'detail' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events</span>
          </button>

          <button
            onClick={() => setCurrentScreen('notifications')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-semibold relative ${
              currentScreen === 'notifications' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-red-500 rounded-full absolute top-0 right-3"></span>
            <span>Alerts</span>
          </button>

          <button
            onClick={() => setCurrentScreen('auth')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-semibold ${
              currentScreen === 'auth' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
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
