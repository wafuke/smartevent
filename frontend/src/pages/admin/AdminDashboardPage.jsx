import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, Calendar, ClipboardList, Tag, MapPin, MessageSquare, Award, Database, Plus, Edit3, Trash2,
  RefreshCw, ShieldCheck, Ban, CheckCircle2, ExternalLink, Brain, Activity, GraduationCap, Building2, Crown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminApi, eventsApi, categoriesApi, registrationsApi, venuesApi, smsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EventFormModal from '../../components/EventFormModal';
import SmsComposer from '../../components/SmsComposer';
import {
  Badge, StatCard, DataTable, Modal, Field, inputCls, PrimaryButton, Spinner, EmptyState, useToast, useConfirm,
  fmtDate, fmtDateTime, timeAgo
} from '../../components/ui';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'registrations', label: 'Registrations', icon: ClipboardList },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'venues', label: 'Venues', icon: MapPin },
  { id: 'sms', label: 'SMS Gateway', icon: MessageSquare },
  { id: 'profiles', label: 'Role Profiles', icon: Award }
];

const CONSOLE_URL = import.meta.env.VITE_CONSOLE_URL || `${window.location.protocol}//${window.location.hostname}:5000/`;
const PIE_COLORS = ['#dc2626', '#f59e0b', '#0284c7'];
const BLANK_USER = { name: '', email: '', password: '', role: 'student', studentId: '', phone: '', department: 'School of Computing & Engineering Sciences', status: 'Active' };

export default function AdminDashboardPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();

  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [ov, v] = await Promise.all([adminApi.getOverview(), venuesApi.getAll()]);
      setData(ov.data);
      setVenues(v.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMessage) => {
    try {
      await fn();
      if (okMessage) toast.success(okMessage);
      await load(true);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  if (loading) return <Spinner label="Loading administration console..." />;
  if (error || !data) {
    return (
      <EmptyState
        title="Could not load the admin console"
        message={error || 'Unknown error'}
        action={<PrimaryButton onClick={() => load()}>Try again</PrimaryButton>}
      />
    );
  }

  const ctx = { data, venues, run, toast, confirm, reload: () => load(true), user };

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#002244] to-slate-900 text-white p-5 sm:p-7 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Administration console
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="text-xs text-slate-300 mt-1">
            {data.summary.totals.users} users - {data.summary.totals.events} events - {data.summary.totals.registrations} registrations - {data.summary.sms.totalSent} SMS sent
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={CONSOLE_URL} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5">
            <Database className="w-4 h-4" /> Database tables <ExternalLink className="w-3 h-3" />
          </a>
          <button onClick={() => load(true)} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar / mobile tabs */}
        <nav className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0 lg:sticky lg:top-24">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-colors ${
                  tab === id ? 'bg-[#003366] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </nav>

        <section className="flex-1 min-w-0">
          {tab === 'overview' && <Overview {...ctx} />}
          {tab === 'users' && <UsersTab {...ctx} />}
          {tab === 'events' && <EventsTab {...ctx} />}
          {tab === 'registrations' && <RegistrationsTab {...ctx} />}
          {tab === 'categories' && <CategoriesTab {...ctx} />}
          {tab === 'venues' && <VenuesTab {...ctx} />}
          {tab === 'sms' && <SmsTab {...ctx} />}
          {tab === 'profiles' && <ProfilesTab {...ctx} />}
        </section>
      </div>
    </div>
  );
}

