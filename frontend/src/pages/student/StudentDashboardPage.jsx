import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle, Clock, MapPin, Heart, Bookmark, Search, Trash2, User, Bell, Sparkles } from 'lucide-react';
import { eventsApi, registrationsApi, favoritesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'browse', 'saved', 'profile'
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, regsRes, favsRes] = await Promise.all([
        eventsApi.getAll().catch(() => ({ data: [] })),
        registrationsApi.getAll().catch(() => ({ data: [] })),
        favoritesApi.getAll().catch(() => ({ data: [], favoriteIds: [] }))
      ]);

      setEvents(eventsRes.data || []);
      setMyRegistrations(regsRes.data || []);
      setFavoriteIds(favsRes.favoriteIds || []);
    } catch (err) {
      console.error('Failed loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const registeredEventIds = myRegistrations.map(r => r.eventId);
  const myRegisteredEvents = events.filter(e => registeredEventIds.includes(e.id));
  const mySavedEvents = events.filter(e => favoriteIds.includes(e.id));

  const handleRegister = async (eventId) => {
    try {
      await registrationsApi.register({ eventId, studentName: user.name, studentId: user.studentId || '154210' });
      await loadData();
    } catch (err) {
      alert(err.message || 'Registration failed');
    }
  };

  const handleCancelRegistration = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel your RSVP for this event?')) return;
    try {
      const reg = myRegistrations.find(r => r.eventId === eventId);
      if (reg) {
        await registrationsApi.cancel(reg.id);
      } else {
        await registrationsApi.cancel(eventId);
      }
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to cancel registration');
    }
  };

  const handleToggleFavorite = async (eventId) => {
    try {
      const res = await favoritesApi.toggle(eventId);
      if (res.isSaved) {
        setFavoriteIds([...favoriteIds, eventId]);
      } else {
        setFavoriteIds(favoriteIds.filter(id => id !== eventId));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const filteredBrowseEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#003366] via-blue-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Student Portal • Strathmore University</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-200">
            Student ID: <strong className="text-amber-300">{user?.studentId || '154210'}</strong> • Department: {user?.department || 'Informatics and Computer Science'}
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-xs">
          <div className="text-center">
            <span className="block font-black text-xl text-white">{myRegisteredEvents.length}</span>
            <span className="text-[10px] text-blue-200 uppercase font-bold">Active RSVPs</span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-center">
            <span className="block font-black text-xl text-amber-300">{favoriteIds.length}</span>
            <span className="text-[10px] text-blue-200 uppercase font-bold">Saved Events</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-[#003366] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#003366] hover:bg-slate-100'
          }`}
        >
          My RSVPs ({myRegisteredEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'browse'
              ? 'bg-[#003366] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#003366] hover:bg-slate-100'
          }`}
        >
          Browse All Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'saved'
              ? 'bg-[#003366] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#003366] hover:bg-slate-100'
          }`}
        >
          Saved Favorites ({mySavedEvents.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'upcoming' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">My Registered Schedule</h2>
          {myRegisteredEvents.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#003366] flex items-center justify-center mx-auto text-xl font-bold">📅</div>
              <h3 className="text-base font-bold text-slate-900">No RSVPs yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore the Browse All Events tab to register for campus workshops, summits, and sports competitions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myRegisteredEvents.map(evt => (
                <div key={evt.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>RSVP Confirmed</span>
                      </span>
                      <button
                        onClick={() => handleToggleFavorite(evt.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          favoriteIds.includes(evt.id) ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">{evt.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-[#003366]" />
                        <span>{evt.date} • {evt.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>{evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      High-Priority SMS alerts enabled
                    </span>
                    <button
                      onClick={() => handleCancelRegistration(evt.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all flex items-center space-x-1"
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
      )}

      {activeTab === 'browse' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Campus Events Feed</h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#003366] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBrowseEvents.map(evt => {
              const isRegistered = registeredEventIds.includes(evt.id);
              const isSaved = favoriteIds.includes(evt.id);

              return (
                <div key={evt.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-[#003366] border border-blue-200">
                        {evt.category}
                      </span>
                      <button
                        onClick={() => handleToggleFavorite(evt.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSaved ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">{evt.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-[#003366]" />
                        <span>{evt.date} • {evt.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>{evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    {isRegistered ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Registered</span>
                        </span>
                        <button
                          onClick={() => handleCancelRegistration(evt.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegister(evt.id)}
                        className="w-full py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all shadow-xs"
                      >
                        RSVP Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Saved Favorite Events</h2>
          {mySavedEvents.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto text-xl font-bold">❤️</div>
              <h3 className="text-base font-bold text-slate-900">No saved events</h3>
              <p className="text-xs text-slate-500">Click the heart icon on any event to bookmark it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {mySavedEvents.map(evt => (
                <div key={evt.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-slate-900">{evt.title}</h3>
                    <p className="text-xs text-slate-600">{evt.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">{evt.date} • {evt.venue}</span>
                    <button
                      onClick={() => handleRegister(evt.id)}
                      className="px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold"
                    >
                      RSVP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
