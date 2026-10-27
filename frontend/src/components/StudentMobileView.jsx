import React, { useState } from 'react';
import { Calendar, Bell, User, Check, Search, MapPin, Clock, ArrowLeft } from 'lucide-react';

export default function StudentMobileView({ events, registeredEventIds, onRegisterEvent }) {
  const [currentScreen, setCurrentScreen] = useState('events');
  const [selectedEvent, setSelectedEvent] = useState(events[0] || null);
  const [isAuthLogin, setIsAuthLogin] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

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
      
      {/* Screen Mode Switcher */}
      <div className="flex items-center space-x-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300 text-xs">
        <button
          onClick={() => setCurrentScreen('events')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${currentScreen === 'events' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:text-blue-900'}`}
        >
          Events Feed
        </button>
        <button
          onClick={() => {
            if (events.length > 0) setSelectedEvent(events[0]);
            setCurrentScreen('detail');
          }}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${currentScreen === 'detail' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:text-blue-900'}`}
        >
          Event View
        </button>
        <button
          onClick={() => setCurrentScreen('notifications')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${currentScreen === 'notifications' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:text-blue-900'}`}
        >
          Notifications
        </button>
        <button
          onClick={() => setCurrentScreen('auth')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${currentScreen === 'auth' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:text-blue-900'}`}
        >
          Student Sign In
        </button>
      </div>

      {/* Smartphone Device Frame */}
      <div className="mobile-frame">
        <div className="mobile-notch"></div>

        {/* Top Header */}
        <div className="bg-blue-950 pt-8 pb-3 px-5 flex items-center justify-between border-b border-blue-900 z-10 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-amber-400 flex items-center justify-center font-extrabold text-blue-950 text-[10px]">
              S
            </div>
            <span className="font-extrabold text-xs tracking-tight">SmartEvent Student</span>
          </div>
          <span className="text-[10px] text-amber-300 font-mono bg-blue-900 px-2 py-0.5 rounded border border-blue-800">
            Strathmore Portal
          </span>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4 text-slate-900">
          
          {/* SCREEN 1: Auth */}
          {currentScreen === 'auth' && (
            <div className="space-y-6 pt-4 px-2">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-900 rounded-2xl mx-auto flex items-center justify-center shadow-md">
                  <Calendar className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-extrabold text-blue-950">Strathmore SmartEvent</h3>
                <p className="text-xs text-slate-500">Official Student Access Portal</p>
              </div>

              <div className="flex bg-slate-200/80 p-1 rounded-xl">
                <button
                  onClick={() => setIsAuthLogin(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${isAuthLogin ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsAuthLogin(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${!isAuthLogin ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setCurrentScreen('events'); }} className="space-y-3">
                {!isAuthLogin && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">Full Name</label>
                    <input type="text" placeholder="Enter student name" className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Admission Number</label>
                  <input type="text" placeholder="e.g. 154210" className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">Password</label>
                  <input type="password" defaultValue="••••••••" className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs" />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs shadow-md mt-2">
                  {isAuthLogin ? 'Sign In to Portal' : 'Register Account'}
                </button>
              </form>
            </div>
          )}

          {/* SCREEN 2: Events Feed */}
          {currentScreen === 'events' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search campus events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex space-x-1 overflow-x-auto pb-1 text-[10px]">
                {['All', 'Academic', 'Workshop', 'Sports'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap ${activeCategory === cat ? 'bg-blue-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
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
                      className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 shadow-sm cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                          {evt.category}
                        </span>
                        {isRegistered && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            REGISTERED
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-blue-950 leading-tight">{evt.title}</h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-blue-800" />
                          <span>{evt.date}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          <span className="truncate max-w-[110px]">{evt.venue}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 3: Event Detail */}
          {currentScreen === 'detail' && selectedEvent && (
            <div className="space-y-4">
              <button
                onClick={() => setCurrentScreen('events')}
                className="flex items-center space-x-1 text-xs text-blue-800 font-bold mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="space-y-3">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                  {selectedEvent.category}
                </span>

                <h3 className="text-sm font-extrabold text-blue-950 leading-snug">{selectedEvent.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedEvent.description}</p>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Date & Time:</span>
                    <span className="font-semibold">{selectedEvent.date} ({selectedEvent.time || selectedEvent.timeSlot})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Venue:</span>
                    <span className="font-semibold">{selectedEvent.venue}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Capacity:</span>
                    <span className="font-bold text-emerald-700">{selectedEvent.registrationCount} / {selectedEvent.venueCapacity}</span>
                  </div>
                </div>

                <button
                  onClick={() => onRegisterEvent(selectedEvent.id)}
                  disabled={registeredEventIds.includes(selectedEvent.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 ${
                    registeredEventIds.includes(selectedEvent.id)
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-blue-900 text-white hover:bg-blue-800'
                  }`}
                >
                  {registeredEventIds.includes(selectedEvent.id) ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>You are RSVP'd</span>
                    </>
                  ) : (
                    <span>Register / RSVP Now</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4: Notifications Inbox */}
          {currentScreen === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Priority SMS Inbox</span>
                </h3>
                <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                  1 Urgent
                </span>
              </div>

              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      n.priority === 'HIGH' ? 'bg-red-50 border-red-200' : n.priority === 'MEDIUM' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        n.priority === 'HIGH' ? 'badge-priority-high' : n.priority === 'MEDIUM' ? 'badge-priority-medium' : 'badge-priority-low'
                      }`}>
                        {n.priority} PRIORITY
                      </span>
                      <span className="text-[9px] text-slate-500">{n.time}</span>
                    </div>
                    <h4 className="font-bold text-blue-950 text-[11px] mt-1">{n.title}</h4>
                    <p className="text-slate-700 text-[10px] leading-normal">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Nav Bar */}
        <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around z-10">
          <button
            onClick={() => setCurrentScreen('events')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold ${
              currentScreen === 'events' || currentScreen === 'detail' ? 'text-blue-900' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events</span>
          </button>

          <button
            onClick={() => setCurrentScreen('notifications')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold relative ${
              currentScreen === 'notifications' ? 'text-blue-900' : 'text-slate-400'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full absolute top-0 right-3"></span>
            <span>Alerts</span>
          </button>

          <button
            onClick={() => setCurrentScreen('auth')}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-bold ${
              currentScreen === 'auth' ? 'text-blue-900' : 'text-slate-400'
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