/* ================================================================ OVERVIEW */
function Overview({ data }) {
  const { totals, categoryBreakdown, topEvents, sms, model, capacityUtilizationPct } = data.summary;
  const smsPie = [
    { name: 'High', value: sms.highPriority },
    { name: 'Medium', value: sms.mediumPriority },
    { name: 'Low', value: sms.lowPriority }
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total users" value={totals.users} icon={Users} hint={`${totals.suspended} suspended`} />
        <StatCard label="Students" value={totals.students} icon={GraduationCap} tone="green" />
        <StatCard label="Organizers" value={totals.organizers} icon={Building2} tone="amber" />
        <StatCard label="Admins" value={totals.admins} icon={Crown} tone="purple" />
        <StatCard label="Events" value={totals.events} icon={Calendar} hint={`${totals.upcomingEvents} upcoming`} />
        <StatCard label="Registrations" value={totals.registrations} icon={ClipboardList} tone="green" hint={`${capacityUtilizationPct}% of seat capacity booked`} />
        <StatCard label="Categories" value={totals.categories} icon={Tag} tone="amber" hint={`${totals.venues} venues`} />
        <StatCard label="SMS delivered" value={`${sms.deliveryRate}%`} icon={MessageSquare} tone="purple" hint={`${sms.totalSent} sent - ${sms.failed} failed`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-1">Registrations by category</h3>
          <p className="text-xs text-slate-500 mb-3">Seats booked versus total capacity</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown} margin={{ left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="registrations" name="Registered" fill="#003366" radius={[6, 6, 0, 0]} />
                <Bar dataKey="capacity" name="Capacity" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-1">SMS by priority</h3>
          <p className="text-xs text-slate-500 mb-3">Africa's Talking dispatches</p>
          {smsPie.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={smsPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {smsPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No SMS sent yet" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-3">Most popular events</h3>
          <div className="space-y-3">
            {topEvents.map((e) => {
              const pct = Math.min(100, Math.round((e.registrations / e.capacity) * 100));
              return (
                <div key={e.id}>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span className="truncate pr-3">{e.title}</span>
                    <span>{e.registrations}/{e.capacity}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-[#003366]'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-indigo-600" /> Prediction model</h3>
          {model ? (
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-slate-500 font-bold">Algorithm</dt><dd className="font-black text-slate-900">{model.algorithm}</dd></div>
              <div><dt className="text-slate-500 font-bold">ROC-AUC</dt><dd className="font-black text-slate-900">{model.rocAuc}</dd></div>
              <div><dt className="text-slate-500 font-bold">Student-level accuracy</dt><dd className="font-black text-slate-900">{Math.round(model.accuracy * 1000) / 10}%</dd></div>
              <div><dt className="text-slate-500 font-bold">Event headcount MAE</dt><dd className="font-black text-slate-900">{model.eventMae} students ({model.eventMapePct}% MAPE)</dd></div>
              <div><dt className="text-slate-500 font-bold">Trained</dt><dd className="font-black text-slate-900">{fmtDate(model.trainedAt)}</dd></div>
              <div><dt className="text-slate-500 font-bold">Held-out test events</dt><dd className="font-black text-slate-900">{model.testEvents}</dd></div>
            </dl>
          ) : (
            <EmptyState title="Model metadata not found" message="Run the ML training pipeline to generate it." />
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /> Recent activity</h3>
        {data.recentActivity.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recentActivity.map((a) => (
              <li key={a.id} className="py-2.5 flex items-start gap-3 text-xs">
                <Badge>{a.type.replace(/_/g, ' ')}</Badge>
                <span className="flex-1 text-slate-700 font-medium">{a.detail}</span>
                <span className="text-slate-400 font-semibold whitespace-nowrap">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* =================================================================== USERS */
function UsersTab({ data, run, confirm, user: me }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null | 'new' | user
  const [form, setForm] = useState(BLANK_USER);
  const [saving, setSaving] = useState(false);

  const rows = useMemo(
    () =>
      data.users.filter(
        (u) => (roleFilter === 'all' || u.role === roleFilter) && (statusFilter === 'all' || (u.status || 'Active') === statusFilter)
      ),
    [data.users, roleFilter, statusFilter]
  );

  const open = (u) => {
    setEditing(u || 'new');
    setForm(u ? { ...BLANK_USER, ...u, password: '' } : BLANK_USER);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const isNew = editing === 'new';
    const body = { ...form };
    if (!isNew && !body.password) delete body.password;
    const ok = await run(
      () => (isNew ? adminApi.createUser(body) : adminApi.updateUser(editing.id, body)),
      isNew ? 'User created.' : 'User updated.'
    );
    setSaving(false);
    if (ok) setEditing(null);
  };

  const toggleStatus = async (u) => {
    const suspend = (u.status || 'Active') === 'Active';
    if (suspend && !(await confirm({ title: `Suspend ${u.name}?`, message: 'They will be signed out and unable to log in until reactivated.', confirmLabel: 'Suspend' }))) return;
    run(() => adminApi.updateUser(u.id, { status: suspend ? 'Suspended' : 'Active' }), suspend ? 'Account suspended.' : 'Account reactivated.');
  };

  const remove = async (u) => {
    if (!(await confirm({ title: `Delete ${u.name}?`, message: 'This permanently removes the account together with their registrations, saved events and notifications.', confirmLabel: 'Delete user' }))) return;
    run(() => adminApi.deleteUser(u.id), 'User deleted.');
  };

  const columns = [
    {
      key: 'name', label: 'User',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#003366] text-amber-300 flex items-center justify-center font-black text-xs shrink-0">{u.name.charAt(0)}</div>
          <div className="min-w-0"><div className="font-extrabold text-slate-900 truncate">{u.name}</div><div className="text-[11px] text-slate-500 truncate">{u.email}</div></div>
        </div>
      )
    },
    { key: 'role', label: 'Role', render: (u) => <Badge kind={u.role}>{u.role}</Badge> },
    { key: 'code', label: 'ID / code', sortValue: (u) => u.studentId || u.organizerCode || u.staffId || '', render: (u) => u.studentId || u.organizerCode || u.staffId || '-' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (u) => <Badge>{u.status || 'Active'}</Badge> },
    { key: 'createdAt', label: 'Created', render: (u) => fmtDate(u.createdAt) },
    {
      key: 'actions', label: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-1">
          <button title="Edit" onClick={() => open(u)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#003366]"><Edit3 className="w-4 h-4" /></button>
          {u.id !== me.id && (
            <>
              <button title={(u.status || 'Active') === 'Active' ? 'Suspend' : 'Reactivate'} onClick={() => toggleStatus(u)} className="p-1.5 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600">
                {(u.status || 'Active') === 'Active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </button>
              <button title="Delete" onClick={() => remove(u)} className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <Header title="User management" subtitle={`${rows.length} of ${data.users.length} accounts`} action={<PrimaryButton onClick={() => open(null)}><Plus className="w-4 h-4" /> Add user</PrimaryButton>} />
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search name, email, ID..."
        searchText={(u) => `${u.name} ${u.email} ${u.studentId || ''} ${u.organizerCode || ''} ${u.staffId || ''} ${u.department || ''}`}
        toolbar={
          <>
            <select className={`${inputCls} !w-auto`} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All roles</option><option value="student">Students</option><option value="organizer">Organizers</option><option value="admin">Admins</option>
            </select>
            <select className={`${inputCls} !w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Any status</option><option value="Active">Active</option><option value="Suspended">Suspended</option>
            </select>
          </>
        }
      />

      {editing && (
        <Modal title={editing === 'new' ? 'Add user' : `Edit ${editing.name}`} subtitle="Passwords are stored as bcrypt hashes" icon={Users} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name"><input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Email"><input required type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Role">
                <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option><option value="organizer">Event organizer</option><option value="admin">Administrator</option>
                </select>
              </Field>
              <Field label="Status">
                <select className={inputCls} value={form.status || 'Active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option>Active</option><option>Suspended</option>
                </select>
              </Field>
              {form.role === 'student' && (
                <Field label="Admission number"><input required={editing === 'new'} pattern="\d{5,8}" title="5-8 digits" className={inputCls} value={form.studentId || ''} onChange={(e) => setForm({ ...form, studentId: e.target.value })} /></Field>
              )}
              <Field label="Mobile (SMS)" hint="e.g. 0712345678"><input required={editing === 'new'} className={inputCls} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Department" className={form.role === 'student' ? '' : 'sm:col-span-2'}><input className={inputCls} value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
              <Field label={editing === 'new' ? 'Password' : 'New password (optional)'} hint="Min 8 characters with a letter and a number." className="sm:col-span-2">
                <input required={editing === 'new'} type="password" autoComplete="new-password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <PrimaryButton type="submit" loading={saving}>{editing === 'new' ? 'Create user' : 'Save changes'}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================== EVENTS */
function EventsTab({ data, run, confirm }) {
  const [formFor, setFormFor] = useState(null); // null | 'new' | event
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const organizers = useMemo(() => data.users.filter((u) => u.role === 'organizer'), [data.users]);

  const rows = data.events.filter((e) => (catFilter === 'all' || e.category === catFilter) && (statusFilter === 'all' || e.status === statusFilter));
  const orgName = (e) => data.users.find((u) => u.id === e.organizerId)?.name || e.organizerName || '-';

  const remove = async (e) => {
    if (!(await confirm({ title: `Delete "${e.title}"?`, message: `All ${e.registrationCount || 0} registrations will be removed and registered students notified.`, confirmLabel: 'Delete event' }))) return;
    run(() => eventsApi.delete(e.id), 'Event deleted.');
  };

  const columns = [
    { key: 'title', label: 'Event', render: (e) => (<div><div className="font-extrabold text-slate-900">{e.title}</div><div className="text-[11px] text-slate-500">{e.venue}</div></div>) },
    { key: 'organizer', label: 'Organizer', sortValue: orgName, render: orgName },
    { key: 'category', label: 'Category' },
    { key: 'date', label: 'Date', render: (e) => fmtDate(e.date) },
    { key: 'registrationCount', label: 'Seats', sortValue: (e) => e.registrationCount || 0, render: (e) => `${e.registrationCount || 0} / ${e.venueCapacity}` },
    { key: 'status', label: 'Status', render: (e) => <Badge>{e.status || 'Upcoming'}</Badge> },
    {
      key: 'actions', label: 'Actions',
      render: (e) => (
        <div className="flex gap-1">
          <button title="Edit" onClick={() => setFormFor(e)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#003366]"><Edit3 className="w-4 h-4" /></button>
          <button title="Delete" onClick={() => remove(e)} className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <Header title="Event management" subtitle={`${rows.length} of ${data.events.length} events`} action={<PrimaryButton onClick={() => setFormFor('new')}><Plus className="w-4 h-4" /> New event</PrimaryButton>} />
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search events, venues, organizers..."
        searchText={(e) => `${e.title} ${e.venue} ${e.category} ${orgName(e)}`}
        toolbar={
          <>
            <select className={`${inputCls} !w-auto`} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="all">All categories</option>
              {data.categories.map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
            <select className={`${inputCls} !w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Any status</option>
              {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </>
        }
      />
      <EventFormModal
        isOpen={Boolean(formFor)}
        event={formFor && formFor !== 'new' ? formFor : null}
        isAdmin
        organizers={organizers}
        onClose={() => setFormFor(null)}
        onSubmit={async (payload, existing) => {
          const ok = await run(() => (existing ? eventsApi.update(existing.id, payload) : eventsApi.create(payload)), existing ? 'Event updated.' : 'Event created.');
          if (!ok) throw new Error('Save failed - see the message above.');
        }}
      />
    </div>
  );
}

/* ============================================================ REGISTRATIONS */
function RegistrationsTab({ data, run, confirm }) {
  const [eventFilter, setEventFilter] = useState('all');
  const rows = data.registrations.filter((r) => eventFilter === 'all' || r.eventId === eventFilter);

  const cancel = async (r) => {
    if (!(await confirm({ title: 'Cancel registration?', message: `${r.studentName} will be removed from "${r.eventTitle || r.eventId}" and notified.`, confirmLabel: 'Cancel registration' }))) return;
    run(() => registrationsApi.cancel(r.id), 'Registration cancelled.');
  };

  const columns = [
    { key: 'studentName', label: 'Student', render: (r) => (<div><div className="font-extrabold text-slate-900">{r.studentName}</div><div className="text-[11px] text-slate-500">{r.studentId}</div></div>) },
    { key: 'eventTitle', label: 'Event', render: (r) => r.eventTitle || r.eventId },
    { key: 'phone', label: 'Phone' },
    { key: 'registeredAt', label: 'Registered', render: (r) => fmtDateTime(r.registeredAt) },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status || 'Confirmed'}</Badge> },
    { key: 'actions', label: 'Actions', render: (r) => (<button title="Cancel registration" onClick={() => cancel(r)} className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>) }
  ];

  return (
    <div className="space-y-4">
      <Header title="Registrations" subtitle={`${rows.length} of ${data.registrations.length} records`} />
      <DataTable
        columns={columns}
        rows={rows}
        searchPlaceholder="Search student, ID, event..."
        searchText={(r) => `${r.studentName} ${r.studentId} ${r.eventTitle} ${r.phone}`}
        toolbar={
          <select className={`${inputCls} !w-auto max-w-[260px]`} value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
            <option value="all">All events</option>
            {data.events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        }
      />
    </div>
  );
}

/* =============================================================== CATEGORIES */
function CategoriesTab({ data, run, confirm }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const open = (c) => {
    setEditing(c || 'new');
    setForm(c ? { name: c.name, description: c.description || '' } : { name: '', description: '' });
  };
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const ok = await run(() => (editing === 'new' ? categoriesApi.create(form) : categoriesApi.update(editing.id, form)), editing === 'new' ? 'Category created.' : 'Category updated.');
    setSaving(false);
    if (ok) setEditing(null);
  };
  const remove = async (c) => {
    if (!(await confirm({ title: `Delete "${c.name}"?`, message: 'Categories that still have events cannot be deleted.', confirmLabel: 'Delete' }))) return;
    run(() => categoriesApi.delete(c.id), 'Category deleted.');
  };

  const columns = [
    { key: 'name', label: 'Category', render: (c) => <span className="font-extrabold text-slate-900">{c.name}</span> },
    { key: 'description', label: 'Description' },
    { key: 'count', label: 'Events', sortValue: (c) => c.count || 0 },
    {
      key: 'actions', label: 'Actions',
      render: (c) => (
        <div className="flex gap-1">
          <button onClick={() => open(c)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#003366]"><Edit3 className="w-4 h-4" /></button>
          <button onClick={() => remove(c)} className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <Header title="Event categories" subtitle="Organizers choose from these when listing events" action={<PrimaryButton onClick={() => open(null)}><Plus className="w-4 h-4" /> Add category</PrimaryButton>} />
      <DataTable columns={columns} rows={data.categories} searchText={(c) => `${c.name} ${c.description}`} searchPlaceholder="Search categories..." />
      {editing && (
        <Modal title={editing === 'new' ? 'Add category' : 'Edit category'} icon={Tag} size="sm" onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Name"><input required minLength={2} maxLength={40} className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Description"><textarea rows="2" maxLength={200} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button><PrimaryButton type="submit" loading={saving}>Save</PrimaryButton></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================== VENUES */
function VenuesTab({ venues, data, run, confirm }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', building: '', capacity: 100, hasProjector: true, hasPA: true });
  const [saving, setSaving] = useState(false);

  const open = (v) => {
    setEditing(v || 'new');
    setForm(v ? { ...v } : { name: '', building: '', capacity: 100, hasProjector: true, hasPA: true });
  };
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = { name: form.name, building: form.building, capacity: Number(form.capacity), hasProjector: form.hasProjector, hasPA: form.hasPA };
    const ok = await run(() => (editing === 'new' ? venuesApi.create(body) : venuesApi.update(editing.id, body)), 'Venue saved.');
    setSaving(false);
    if (ok) setEditing(null);
  };
  const remove = async (v) => {
    if (!(await confirm({ title: `Delete ${v.name}?`, message: 'Venues that host events cannot be deleted.', confirmLabel: 'Delete' }))) return;
    run(() => venuesApi.delete(v.id), 'Venue deleted.');
  };

  const columns = [
    { key: 'name', label: 'Venue', render: (v) => <span className="font-extrabold text-slate-900">{v.name}</span> },
    { key: 'building', label: 'Building' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'hasProjector', label: 'Projector', render: (v) => (v.hasProjector ? 'Yes' : 'No') },
    { key: 'hasPA', label: 'PA system', render: (v) => (v.hasPA ? 'Yes' : 'No') },
    { key: 'events', label: 'Events', sortValue: (v) => data.events.filter((e) => e.venue === v.name).length, render: (v) => data.events.filter((e) => e.venue === v.name).length },
    {
      key: 'actions', label: 'Actions',
      render: (v) => (
        <div className="flex gap-1">
          <button onClick={() => open(v)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#003366]"><Edit3 className="w-4 h-4" /></button>
          <button onClick={() => remove(v)} className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <Header title="Campus venues" subtitle="Used for capacity planning in the event form" action={<PrimaryButton onClick={() => open(null)}><Plus className="w-4 h-4" /> Add venue</PrimaryButton>} />
      <DataTable columns={columns} rows={venues} searchText={(v) => `${v.name} ${v.building}`} searchPlaceholder="Search venues..." />
      {editing && (
        <Modal title={editing === 'new' ? 'Add venue' : 'Edit venue'} icon={MapPin} size="sm" onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Name"><input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Building"><input className={inputCls} value={form.building || ''} onChange={(e) => setForm({ ...form, building: e.target.value })} /></Field>
            <Field label="Capacity"><input required type="number" min="1" className={inputCls} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
            <div className="flex gap-5 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.hasProjector)} onChange={(e) => setForm({ ...form, hasProjector: e.target.checked })} /> Projector</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.hasPA)} onChange={(e) => setForm({ ...form, hasPA: e.target.checked })} /> PA system</label>
            </div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button><PrimaryButton type="submit" loading={saving}>Save</PrimaryButton></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ===================================================================== SMS */
function SmsTab({ data, reload }) {
  const [logs, setLogs] = useState(data.tables.smsLogs || []);
  const [priority, setPriority] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const refreshLogs = useCallback(() => smsApi.getLogs().then((r) => setLogs(r.data || [])).catch(() => {}), []);
  useEffect(() => { refreshLogs(); }, [refreshLogs]);

  const rows = logs.filter(
    (l) => (priority === 'ALL' || String(l.priority).toUpperCase() === priority) && (statusFilter === 'ALL' || String(l.status).toUpperCase().startsWith(statusFilter))
  );

  const columns = [
    { key: 'priority', label: 'Priority', render: (l) => <Badge>{l.priority}</Badge> },
    { key: 'eventTitle', label: 'Event', render: (l) => <span className="font-bold text-slate-800">{l.eventTitle}</span> },
    { key: 'recipient', label: 'Recipient', render: (l) => l.recipientName ? (<div><div className="font-bold text-slate-800">{l.recipientName}</div><div className="text-[11px] text-slate-500">{l.recipient}</div></div>) : (l.recipient || `${l.recipientCount || 0} recipients`) },
    { key: 'message', label: 'Message', sortable: false, className: 'max-w-xs', render: (l) => <span className="line-clamp-2 text-slate-600">{l.message}</span> },
    { key: 'status', label: 'Status', render: (l) => (<div><Badge kind={String(l.status).split(' ')[0]}>{String(l.status).split(' ')[0]}</Badge>{l.failureReason && <div className="text-[10px] text-red-600 mt-1 max-w-[180px]">{l.failureReason}</div>}</div>) },
    { key: 'sentAt', label: 'Sent', render: (l) => fmtDateTime(l.sentAt) }
  ];

  return (
    <div className="space-y-6">
      <Header title="Africa's Talking SMS gateway" subtitle="Broadcast priority alerts and review delivery history" />
      <SmsComposer events={data.events} role="admin" onSent={() => { refreshLogs(); reload(); }} />
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-900">Delivery log ({rows.length})</h3>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="id"
          searchText={(l) => `${l.eventTitle} ${l.recipient} ${l.recipientName} ${l.message}`}
          searchPlaceholder="Search messages, numbers..."
          toolbar={
            <>
              <select className={`${inputCls} !w-auto`} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="ALL">All priorities</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option>
              </select>
              <select className={`${inputCls} !w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">Any status</option><option>DELIVERED</option><option>SENT</option><option>SIMULATED</option><option>FAILED</option>
              </select>
            </>
          }
        />
      </div>
    </div>
  );
}

/* ================================================================= PROFILES */
function ProfilesTab({ data }) {
  const [sub, setSub] = useState('organizer_profiles');
  const t = data.tables;
  const defs = {
    organizer_profiles: {
      label: 'Organizers',
      rows: t.organizer_profiles,
      columns: [
        { key: 'organizerCode', label: 'Code' }, { key: 'name', label: 'Organizer', render: (r) => <span className="font-extrabold text-slate-900">{r.name}</span> },
        { key: 'department', label: 'Department' }, { key: 'officeLocation', label: 'Office' },
        { key: 'verified', label: 'Verified', render: (r) => <Badge kind={r.verified ? 'active' : 'medium'}>{r.verified ? 'Verified' : 'Pending'}</Badge> },
        { key: 'events', label: 'Events listed', sortValue: (r) => data.events.filter((e) => e.organizerId === r.userId).length, render: (r) => data.events.filter((e) => e.organizerId === r.userId).length }
      ]
    },
    student_profiles: {
      label: 'Students',
      rows: t.student_profiles,
      columns: [
        { key: 'studentId', label: 'Adm. no' }, { key: 'name', label: 'Student', render: (r) => <span className="font-extrabold text-slate-900">{r.name}</span> },
        { key: 'program', label: 'Programme' }, { key: 'faculty', label: 'Faculty' }, { key: 'yearOfStudy', label: 'Year' },
        { key: 'pastAttendanceRate', label: 'Past attendance', render: (r) => `${Math.round((r.pastAttendanceRate || 0) * 100)}%` }
      ]
    },
    admin_profiles: {
      label: 'Admins',
      rows: t.admin_profiles,
      columns: [
        { key: 'staffId', label: 'Staff ID' }, { key: 'name', label: 'Administrator', render: (r) => <span className="font-extrabold text-slate-900">{r.name}</span> },
        { key: 'title', label: 'Title' }, { key: 'department', label: 'Department' }, { key: 'clearanceLevel', label: 'Clearance' }
      ]
    }
  };
  const cur = defs[sub];
  return (
    <div className="space-y-4">
      <Header title="Role profiles" subtitle="Extended records linked to each user account" />
      <div className="flex gap-2">
        {Object.entries(defs).map(([k, d]) => (
          <button key={k} onClick={() => setSub(k)} className={`px-3.5 py-2 rounded-xl text-xs font-extrabold ${sub === k ? 'bg-[#003366] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {d.label} ({d.rows.length})
          </button>
        ))}
      </div>
      <DataTable columns={cur.columns} rows={cur.rows} searchText={(r) => Object.values(r).join(' ')} searchPlaceholder={`Search ${cur.label.toLowerCase()}...`} />
    </div>
  );
}

function Header({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
