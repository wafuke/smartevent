import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Users,
  Calendar,
  MessageSquare,
  Brain,
  Send,
  Clock,
  MapPin,
  Edit3,
  Trash2,
  UserCheck,
  BarChart3,
  Save,
  Lock,
  ShieldCheck
} from 'lucide-react';
import {
  eventsApi,
  smsApi,
  predictApi,
  analyticsApi,
  categoriesApi,
  venuesApi,
  usersApi,
  authApi
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EventFormModal from '../../components/EventFormModal';
import AttendeeRosterModal from '../../components/AttendeeRosterModal';
import SmsComposer from '../../components/SmsComposer';
import MlSimulatorAndTrainingPanel from '../../components/MlSimulatorAndTrainingPanel';
import { useToast, useConfirm, DataTable, Badge, Modal, StatCard } from '../../components/ui';

export default function OrganizerDashboardPage() {
  const { user, updateCurrentUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'sms' | 'analytics' | 'profile'
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [smsStatus, setSmsStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const [eventScope, setEventScope] = useState('mine'); // 'mine' or 'all'
  const [filterCategory, setFilterCategory] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [rosterEvent, setRosterEvent] = useState(null);

  // ML Forecast Modal State
  const [selectedPredictEvent, setSelectedPredictEvent] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loadingPred, setLoadingPred] = useState(false);

  // Profile & Password state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '+254711000011',
    department: user?.department || 'School of Computing & Engineering Sciences'
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPw, setSavingPw] = useState(false);

  const loadOrganizerData = useCallback(async () => {
    try {
      const [evRes, catRes, venRes, smsRes, statusRes, anaRes] = await Promise.all([
        eventsApi.getAll().catch(() => ({ data: [] })),
        categoriesApi.getAll().catch(() => ({ data: [] })),
        venuesApi.getAll().catch(() => ({ data: [] })),
        smsApi.getLogs().catch(() => ({ data: [] })),
        smsApi.getStatus().catch(() => ({ data: null })),
        analyticsApi.get().catch(() => ({ data: null }))
      ]);
      setEvents(evRes.data || []);
      setCategories(catRes.data || []);
      setVenues(venRes.data || []);
      setSmsLogs(smsRes.data || []);
      setSmsStatus(statusRes.data || null);
      setAnalytics(anaRes.data || null);
    } catch (err) {
      toast.error(err.message || 'Failed loading organizer portal');
    }
  }, [toast]);

  useEffect(() => {
    loadOrganizerData();
  }, [loadOrganizerData]);

  const myEvents = events.filter(
    (e) =>
      e.organizerId === user?.id ||
      (user?.name &&
        (String(e.organizerName || '').toLowerCase() === user.name.toLowerCase() ||
          String(e.organizer || '').toLowerCase() === user.name.toLowerCase()))
  );

  const canManageEvent = (evt) =>
    String(user?.role).toLowerCase() === 'admin' ||
    evt.organizerId === user?.id ||
    (user?.name &&
      (String(evt.organizerName || '').toLowerCase() === user.name.toLowerCase() ||
        String(evt.organizer || '').toLowerCase() === user.name.toLowerCase()));

  const scopedEvents = eventScope === 'mine' ? myEvents : events;
  const categoryNames = ['All', ...categories.map((c) => c.name)];
  const filteredEvents =
    filterCategory === 'All'
      ? scopedEvents
      : scopedEvents.filter((e) => e.category === filterCategory);

  const totalMyRegistrations = myEvents.reduce((sum, e) => sum + (e.registrationCount || 0), 0);

  const handleCreateEvent = async (payload) => {
    await eventsApi.create(payload);
    toast.success(`Event "${payload.title}" published!`);
    await loadOrganizerData();
  };

  const handleUpdateEvent = async (payload) => {
    await eventsApi.update(editingEvent.id, payload);
    toast.success(`Event "${payload.title}" updated!`);
    setEditingEvent(null);
    await loadOrganizerData();
  };

  const handleDeleteEvent = async (evt) => {
    const ok = await confirm({
      title: 'Delete Campus Event',
      message: `Are you sure you want to permanently delete "${evt.title}" and its registrations?`,
      confirmText: 'Delete Event',
      danger: true
    });
    if (!ok) return;
    try {
      await eventsApi.delete(evt.id);
      toast.info(`Deleted "${evt.title}".`);
      await loadOrganizerData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const handleOpenForecast = async (evt) => {
    setSelectedPredictEvent(evt);
    setPredictionResult(null);
    setLoadingPred(true);
    try {
      const res = await predictApi.forecast({
        eventId: evt.id,
        eventType: evt.category || 'Academic',
        dayOfWeek: 2,
        timeSlot: evt.timeSlot || 'Afternoon',
        venueCapacity: Number(evt.venueCapacity) || 150,
        registrationCount: Number(evt.registrationCount) || 100,
        pastAttendanceRate: Number(evt.pastAttendanceRate) || 0.8,
        smsPriority: Number(evt.smsPriority) || 2
      });
      setPredictionResult(res);
      await loadOrganizerData();
    } catch (err) {
      toast.error(err.message || 'Prediction failed');
    } finally {
      setLoadingPred(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await usersApi.update(user.id, profileForm);
      if (res?.data) updateCurrentUser(res.data);
      toast.success('Organizer profile updated!');
    } catch (err) {
      toast.error(err.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
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
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSavingPw(false);
    }
  };

  const eventColumns = [
    {
      key: 'title',
      header: 'Event Title',
      render: (r) => (
        <div>
          <div className="font-extrabold text-slate-900">{r.title}</div>
          <div className="text-[11px] text-slate-500">{r.organizer}</div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => <Badge tone="blue">{r.category}</Badge>
    },
    {
      key: 'date',
      header: 'Date & Time',
      render: (r) => (
        <span className="text-slate-700 font-semibold">
          {r.date} • {r.time || r.timeSlot}
        </span>
      )
    },
    {
      key: 'venue',
      header: 'Venue',
      render: (r) => <span className="text-slate-600">{r.venue}</span>
    },
    {
      key: 'registrationCount',
      header: 'RSVPs / Cap',
      render: (r) => (
        <span className="font-bold text-emerald-700">
          {r.registrationCount || 0} / {r.venueCapacity}
        </span>
      )
    },
    {
      key: 'predictedAttendance',
      header: 'ML Turnout',
      render: (r) => (
        <span className="font-extrabold text-purple-700">
          {r.predictedAttendance || Math.round((r.registrationCount || 0) * 0.82)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (evt) => {
        const editable = canManageEvent(evt);
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {editable && (
              <button
                onClick={() => setRosterEvent(evt)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs"
              >
                Roster
              </button>
            )}
            <button
              onClick={() => handleOpenForecast(evt)}
              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs"
            >
              ML Forecast
            </button>
            {editable && (
              <>
                <button
                  onClick={() => setActiveTab('sms')}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs"
                >
                  SMS
                </button>
                <button
                  onClick={() => setEditingEvent(evt)}
                  className="p-1 text-slate-500 hover:text-[#003366]"
                  title="Edit event"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteEvent(evt)}
                  className="p-1 text-slate-400 hover:text-red-600"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#003366] via-blue-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Organizer Portal • Strathmore University
          </div>
          <h1 className="text-2xl md:text-3xl font-black mt-1">{user?.name}</h1>
          <p className="text-xs text-blue-200 mt-1">
            {user?.department || 'Campus Society / Faculty Organizer'} • {user?.email}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Event</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Listed Events"
          value={myEvents.length}
          hint={`Out of ${events.length} total campus events`}
          icon={Calendar}
          tone="blue"
        />
        <StatCard
          label="My Student RSVPs"
          value={totalMyRegistrations}
          hint="Confirmed seats across my events"
          icon={Users}
          tone="green"
        />
        <StatCard
          label="ML Turnout Engine"
          value="Logistic Reg."
          hint="Scikit-Learn • ROC-AUC 0.730"
          icon={Brain}
          tone="purple"
        />
        <StatCard
          label="Priority SMS Dispatches"
          value={smsLogs.length}
          hint={`Gateway: ${smsStatus?.mode || 'SIMULATION'}`}
          icon={MessageSquare}
          tone="amber"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'events', label: `Managed Events (${myEvents.length})` },
          { id: 'sms', label: `Africa's Talking SMS Broadcast (${smsLogs.length})` },
          { id: 'analytics', label: `Turnout Analytics & ML Simulator` },
          { id: 'profile', label: `Organizer Profile & Security` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-[#003366] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#003366] hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-slate-200/70 p-1 rounded-xl flex text-xs font-bold">
                <button
                  onClick={() => setEventScope('mine')}
                  className={`px-3 py-1.5 rounded-lg ${
                    eventScope === 'mine' ? 'bg-[#003366] text-white' : 'text-slate-600'
                  }`}
                >
                  My Listed Events ({myEvents.length})
                </button>
                <button
                  onClick={() => setEventScope('all')}
                  className={`px-3 py-1.5 rounded-lg ${
                    eventScope === 'all' ? 'bg-[#003366] text-white' : 'text-slate-600'
                  }`}
                >
                  All Campus Events ({events.length})
                </button>
              </div>

              <div className="bg-slate-200/70 p-1 rounded-xl flex text-xs font-bold">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg ${
                    viewMode === 'table' ? 'bg-white text-[#003366] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Table View
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg ${
                    viewMode === 'cards' ? 'bg-white text-[#003366] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Cards View
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-200/60 p-1 rounded-xl overflow-x-auto">
              {categoryNames.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    filterCategory === cat
                      ? 'bg-[#003366] text-white shadow-sm'
                      : 'text-slate-700 hover:text-blue-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'table' ? (
            <DataTable
              columns={eventColumns}
              rows={filteredEvents}
              searchKeys={['title', 'category', 'venue', 'organizer', 'date']}
              searchPlaceholder="Search events by title, venue, category..."
              exportFilename="organizer_events.csv"
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredEvents.map((evt) => {
                const editable = canManageEvent(evt);
                const utilPct = Math.round(
                  ((evt.registrationCount || 0) / Math.max(1, evt.venueCapacity || 100)) * 100
                );
                const predictedAttendance =
                  evt.predictedAttendance || Math.round((evt.registrationCount || 0) * 0.82);

                return (
                  <div
                    key={evt.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge tone="blue">{evt.category}</Badge>
                        {editable && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingEvent(evt)}
                              className="p-1.5 text-slate-400 hover:text-[#003366] hover:bg-slate-100 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{evt.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {evt.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-700 pt-1">
                        <span className="flex items-center space-x-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-blue-700" />
                          <span>
                            {evt.date} • {evt.time || evt.timeSlot}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>{evt.venue}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          RSVPs: <strong className="text-blue-950">{evt.registrationCount}</strong>{' '}
                          / {evt.venueCapacity} seats
                        </span>
                        <span className="text-purple-800 font-bold flex items-center space-x-1">
                          <Brain className="w-3.5 h-3.5 mr-1" />
                          ML Forecast: <strong className="ml-1">{predictedAttendance}</strong>
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="bg-[#003366] h-full rounded-full"
                          style={{ width: `${Math.min(utilPct, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => setRosterEvent(evt)}
                        disabled={!editable}
                        className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center justify-center space-x-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Roster</span>
                      </button>

                      <button
                        onClick={() => handleOpenForecast(evt)}
                        className="py-2 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold flex items-center justify-center space-x-1"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>ML Forecast</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('sms')}
                        disabled={!editable}
                        className="py-2 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-900 border border-amber-200 text-xs font-bold flex items-center justify-center space-x-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send SMS</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AFRICA'S TALKING PRIORITY SMS CENTER */}
      {activeTab === 'sms' && (
        <div className="space-y-6">
          <SmsComposer
            events={myEvents.length > 0 ? myEvents : events}
            status={smsStatus}
            user={user}
            onSent={loadOrganizerData}
          />

          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">
              Recent Priority SMS Dispatches ({smsLogs.length})
            </h3>
            <DataTable
              columns={[
                { key: 'eventTitle', header: 'Event' },
                {
                  key: 'priority',
                  header: 'Priority',
                  render: (r) => (
                    <Badge
                      tone={
                        r.priority === 'HIGH' ? 'red' : r.priority === 'MEDIUM' ? 'amber' : 'blue'
                      }
                    >
                      {r.priority}
                    </Badge>
                  )
                },
                { key: 'recipientsCount', header: 'Recipients' },
                { key: 'estimatedCostKes', header: 'Cost (KES)' },
                { key: 'mode', header: 'Gateway Mode' },
                { key: 'message', header: 'Message' },
                {
                  key: 'sentAt',
                  header: 'Sent At',
                  render: (r) => (r.sentAt || '').replace('T', ' ').slice(0, 16)
                }
              ]}
              rows={smsLogs}
              searchKeys={['eventTitle', 'message', 'priority', 'mode']}
              exportFilename="organizer_sms_logs.csv"
            />
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & ML INSIGHTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <MlSimulatorAndTrainingPanel events={myEvents.length > 0 ? myEvents : events} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#003366]" />
                  <span>Category Registration & Turnout Breakdown</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time aggregation across campus categories
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(analytics?.categoryBreakdown || []).map((c) => (
                <div
                  key={c.category}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-extrabold text-slate-900">{c.category}</div>
                    <div className="text-[11px] text-slate-500">{c.events} listed events</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[#003366]">{c.registrations} RSVPs</div>
                    <div className="text-[11px] text-purple-700 font-bold">
                      ML Predicted: {c.predicted}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xs">
            <h3 className="text-base font-extrabold text-slate-900">
              Top Events by Confirmed Attendance
            </h3>
            <div className="space-y-3">
              {(analytics?.topEvents || myEvents.slice(0, 5)).map((e) => (
                <div
                  key={e.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-extrabold text-slate-900">{e.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {e.category} • Cap {e.venueCapacity}
                    </div>
                  </div>
                  <Badge tone="green">{e.registrationCount} RSVPs</Badge>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* TAB 4: ORGANIZER PROFILE & SECURITY */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-2xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Organizer / Society Profile
              </h3>
              <p className="text-xs text-slate-500">
                Update your official organizer display name, faculty/department, and mobile contact.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Organizer / Society Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Faculty / Department
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Kenyan Mobile Phone (+2547...)
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving...' : 'Save Organizer Profile'}</span>
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-2xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#003366]" />
                <span>Change Organizer Password</span>
              </h3>
              <p className="text-xs text-slate-500">
                Minimum 8 characters with both letters and numbers.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
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
                  New Password
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
                <span>{savingPw ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Event Creation / Edit Modals */}
      <EventFormModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
        categories={categories}
        venues={venues}
      />

      <EventFormModal
        open={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        initialEvent={editingEvent}
        onSubmit={handleUpdateEvent}
        categories={categories}
        venues={venues}
      />

      {/* Attendee Roster & Check-In Modal */}
      <AttendeeRosterModal
        isOpen={Boolean(rosterEvent)}
        onClose={() => setRosterEvent(null)}
        event={rosterEvent}
        onRosterChanged={loadOrganizerData}
      />

      {/* ML Predictor Detailed Report Modal */}
      <Modal
        open={Boolean(selectedPredictEvent)}
        onClose={() => setSelectedPredictEvent(null)}
        title="Scikit-Learn Logistic Regression Turnout Forecast"
        maxWidth="max-w-md"
      >
        {loadingPred ? (
          <div className="py-8 text-center text-xs font-bold text-slate-500">
            Running Logistic Regression pipeline inference...
          </div>
        ) : predictionResult && selectedPredictEvent ? (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-blue-950">
              {selectedPredictEvent.title}
            </h3>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Forecasted Attendance:</span>
                <span className="text-lg font-black text-[#003366]">
                  {predictionResult.predictedAttendance} / {predictionResult.venueCapacity} Seats
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Show-Up Probability:</span>
                <span className="text-sm font-bold text-blue-700">
                  {Math.round((predictionResult.predictedTurnoutRate || 0.8) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Venue Utilization:</span>
                <span className="text-sm font-bold text-emerald-700">
                  {predictionResult.capacityUtilization}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Priority SMS Lift:</span>
                <span className="text-sm font-bold text-amber-700">
                  +{predictionResult.smsImpactBoostPct}% Turnout
                </span>
              </div>
            </div>
            <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium leading-relaxed">
              {predictionResult.recommendation}
            </p>
            <button
              onClick={() => setSelectedPredictEvent(null)}
              className="w-full py-2.5 rounded-xl bg-[#003366] text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
