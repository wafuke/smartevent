import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  MapPin,
  Heart,
  Search,
  Trash2,
  Bell,
  Sparkles,
  Save,
  QrCode,
  CalendarPlus,
  ShieldCheck,
  CheckCheck,
  Tag,
  Lock
} from 'lucide-react';
import {
  eventsApi,
  registrationsApi,
  favoritesApi,
  smsApi,
  notificationsApi,
  usersApi,
  authApi,
  categoriesApi
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast, useConfirm, Modal, Badge, EmptyState } from '../../components/ui';
import SmsPriorityPicker, { smsTierLabel } from '../../components/SmsPriorityPicker';

function downloadIcsFile(evt) {
  const dateStr = (evt.date || '2026-11-01').replace(/-/g, '');
  const uid = `${evt.id}@smartevent.strathmore.edu`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Strathmore University//SmartEvent//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dateStr}T060000Z`,
    `DTSTART:${dateStr}T090000`,
    `DTEND:${dateStr}T120000`,
    `SUMMARY:${evt.title}`,
    `DESCRIPTION:${(evt.description || '').replace(/\n/g, ' ')}`,
    `LOCATION:${evt.venue || 'Strathmore University'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${evt.id || 'event'}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StudentDashboardPage() {
  const { user, updateCurrentUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'browse', 'saved', 'alerts', 'profile'
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [smsAlerts, setSmsAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [activePassModal, setActivePassModal] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    studentId: user?.studentId || '154210',
    phone: user?.phone || '+254712345678',
    department: user?.department || 'BSc Informatics & Computer Science',
    smsOptOut: Boolean(user?.smsOptOut),
    smsPriority: user?.smsPriority ?? 2,
    applyToRegistrations: false
  });
  const [registerTarget, setRegisterTarget] = useState(null);
  const [registerTier, setRegisterTier] = useState(3);
  const [registering, setRegistering] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change State
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPw, setSavingPw] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [eventsRes, catsRes, regsRes, favsRes, smsRes, notifRes] = await Promise.all([
        eventsApi.getAll().catch(() => null),
        categoriesApi.getAll().catch(() => null),
        registrationsApi.getAll().catch(() => null),
        favoritesApi.getAll().catch(() => null),
        smsApi.getLogs().catch(() => null),
        notificationsApi.getAll().catch(() => null)
      ]);

      if (eventsRes && Array.isArray(eventsRes.data)) setEvents(eventsRes.data);
      if (catsRes && Array.isArray(catsRes.data)) setCategories(catsRes.data);
      if (regsRes && Array.isArray(regsRes.data)) setMyRegistrations(regsRes.data);
      if (favsRes && Array.isArray(favsRes.favoriteIds)) setFavoriteIds(favsRes.favoriteIds);
      if (smsRes && Array.isArray(smsRes.data)) setSmsAlerts(smsRes.data);
      if (notifRes && Array.isArray(notifRes.data)) {
        setNotifications(notifRes.data);
        setUnreadCount(notifRes.unreadCount || 0);
      }
    } catch (err) {
      if (!silent) toast.error(err.message || 'Failed loading student dashboard');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 6000);
    const onFocus = () => loadData(true);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadData]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        studentId: user.studentId || '154210',
        phone: user.phone || '+254712345678',
        department: user.department || 'BSc Informatics & Computer Science',
        smsOptOut: Boolean(user.smsOptOut),
        smsPriority: user.smsPriority ?? 2,
        applyToRegistrations: false
      });
    }
  }, [user]);

  const registeredEventIds = myRegistrations.map((r) => r.eventId);
  const myRegisteredEvents = events
    .filter((e) => registeredEventIds.includes(e.id))
    .map((evt) => ({
      ...evt,
      registration: myRegistrations.find((r) => r.eventId === evt.id)
    }));
  const mySavedEvents = events.filter((e) => favoriteIds.includes(e.id));

  // The student picks their own SMS priority for every event they register for.
  const handleRegister = (eventId) => {
    const evt = events.find((e) => e.id === eventId);
    setRegisterTier(Number(user?.smsPriority ?? 3));
    setRegisterTarget(evt || { id: eventId, title: 'this event' });
  };

  const confirmRegister = async () => {
    if (!registerTarget) return;
    setRegistering(true);
    try {
      await registrationsApi.register({ eventId: registerTarget.id, smsPriority: registerTier });
      toast.success('RSVP confirmed! Your Digital Pass is ready in "My RSVPs".');
      setRegisterTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleChangeSmsPriority = async (eventId, tier) => {
    try {
      await registrationsApi.setSmsPriority(eventId, tier);
      toast.success(`SMS priority for this event set to ${smsTierLabel(tier)}.`);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Could not update SMS priority');
    }
  };

  const handleChangeSmsFrequency = async (eventId, smsFrequencyMinutes) => {
    try {
      await registrationsApi.setSmsPriority(eventId, { smsFrequencyMinutes });
      const label =
        smsFrequencyMinutes === null
          ? 'Auto (based on priority)'
          : smsFrequencyMinutes === 30
          ? 'Every 30 mins'
          : smsFrequencyMinutes === 60
          ? 'Every 1 hr'
          : smsFrequencyMinutes === 180
          ? 'Every 3 hrs'
          : 'Once per 24 hrs';
      toast.success(`SMS reminder frequency set to ${label}.`);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Could not update SMS frequency');
    }
  };

  const handleCancelRegistration = async (eventId, eventTitle) => {
    const ok = await confirm({
      title: 'Cancel Event RSVP',
      message: `Are you sure you want to cancel your registration for "${eventTitle || 'this event'}"? Your seat will be released.`,
      confirmText: 'Cancel RSVP',
      danger: true
    });
    if (!ok) return;

    try {
      await registrationsApi.cancelForEvent(eventId);
      toast.info('Your RSVP has been cancelled.');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel registration');
    }
  };

  const handleToggleFavorite = async (eventId) => {
    try {
      const res = await favoritesApi.toggle(eventId);
      if (res.isSaved) {
        setFavoriteIds((prev) => [...new Set([...prev, eventId])]);
        toast.success('Event saved to your favorites.');
      } else {
        setFavoriteIds((prev) => prev.filter((id) => id !== eventId));
        toast.info('Removed from saved favorites.');
      }
    } catch (err) {
      toast.error(err.message || 'Could not update favorites');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      toast.success('All notifications marked as read');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to mark notifications read');
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      await loadData();
    } catch {
      // ignore
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await usersApi.update(user.id, profileForm);
      if (res?.data) {
        updateCurrentUser(res.data);
      }
      toast.success('Student profile & SMS preferences saved!');
    } catch (err) {
      toast.error(err.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setSavingPw(true);
    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      toast.success('Password updated successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Password update failed');
    } finally {
      setSavingPw(false);
    }
  };

  const categoryOptions = ['All', ...categories.map((c) => c.name)];

  const filteredBrowseEvents = events.filter((e) => {
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (e.title || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.venue || '').toLowerCase().includes(q) ||
      (e.organizer || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#003366] via-blue-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Student Portal • Strathmore University</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-200">
            Admission No:{' '}
            <strong className="text-amber-300">{user?.studentId || '154210'}</strong> • Program:{' '}
            {user?.department || 'BSc Informatics & Computer Science'} • SMS:{' '}
            <strong className="text-emerald-300">
              {user?.smsOptOut ? 'Opted Out' : user?.phone || '+254712345678'}
            </strong>
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 text-xs self-start md:self-auto">
          <div className="text-center">
            <span className="block font-black text-xl text-white">
              {myRegisteredEvents.length}
            </span>
            <span className="text-[10px] text-blue-200 uppercase font-bold">My Passes</span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-center">
            <span className="block font-black text-xl text-amber-300">{favoriteIds.length}</span>
            <span className="text-[10px] text-blue-200 uppercase font-bold">Saved</span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-center">
            <span className="block font-black text-xl text-emerald-300">
              {smsAlerts.length + unreadCount}
            </span>
            <span className="text-[10px] text-blue-200 uppercase font-bold">Alerts</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'upcoming', label: `My RSVPs & Passes (${myRegisteredEvents.length})` },
          { id: 'browse', label: `Browse Campus Events (${events.length})` },
          { id: 'saved', label: `Saved Favorites (${mySavedEvents.length})` },
          {
            id: 'alerts',
            label: `SMS & Notifications (${smsAlerts.length}${unreadCount ? ` • ${unreadCount} new` : ''})`
          },
          { id: 'profile', label: `Profile & Security` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#003366] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#003366] hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: UPCOMING RSVPS & DIGITAL PASSES */}
      {activeTab === 'upcoming' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                My Confirmed Event Registrations & Digital Passes
              </h2>
              <p className="text-xs text-slate-500">
                Present your Digital Pass at the venue entrance for instant organizer check-in
              </p>
            </div>
          </div>

          {myRegisteredEvents.length === 0 ? (
            <EmptyState
              title="No confirmed RSVPs yet"
              subtitle="Browse upcoming campus workshops, summits, and sports competitions to reserve your seat."
              action={
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold"
                >
                  Explore Campus Events
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myRegisteredEvents.map((evt) => {
                const reg = evt.registration;
                const isCheckedIn = reg?.status === 'Checked In';
                return (
                  <div
                    key={evt.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={isCheckedIn ? 'blue' : 'green'}>
                          {isCheckedIn
                            ? 'Checked In at Venue'
                            : `Confirmed • Pass #${(reg?.id || evt.id).toUpperCase()}`}
                        </Badge>
                        <button
                          onClick={() => handleToggleFavorite(evt.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            favoriteIds.includes(evt.id)
                              ? 'text-red-500 bg-red-50'
                              : 'text-slate-400 hover:text-red-500'
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
                          <span>
                            {evt.date} • {evt.time || evt.timeSlot}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>{evt.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        My SMS priority for this event
                      </div>
                      <SmsPriorityPicker
                        compact
                        value={reg?.smsPriority ?? 2}
                        onChange={(tier) => handleChangeSmsPriority(evt.id, tier)}
                      />
                      <div className="pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Auto SMS Reminder Frequency
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: null, label: 'Auto' },
                            { value: 30, label: '30m' },
                            { value: 60, label: '1h' },
                            { value: 180, label: '3h' },
                            { value: 1440, label: 'Once' }
                          ].map((opt) => {
                            const active = (reg?.smsFrequencyMinutes ?? null) === opt.value;
                            return (
                              <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => handleChangeSmsFrequency(evt.id, opt.value)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  active
                                    ? 'bg-[#003366] text-white border-[#003366]'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActivePassModal(evt)}
                          className="px-3 py-1.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Digital Pass</span>
                        </button>
                        <button
                          onClick={() => downloadIcsFile(evt)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Add to Calendar</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleCancelRegistration(evt.id, evt.title)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BROWSE ALL EVENTS */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Campus Events Feed</h2>
              <p className="text-xs text-slate-500">
                1-tap registration with automatic SMS & in-app confirmation
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events, venues, organizers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 border ${
                  selectedCategory === cat
                    ? 'bg-[#003366] text-white border-[#003366]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>{cat}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBrowseEvents.map((evt) => {
              const isRegistered = registeredEventIds.includes(evt.id);
              const isSaved = favoriteIds.includes(evt.id);
              const regCount = Number(evt.registrationCount) || 0;
              const cap = Number(evt.venueCapacity) || 100;
              const isFull = regCount >= cap;

              return (
                <div
                  key={evt.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge tone="blue">{evt.category}</Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">
                          {regCount}/{cap} seats
                        </span>
                        <button
                          onClick={() => handleToggleFavorite(evt.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isSaved
                              ? 'text-red-500 bg-red-50'
                              : 'text-slate-400 hover:text-red-500'
                          }`}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">{evt.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-[#003366]" />
                        <span>
                          {evt.date} • {evt.time || evt.timeSlot}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span className="truncate">{evt.venue}</span>
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
                          onClick={() => handleCancelRegistration(evt.id, evt.title)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                        >
                          Cancel RSVP
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegister(evt.id)}
                        disabled={isFull}
                        className="w-full py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-2xs"
                      >
                        {isFull ? 'Event Full' : 'RSVP Now'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SAVED FAVORITES */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900">Saved Favorite Events</h2>
          {mySavedEvents.length === 0 ? (
            <EmptyState
              title="No saved events yet"
              subtitle="Click the heart icon on any event card to bookmark it here for quick access."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {mySavedEvents.map((evt) => {
                const isRegistered = registeredEventIds.includes(evt.id);
                return (
                  <div
                    key={evt.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge tone="blue">{evt.category}</Badge>
                        <button
                          onClick={() => handleToggleFavorite(evt.id)}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{evt.title}</h3>
                      <p className="text-xs text-slate-600">{evt.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        {evt.date} • {evt.venue}
                      </span>
                      {isRegistered ? (
                        <Badge tone="green">Registered</Badge>
                      ) : (
                        <button
                          onClick={() => handleRegister(evt.id)}
                          className="px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold"
                        >
                          RSVP Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRIORITY SMS ALERTS & IN-APP NOTIFICATIONS */}
      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Africa's Talking Priority SMS Dispatches */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Africa&apos;s Talking Priority SMS Alerts
                </h2>
                <p className="text-xs text-slate-500">
                  Broadcasts sent to your registered mobile ({user?.phone || '+254712345678'})
                </p>
              </div>
              <Badge tone="green">{smsAlerts.length} Dispatches</Badge>
            </div>

            {smsAlerts.length === 0 ? (
              <EmptyState title="No SMS dispatches yet" />
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {smsAlerts.map((sms) => (
                  <div
                    key={sms.id}
                    className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                      sms.priority === 'HIGH'
                        ? 'bg-red-50/70 border-red-200'
                        : sms.priority === 'MEDIUM'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-blue-50/70 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900">{sms.eventTitle}</span>
                      <Badge
                        tone={
                          sms.priority === 'HIGH'
                            ? 'red'
                            : sms.priority === 'MEDIUM'
                            ? 'amber'
                            : 'blue'
                        }
                      >
                        {sms.priority} PRIORITY
                      </Badge>
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed">{sms.message}</p>
                    <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                      <span>{sms.gatewayResponse || `Mode: ${sms.mode || 'SIMULATION'}`}</span>
                      <span>{(sms.sentAt || '').replace('T', ' ').slice(0, 16)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* In-App Notifications */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#003366]" />
                  <span>In-App Portal Notifications</span>
                </h2>
                <p className="text-xs text-slate-500">
                  RSVP confirmations, reminders, and campus announcements
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#003366] text-xs font-bold flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read ({unreadCount})</span>
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <EmptyState title="No in-app notifications" />
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkNotificationRead(n.id)}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 transition-all cursor-pointer ${
                      n.read
                        ? 'bg-slate-50/70 border-slate-200 text-slate-600'
                        : 'bg-blue-50/60 border-blue-200 text-slate-900 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold">{n.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {(n.createdAt || '').replace('T', ' ').slice(0, 16)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT PROFILE, SMS PREFERENCES & PASSWORD SECURITY */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-2xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Student Profile & Africa&apos;s Talking SMS Settings
              </h2>
              <p className="text-xs text-slate-500">
                Keep your Strathmore admission details and Kenyan mobile number up to date.
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Admission No (5-8 digits)
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.studentId}
                    onChange={(e) => setProfileForm({ ...profileForm, studentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Kenyan Mobile (+2547...)
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Degree Program / Department
                </label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>

              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!profileForm.smsOptOut}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, smsOptOut: !e.target.checked })
                  }
                  className="w-4 h-4 accent-[#003366]"
                />
                <span className="text-xs font-bold text-slate-800">
                  Receive Priority SMS Alerts via Africa&apos;s Talking for my registered events
                </span>
              </label>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800">Default SMS priority for new registrations</div>
                <SmsPriorityPicker
                  value={profileForm.smsPriority}
                  onChange={(tier) => setProfileForm({ ...profileForm, smsPriority: tier })}
                />
                <label className="flex items-center space-x-2 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.applyToRegistrations}
                    onChange={(e) => setProfileForm({ ...profileForm, applyToRegistrations: e.target.checked })}
                    className="w-3.5 h-3.5 accent-[#003366]"
                  />
                  <span>Also apply this to events I have already registered for</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving...' : 'Save Profile & SMS Settings'}</span>
              </button>
            </form>
          </div>

          {/* Password Security Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-2xs">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#003366]" />
                <span>Change Account Password</span>
              </h2>
              <p className="text-xs text-slate-500">
                Requires your current password and a new password (min 8 chars, letters + numbers).
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  New Password (min 8 chars, letters + numbers)
                </label>
                <input
                  type="password"
                  required
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingPw}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{savingPw ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER: STUDENT CHOOSES SMS PRIORITY */}
      <Modal
        open={Boolean(registerTarget)}
        onClose={() => setRegisterTarget(null)}
        title="Confirm RSVP and choose your SMS priority"
        maxWidth="max-w-md"
      >
        {registerTarget && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{registerTarget.title}</h3>
              <p className="text-xs text-slate-500">
                {registerTarget.date} {registerTarget.venue ? `• ${registerTarget.venue}` : ''}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                How much SMS do you want for this event?
              </div>
              <SmsPriorityPicker value={registerTier} onChange={setRegisterTier} />
              <p className="text-[11px] text-slate-500">
                You decide this, not the organizer. You can change it any time from My RSVPs.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRegisterTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={confirmRegister}
                disabled={registering}
                className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold disabled:opacity-60"
              >
                {registering ? 'Confirming...' : 'Confirm RSVP'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DIGITAL PASS MODAL */}
      <Modal
        open={Boolean(activePassModal)}
        onClose={() => setActivePassModal(null)}
        title="Strathmore SmartEvent Digital Entry Pass"
        maxWidth="max-w-md"
      >
        {activePassModal && (
          <div className="space-y-4 text-center">
            <div className="bg-gradient-to-br from-[#003366] to-slate-900 text-white p-6 rounded-2xl space-y-3">
              <div className="text-[11px] uppercase tracking-widest text-amber-300 font-bold">
                Official Campus Event Pass
              </div>
              <h3 className="text-lg font-black">{activePassModal.title}</h3>
              <p className="text-xs text-blue-200">
                {activePassModal.date} • {activePassModal.time} • {activePassModal.venue}
              </p>

              {/* Simulated High-Contrast Verification Matrix */}
              <div className="bg-white text-slate-900 p-4 rounded-2xl mx-auto max-w-[220px] space-y-2 shadow-inner">
                <QrCode className="w-28 h-28 mx-auto text-[#003366]" />
                <div className="font-mono text-xs font-black tracking-wider">
                  {(activePassModal.registration?.id || activePassModal.id).toUpperCase()}
                </div>
              </div>

              <div className="pt-2 border-t border-white/15 grid grid-cols-2 gap-2 text-left text-xs">
                <div>
                  <span className="text-[10px] text-blue-200 uppercase block">Attendee</span>
                  <span className="font-bold">{user?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-200 uppercase block">Admission No</span>
                  <span className="font-bold text-amber-300">{user?.studentId || '154210'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => downloadIcsFile(activePassModal)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Download .ICS Calendar
              </button>
              <button
                onClick={() => setActivePassModal(null)}
                className="px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
