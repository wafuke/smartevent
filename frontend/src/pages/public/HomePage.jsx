import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
  Tag,
  Brain,
  CheckCircle2
} from 'lucide-react';
import { eventsApi, categoriesApi, registrationsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui';
import SmsPriorityPicker from '../../components/SmsPriorityPicker';

export default function HomePage({ onOpenAuthModal }) {
  const { user, navigate, getRoleDashboardPath } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'popular'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [homeTier, setHomeTier] = useState(2);

  const loadPublicData = () => {
    eventsApi
      .getAll()
      .then((res) => setEvents(res.data || []))
      .catch(() => {});

    categoriesApi
      .getAll()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadPublicData();
  }, []);

  const filteredEvents = events
    .filter((e) => {
      const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (e.title || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.venue || '').toLowerCase().includes(q) ||
        (e.organizer || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.registrationCount || 0) - (a.registrationCount || 0);
      }
      return String(a.date || '').localeCompare(String(b.date || ''));
    });

  const categoryOptions = ['All', ...categories.map((c) => c.name)];

  const handleQuickRsvp = async (evt) => {
    if (!user) {
      onOpenAuthModal('login');
      return;
    }
    if (String(user.role).toLowerCase() !== 'student') {
      navigate(getRoleDashboardPath());
      return;
    }
    setRsvpLoading(true);
    try {
      await registrationsApi.register({ eventId: evt.id, smsPriority: homeTier });
      toast.success(`RSVP confirmed for "${evt.title}"! Digital Pass generated.`);
      setSelectedEvent(null);
      loadPublicData();
    } catch (err) {
      toast.error(err.message || 'Could not complete RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  const totalSeatsBooked = events.reduce((acc, e) => acc + (Number(e.registrationCount) || 0), 0);

  return (
    <div className="space-y-14 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#002244] to-[#003366] text-white rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl border border-blue-900/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Strathmore University Campus Event Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              University Events,{' '}
              <span className="text-amber-400 underline decoration-blue-400 decoration-wavy">
                Smarter.
              </span>
            </h1>

            <p className="text-slate-200 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
              Discover upcoming academic summits, hands-on coding workshops, inter-faculty sports
              competitions, and career fairs with real-time Scikit-Learn ML turnout forecasting and
              Africa&apos;s Talking priority SMS alerts.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#discover-events"
                className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition-all flex items-center space-x-2"
              >
                <span>Browse {events.length} Live Events</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {user ? (
                <button
                  onClick={() => navigate(getRoleDashboardPath())}
                  className="px-6 py-3.5 rounded-xl bg-white text-[#003366] hover:bg-blue-50 font-extrabold text-xs sm:text-sm shadow-md transition-all"
                >
                  Open My {user.role.toUpperCase()} Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onOpenAuthModal('login')}
                    className="px-6 py-3.5 rounded-xl bg-white text-[#003366] hover:bg-blue-50 font-extrabold text-xs sm:text-sm shadow-md transition-all"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => onOpenAuthModal('signup')}
                    className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs sm:text-sm border border-white/20 transition-all"
                  >
                    Create Student / Organizer Account
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Live Platform Telemetry Card */}
          <div className="lg:col-span-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
              Live Campus Pulse
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-xl p-3.5 border border-white/10">
                <div className="text-2xl font-black text-white">{events.length}</div>
                <div className="text-[11px] text-slate-300 font-semibold">Listed Events</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3.5 border border-white/10">
                <div className="text-2xl font-black text-amber-400">
                  {totalSeatsBooked.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-300 font-semibold">Confirmed RSVPs</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3.5 border border-white/10">
                <div className="text-2xl font-black text-emerald-400">{categories.length}</div>
                <div className="text-[11px] text-slate-300 font-semibold">Event Categories</div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3.5 border border-white/10">
                <div className="text-2xl font-black text-blue-300">AT SMS</div>
                <div className="text-[11px] text-slate-300 font-semibold">Priority Alerts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Bar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Filter by Event Category
          </h2>
          <span className="text-xs font-bold text-slate-500">
            Showing {filteredEvents.length} of {events.length} events
          </span>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryOptions.map((cat) => (
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Upcoming Campus Events
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Open for Strathmore University students, faculty, and registered societies
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, venue, organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#003366] outline-none shadow-2xs"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            >
              <option value="date">Sort by Date (Soonest)</option>
              <option value="popular">Sort by Most RSVPs</option>
            </select>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#003366] flex items-center justify-center mx-auto text-xl font-bold">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No matching events</h3>
            <p className="text-xs text-slate-500">
              Try clearing your search filter or selecting &quot;All&quot; categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              const regCount = Number(evt.registrationCount) || 0;
              const cap = Number(evt.venueCapacity) || 100;
              const fillPct = Math.min(100, Math.round((regCount / Math.max(1, cap)) * 100));
              const isFull = regCount >= cap;

              return (
                <div
                  key={evt.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-[#003366] border border-blue-200">
                        {evt.category}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {regCount}/{cap} Registered ({fillPct}%)
                      </span>
                    </div>

                    <div>
                      <h3
                        className="text-base font-extrabold text-slate-900 leading-snug hover:text-[#003366] cursor-pointer"
                        onClick={() => setSelectedEvent(evt)}
                      >
                        {evt.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    {/* Capacity bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          fillPct >= 90
                            ? 'bg-red-500'
                            : fillPct >= 70
                            ? 'bg-amber-500'
                            : 'bg-[#003366]'
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-[#003366]" />
                        <span>
                          {evt.date} • {evt.time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">
                          Host: <strong className="text-slate-800">{evt.organizer}</strong>
                        </span>
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
                      String(user.role).toLowerCase() === 'student' ? (
                        <button
                          onClick={() => {
                            setHomeTier(Number(user?.smsPriority ?? 2));
                            setSelectedEvent(evt);
                          }}
                          disabled={isFull || rsvpLoading}
                          className="py-2 px-4 text-xs font-bold text-white bg-[#003366] hover:bg-[#002244] disabled:opacity-50 rounded-xl transition-all shadow-2xs"
                        >
                          {isFull ? 'Event Full' : 'RSVP'}
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(getRoleDashboardPath())}
                          className="py-2 px-4 text-xs font-bold text-white bg-[#003366] hover:bg-[#002244] rounded-xl transition-all shadow-2xs"
                        >
                          Manage in Portal
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => onOpenAuthModal('login')}
                        className="py-2 px-4 text-xs font-bold text-white bg-[#003366] hover:bg-[#002244] rounded-xl transition-all shadow-2xs"
                      >
                        Sign In to RSVP
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Role Explanations Section */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-black tracking-tight">SmartEvent Role Portals</h2>
          <p className="text-xs text-slate-400">
            Dedicated Role-Based Access Control (RBAC) workspaces for Students, Event Organizers, and
            Administrators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black">
              STD
            </div>
            <h3 className="text-base font-bold">Student Portal</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              1-tap RSVPs, digital QR entry passes, .ICS calendar export, favorite events
              bookmarking, and Africa&apos;s Talking SMS alerts for schedule changes.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
              ORG
            </div>
            <h3 className="text-base font-bold">Event Organizer</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Create, edit, and manage campus events, check in attendees on live rosters, run ML
              turnout predictions, and dispatch targeted SMS broadcasts.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
              ADM
            </div>
            <h3 className="text-base font-bold">System Admin</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Full CRUD relational tables across Users, Events, Registrations, Categories, Venues,
              and Africa&apos;s Talking SMS Gateway audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* Single Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-[#003366] border border-blue-200">
                {selectedEvent.category}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900">{selectedEvent.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedEvent.description}</p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Date & Time:</span>
                  <span className="font-bold">
                    {selectedEvent.date} • {selectedEvent.time}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Location:</span>
                  <span className="font-bold">{selectedEvent.venue}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Registrations / Capacity:</span>
                  <span className="font-bold">
                    {selectedEvent.registrationCount || 0} / {selectedEvent.venueCapacity} seats
                  </span>
                </div>
                {selectedEvent.predictedAttendance && (
                  <div className="flex justify-between text-purple-700 pt-1 border-t border-slate-200">
                    <span className="font-semibold flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5" /> ML Predicted Turnout:
                    </span>
                    <span className="font-extrabold">
                      {selectedEvent.predictedAttendance} attendees
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Organizer:</span>
                  <span className="font-bold text-[#003366]">{selectedEvent.organizer}</span>
                </div>
              </div>
            </div>

            {user && String(user.role).toLowerCase() === 'student' && (
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Your SMS priority for this event
                </div>
                <SmsPriorityPicker value={homeTier} onChange={setHomeTier} />
              </div>
            )}

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
              >
                Close
              </button>
              {user ? (
                String(user.role).toLowerCase() === 'student' ? (
                  <button
                    onClick={() => handleQuickRsvp(selectedEvent)}
                    disabled={rsvpLoading}
                    className="px-5 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold hover:bg-[#002244] flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{rsvpLoading ? 'Confirming...' : 'Confirm RSVP Now'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      navigate(getRoleDashboardPath());
                    }}
                    className="px-5 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold hover:bg-[#002244]"
                  >
                    Open Dashboard
                  </button>
                )
              ) : (
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    onOpenAuthModal('login');
                  }}
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
