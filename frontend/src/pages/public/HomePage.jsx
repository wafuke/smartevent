import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Clock, Users, ArrowRight, ShieldCheck, Sparkles, BookOpen, Code, Trophy, Briefcase, Film, Tag, CheckCircle2 } from 'lucide-react';
import { eventsApi, categoriesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function HomePage({ onOpenAuthModal }) {
  const { user, navigate, getRoleDashboardPath } = useAuth();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    eventsApi.getAll()
      .then(res => setEvents(res.data))
      .catch(() => {
        // Fallback default events
        setEvents([
          {
            id: 'evt-101',
            title: 'Strathmore Tech Innovation Summit 2026',
            category: 'Academic',
            description: 'Annual technology showcase featuring student computing projects, keynote speakers, and industry partner networking.',
            date: '2026-10-15',
            time: '09:00 AM',
            venue: 'Sir Thomas More Building, Auditorium A',
            venueCapacity: 350,
            registrationCount: 240,
            organizer: 'School of Computing and Engineering Sciences'
          },
          {
            id: 'evt-102',
            title: 'AI & Machine Learning Workshop',
            category: 'Workshop',
            description: 'Hands-on session covering Python, Scikit-learn, and model deployment for predictive analytics.',
            date: '2026-10-18',
            time: '02:00 PM',
            venue: 'Lab 3, SCES Complex',
            venueCapacity: 80,
            registrationCount: 65,
            organizer: 'Strathmore Tech Club'
          },
          {
            id: 'evt-103',
            title: 'Inter-Faculty Sports & Fitness Day',
            category: 'Sports',
            description: 'Annual campus-wide sports competition featuring football, basketball, athletics, and recreational activities.',
            date: '2026-10-22',
            time: '08:30 AM',
            venue: 'Strathmore Sports Complex Grounds',
            venueCapacity: 500,
            registrationCount: 310,
            organizer: 'Sports Department'
          }
        ]);
      });

    categoriesApi.getAll()
      .then(res => setCategories(res.data))
      .catch(() => {
        setCategories([
          { id: 'cat-1', name: 'Academic', count: 12 },
          { id: 'cat-2', name: 'Workshop', count: 8 },
          { id: 'cat-3', name: 'Seminar', count: 5 },
          { id: 'cat-4', name: 'Sports', count: 9 },
          { id: 'cat-5', name: 'Career Fair', count: 4 }
        ]);
      });
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryOptions = ['All', ...categories.map(c => c.name)];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-[#002244] to-[#003366] text-white rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl border border-blue-900/40">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Strathmore University Campus Event Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            University Events, <span className="text-blue-300 underline decoration-amber-400 decoration-wavy">Smarter.</span>
          </h1>

          <p className="text-slate-200 text-base sm:text-lg font-medium leading-relaxed max-w-2xl">
            Discover upcoming academic summits, hands-on coding workshops, inter-faculty sports competitions, and career fairs with real-time ML turnout forecasting and priority SMS alerts.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <a
              href="#discover-events"
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg transition-all hover:scale-[1.02] flex items-center space-x-2"
            >
              <span>Browse Events</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            {user ? (
              <button
                onClick={() => navigate(getRoleDashboardPath())}
                className="px-6 py-3.5 rounded-xl bg-white text-[#003366] hover:bg-blue-50 font-extrabold text-sm shadow-md transition-all"
              >
                Go to My {user.role.toUpperCase()} Dashboard
              </button>
            ) : (
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm border border-white/20 transition-all"
              >
                Create Free Account
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Featured Categories Bar */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Explore by Category</h2>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryOptions.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 border ${
                selectedCategory === cat
                  ? 'bg-[#003366] text-white border-[#003366] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-[#003366]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Public Event Discovery Grid */}
      <section id="discover-events" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Public Campus Events</h2>
            <p className="text-xs text-slate-500 mt-0.5">Browse events open for Strathmore University students & faculty</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event title, venue, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#003366] outline-none shadow-xs"
            />
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#003366] flex items-center justify-center mx-auto text-xl font-bold">🔍</div>
            <h3 className="text-base font-bold text-slate-900">No events found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search keywords or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => (
              <div key={evt.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-[#003366] border border-blue-200">
                      {evt.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      Cap: {evt.venueCapacity} seats
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug hover:text-[#003366] cursor-pointer" onClick={() => setSelectedEvent(evt)}>
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-[#003366]" />
                      <span>{evt.date} • {evt.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Organizer: <strong className="text-slate-800">{evt.organizer}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedEvent(evt)}
                    className="py-2 px-3 text-xs font-bold text-[#003366] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  >
                    View Details
                  </button>

                  {user ? (
                    <button
                      onClick={() => navigate(getRoleDashboardPath())}
                      className="py-2 px-4 text-xs font-bold text-white bg-[#003366] hover:bg-[#002244] rounded-xl transition-all shadow-xs"
                    >
                      RSVP / Manage
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenAuthModal('login')}
                      className="py-2 px-4 text-xs font-bold text-white bg-[#003366] hover:bg-[#002244] rounded-xl transition-all shadow-xs"
                    >
                      Sign In to RSVP
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Role Explanations Section */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-black tracking-tight">SmartEvent Role Portals</h2>
          <p className="text-xs text-slate-400">Designed for Students, Event Organizers, and System Administrators</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">🎓</div>
            <h3 className="text-base font-bold">Student Portal</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              1-tap RSVPs, schedule calendar sync, favorite events bookmarking, and instant SMS alerts for urgent schedule updates.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">📢</div>
            <h3 className="text-base font-bold">Event Organizer</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Event creation/editing/cancellation, real-time student RSVP roster management, ML turnout prediction, and SMS dispatch.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">👑</div>
            <h3 className="text-base font-bold">System Admin</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              System-wide user control, event moderation, category CRUD operations, database table inspection, and audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* Single Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-[#003366] border border-blue-200">
                {selectedEvent.category}
              </span>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900">{selectedEvent.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedEvent.description}</p>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Date & Time:</span>
                  <span className="font-bold">{selectedEvent.date} • {selectedEvent.time}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Location:</span>
                  <span className="font-bold">{selectedEvent.venue}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Venue Capacity:</span>
                  <span className="font-bold">{selectedEvent.venueCapacity} seats</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Organizer:</span>
                  <span className="font-bold text-[#003366]">{selectedEvent.organizer}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
              >
                Close
              </button>
              {user ? (
                <button
                  onClick={() => { setSelectedEvent(null); navigate(getRoleDashboardPath()); }}
                  className="px-5 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold hover:bg-[#002244]"
                >
                  Go to Dashboard to RSVP
                </button>
              ) : (
                <button
                  onClick={() => { setSelectedEvent(null); onOpenAuthModal('login'); }}
                  className="px-5 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold hover:bg-[#002244]"
                >
                  Log In to Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
