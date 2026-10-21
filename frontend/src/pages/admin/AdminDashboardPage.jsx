import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Tag,
  ShieldCheck,
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  MessageSquare,
  Send,
  Database,
  ExternalLink
} from 'lucide-react';
import { adminApi, eventsApi, categoriesApi, registrationsApi, smsApi } from '../../services/api';
import EventCreationModal from '../../components/EventCreationModal';
import EventEditModal from '../../components/EventEditModal';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('users'); // 'overview', 'users', 'profiles', 'events', 'registrations', 'categories', 'sms'
  const [metrics, setMetrics] = useState({});
  const [profileTables, setProfileTables] = useState({
    admin_profiles: [],
    organizer_profiles: [],
    student_profiles: [],
    venues: []
  });
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // User Create/Edit Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'student',
    studentId: '',
    phone: '+254712345678',
    department: 'School of Computing & Engineering Sciences',
    status: 'Active'
  });

  // Event Create/Edit Modal
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Category Create/Edit Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', icon: 'Tag' });

  // Africa's Talking Priority SMS Form
  const [smsForm, setSmsForm] = useState({
    eventId: 'evt-101',
    priority: 'HIGH',
    recipients: '',
    broadcastToEventRoster: true,
    message: 'Venue reminder: Please arrive 15 minutes early and carry your Strathmore Student ID.'
  });
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes, eventsRes, catsRes, regsRes, smsRes] = await Promise.all([
        adminApi.getOverview().catch(() => ({ data: { metrics: {}, tables: {} } })),
        adminApi.getUsers().catch(() => ({ data: [] })),
        eventsApi.getAll().catch(() => ({ data: [] })),
        categoriesApi.getAll().catch(() => ({ data: [] })),
        registrationsApi.getAll().catch(() => ({ data: [] })),
        smsApi.getLogs().catch(() => ({ data: [] }))
      ]);

      setMetrics(overviewRes.data?.metrics || {});
      setProfileTables(overviewRes.data?.tables || {
        admin_profiles: [],
        organizer_profiles: [],
        student_profiles: [],
        venues: []
      });
      setUsers(usersRes.data || []);
      setEvents(eventsRes.data || []);
      setCategories(catsRes.data || []);
      setRegistrations(regsRes.data || []);
      setSmsLogs(smsRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ================= USER CRUD =================
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      password: 'password123',
      role: 'student',
      studentId: '',
      phone: '+254712345678',
      department: 'BSc Informatics & Computer Science',
      status: 'Active'
    });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (u) => {
    setEditingUser(u);
    setUserForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'student',
      studentId: u.studentId || '',
      phone: u.phone || '+254712345678',
      department: u.department || 'Strathmore University',
      status: u.status || 'Active'
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, userForm);
      } else {
        await adminApi.createUser(userForm);
      }
      setIsUserModalOpen(false);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"?`)) return;
    try {
      await adminApi.deleteUser(userId);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // ================= EVENT CRUD =================
  const handleCreateEvent = async (newEvt) => {
    try {
      await eventsApi.create(newEvt);
      setIsCreateEventOpen(false);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (updatedEvt) => {
    try {
      await eventsApi.update(updatedEvt.id, updatedEvt);
      setEditingEvent(null);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to delete event "${title}"?`)) return;
    try {
      await eventsApi.delete(eventId);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    }
  };

  // ================= REGISTRATION CRUD =================
  const handleCancelRegistration = async (regId, studentName) => {
    if (!window.confirm(`Cancel RSVP registration for "${studentName}"?`)) return;
    try {
      await registrationsApi.cancel(regId);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to cancel registration');
    }
  };

  // ================= CATEGORY CRUD =================
  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCatForm({ name: '', description: '', icon: 'Tag' });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCatForm({ name: cat.name, description: cat.description || '', icon: cat.icon || 'Tag' });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, catForm);
      } else {
        await categoriesApi.create(catForm);
      }
      setIsCategoryModalOpen(false);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      await categoriesApi.delete(catId);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  // ================= AFRICA'S TALKING SMS DISPATCH =================
  const handleDispatchSms = async (e) => {
    e.preventDefault();
    setSendingSms(true);
    try {
      const targetEvent = events.find((ev) => ev.id === smsForm.eventId);
      const res = await smsApi.send({
        eventId: smsForm.eventId,
        eventTitle: targetEvent ? targetEvent.title : 'Campus Alert',
        priority: smsForm.priority,
        broadcastToEventRoster: smsForm.broadcastToEventRoster,
        recipients: smsForm.recipients
          ? smsForm.recipients.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        message: smsForm.message
      });
      alert(res.message || 'Priority SMS dispatched via Africa\'s Talking Gateway!');
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'SMS dispatch failed');
    } finally {
      setSendingSms(false);
    }
  };

  // Filtered Lists
  const q = searchQuery.toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesSearch =
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.studentId && u.studentId.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  const filteredEvents = events.filter(
    (e) =>
      (e.title || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.venue || '').toLowerCase().includes(q) ||
      (e.organizer || '').toLowerCase().includes(q)
  );

  const filteredRegistrations = registrations.filter(
    (r) =>
      (r.studentName || '').toLowerCase().includes(q) ||
      (r.studentId || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.eventTitle || r.eventId || '').toLowerCase().includes(q)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Admin Control Center Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#002244] to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Administrative Control Center & Relational Database Tables</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">System Administration & Table Explorer</h1>
          <p className="text-xs text-slate-300">
            Full CRUD management for Users (2 Admins, 4 Organizers, 6 Students), Events, Registrations, Categories, and Africa's Talking Priority SMS.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href="http://localhost:5000"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center space-x-1.5 shadow-sm"
          >
            <Database className="w-4 h-4" />
            <span>Backend DB Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={loadAdminData}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-2 border border-white/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Users</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{users.length}</span>
          <span className="text-[11px] text-blue-700 font-semibold mt-0.5 block">
            {users.filter((u) => u.role === 'admin').length} Admins • {users.filter((u) => u.role === 'organizer').length} Org • {users.filter((u) => u.role === 'student').length} Stud
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Campus Events</span>
          <span className="text-2xl font-extrabold text-[#003366] mt-1 block">{events.length}</span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">{metrics?.capacityUtilization || '76%'} Avg Fill</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Registrations</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{registrations.length}</span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Confirmed RSVPs</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Categories</span>
          <span className="text-2xl font-extrabold text-amber-700 mt-1 block">{categories.length}</span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">{profileTables.venues?.length || 6} Venues</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Priority SMS</span>
          <span className="text-2xl font-extrabold text-purple-700 mt-1 block">{smsLogs.length}</span>
          <span className="text-[11px] text-purple-600 font-semibold mt-0.5 block">Africa's Talking API</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'users', label: `Users Table (${users.length})` },
          { id: 'profiles', label: `Role Profiles & Venues Tables` },
          { id: 'events', label: `Events Table (${events.length})` },
          { id: 'registrations', label: `Registrations Table (${registrations.length})` },
          { id: 'categories', label: `Categories Table (${categories.length})` },
          { id: 'sms', label: `Africa's Talking SMS Table (${smsLogs.length})` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === t.id ? 'bg-[#003366] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: USERS TABLE */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Table: <code>users</code> (All System Accounts)</h3>
              <p className="text-xs text-slate-500">Create, view, edit, or remove Student, Event Organizer, and Administrator accounts.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              >
                <option value="All">All Roles ({users.length})</option>
                <option value="admin">Admins ({users.filter((u) => u.role === 'admin').length})</option>
                <option value="organizer">Organizers ({users.filter((u) => u.role === 'organizer').length})</option>
                <option value="student">Students ({users.filter((u) => u.role === 'student').length})</option>
              </select>

              <button
                onClick={openCreateUserModal}
                className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">ID / Code</th>
                  <th className="p-3.5">Department / Program</th>
                  <th className="p-3.5">Phone (SMS)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-extrabold text-slate-900">{u.name}</td>
                    <td className="p-3.5 text-slate-600">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'organizer'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      {u.studentId || u.adminCode || u.organizerCode || '—'}
                    </td>
                    <td className="p-3.5 text-slate-600">{u.department || 'Strathmore University'}</td>
                    <td className="p-3.5 text-slate-600 font-mono">{u.phone || '+254712345678'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">{(u.createdAt || '').split('T')[0]}</td>
                    <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => openEditUserModal(u)}
                        className="p-1.5 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RELATIONAL ROLE PROFILES & VENUES TABLES */}
      {activeTab === 'profiles' && (
        <div className="space-y-6">
          {/* 2 Admin Profiles Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900">
              Table: <code>admin_profiles</code> (2 System Administrators)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                    <th className="p-3">Admin Code</th>
                    <th className="p-3">Administrator Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role Title</th>
                    <th className="p-3">Clearance</th>
                    <th className="p-3">Office Location</th>
                    <th className="p-3">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(profileTables.admin_profiles || []).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-purple-700">{a.adminCode}</td>
                      <td className="p-3 font-extrabold text-slate-900">{a.name}</td>
                      <td className="p-3 text-slate-600">{a.email}</td>
                      <td className="p-3 font-semibold text-slate-700">{a.roleTitle}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                          {a.clearanceLevel}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{a.office}</td>
                      <td className="p-3 font-mono text-slate-600">{a.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Organizer Profiles Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900">
              Table: <code>organizer_profiles</code> (Verified Campus Event Organizers)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                    <th className="p-3">Org Code</th>
                    <th className="p-3">Organizer Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Faculty / Department</th>
                    <th className="p-3">Office</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Events Hosted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(profileTables.organizer_profiles || []).map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-amber-700">{o.organizerCode}</td>
                      <td className="p-3 font-extrabold text-slate-900">{o.name}</td>
                      <td className="p-3 text-slate-600">{o.email}</td>
                      <td className="p-3 text-slate-700">{o.department}</td>
                      <td className="p-3 text-slate-600">{o.officeLocation}</td>
                      <td className="p-3 font-mono text-slate-600">{o.phone}</td>
                      <td className="p-3 font-extrabold text-[#003366]">{o.eventsHostedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Profiles Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900">
              Table: <code>student_profiles</code> (Strathmore Student Profiles)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Degree Program</th>
                    <th className="p-3">Faculty</th>
                    <th className="p-3">Year</th>
                    <th className="p-3">Phone (SMS)</th>
                    <th className="p-3">Past Turnout Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(profileTables.student_profiles || []).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-700">{s.studentId}</td>
                      <td className="p-3 font-extrabold text-slate-900">{s.name}</td>
                      <td className="p-3 text-slate-600">{s.email}</td>
                      <td className="p-3 text-slate-700">{s.program}</td>
                      <td className="p-3 font-bold text-slate-700">{s.faculty}</td>
                      <td className="p-3">Year {s.yearOfStudy}</td>
                      <td className="p-3 font-mono text-slate-600">{s.phone}</td>
                      <td className="p-3 font-extrabold text-emerald-700">
                        {Math.round((s.pastAttendanceRate || 0.8) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENTS TABLE */}
      {activeTab === 'events' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Table: <code>events</code> (Campus Events Moderation)</h3>
              <p className="text-xs text-slate-500">Create, edit, or delete campus events across all faculties.</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search event, venue, organizer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>
              <button
                onClick={() => setIsCreateEventOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Organizer</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">RSVPs / Cap</th>
                  <th className="p-3.5">ML Forecast</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-extrabold text-slate-900">{evt.title}</td>
                    <td className="p-3.5 text-slate-600 font-medium">{evt.organizer}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 text-[#003366] border border-blue-200">
                        {evt.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">{evt.date} • {evt.time || evt.timeSlot}</td>
                    <td className="p-3.5 text-slate-600">{evt.venue}</td>
                    <td className="p-3.5 font-bold text-emerald-700">
                      {evt.registrationCount} / {evt.venueCapacity}
                    </td>
                    <td className="p-3.5 font-extrabold text-blue-700">
                      {evt.predictedAttendance || Math.round((evt.registrationCount || 0) * 0.82)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        {evt.status || 'Upcoming'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setEditingEvent(evt)}
                        className="p-1.5 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Event"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REGISTRATIONS TABLE */}
      {activeTab === 'registrations' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Table: <code>registrations</code> (Student RSVPs)</h3>
              <p className="text-xs text-slate-500">Inspect and manage student event registrations.</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student, admission no, event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Admission No</th>
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Phone (SMS)</th>
                  <th className="p-3.5">Date Registered</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrations.map((r) => {
                  const matchedEvt = events.find((e) => e.id === r.eventId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-extrabold text-slate-900">{r.studentName}</td>
                      <td className="p-3.5 font-mono font-bold text-blue-700">{r.studentId}</td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {r.eventTitle || matchedEvt?.title || r.eventId}
                      </td>
                      <td className="p-3.5 text-slate-600">{r.email}</td>
                      <td className="p-3.5 font-mono text-slate-600">{r.phone}</td>
                      <td className="p-3.5 text-slate-500">{(r.registeredAt || '').split('T')[0]}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          {r.status || 'Confirmed'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleCancelRegistration(r.id, r.studentName)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel / Delete RSVP"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CATEGORIES TABLE */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Table: <code>event_categories</code></h3>
              <p className="text-xs text-slate-500">Create, edit, or delete official university event categories.</p>
            </div>
            <button
              onClick={openCreateCategoryModal}
              className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                  <th className="p-3.5">Category ID</th>
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Icon</th>
                  <th className="p-3.5">Event Count</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-slate-600">{cat.id}</td>
                    <td className="p-3.5 font-extrabold text-slate-900">{cat.name}</td>
                    <td className="p-3.5 text-slate-600">{cat.description || '—'}</td>
                    <td className="p-3.5 font-mono text-slate-600">{cat.icon || 'Tag'}</td>
                    <td className="p-3.5 font-bold text-[#003366]">{cat.count || 0}</td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEditCategoryModal(cat)}
                        className="p-1.5 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Category"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AFRICA'S TALKING SMS GATEWAY & LOGS TABLE */}
      {activeTab === 'sms' && (
        <div className="space-y-6">
          {/* Dispatch Priority SMS Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  📱 Africa's Talking Priority SMS Dispatch Console
                </h3>
                <p className="text-xs text-slate-500">
                  Broadcast urgent venue changes or reminders to event registrants or custom Kenyan (+254) numbers.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                Africa's Talking Gateway Active
              </span>
            </div>

            <form onSubmit={handleDispatchSms} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Target Campus Event</label>
                <select
                  value={smsForm.eventId}
                  onChange={(e) => setSmsForm({ ...smsForm, eventId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Priority Level</label>
                <select
                  value={smsForm.priority}
                  onChange={(e) => setSmsForm({ ...smsForm, priority: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                >
                  <option value="HIGH">🔴 HIGH PRIORITY (Immediate Venue/Time Alert)</option>
                  <option value="MEDIUM">🟡 MEDIUM PRIORITY (Standard Reminder)</option>
                  <option value="LOW">🔵 LOW PRIORITY (General Announcement)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Custom Phone Numbers (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank for event RSVP roster, or +254712345678"
                  value={smsForm.recipients}
                  onChange={(e) => setSmsForm({ ...smsForm, recipients: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold uppercase text-slate-700 mb-1">SMS Message Body</label>
                <input
                  type="text"
                  required
                  value={smsForm.message}
                  onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={sendingSms}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingSms ? 'Dispatching...' : "Dispatch via Africa's Talking"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SMS Logs Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900">
              Table: <code>sms_logs</code> ({smsLogs.length} Dispatches)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                    <th className="p-3">Priority</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Message</th>
                    <th className="p-3">Gateway Status</th>
                    <th className="p-3">Cost</th>
                    <th className="p-3">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {smsLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            log.priority === 'HIGH'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : log.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {log.priority}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-slate-900">{log.eventTitle}</td>
                      <td className="p-3 text-slate-700 font-semibold">{log.recipientName || 'Student'}</td>
                      <td className="p-3 font-mono text-slate-600">{log.recipient}</td>
                      <td className="p-3 text-slate-600 max-w-md">{log.message}</td>
                      <td className="p-3 text-emerald-700 font-bold">{log.gatewayResponse}</td>
                      <td className="p-3 font-mono font-bold">{log.cost}</td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {(log.sentAt || '').replace('T', ' ').slice(0, 16)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-3">
              {editingUser ? `Edit User: ${editingUser.name}` : 'Create New System User'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">University Email</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Status</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Student ID / Code</label>
                  <input
                    type="text"
                    value={userForm.studentId}
                    onChange={(e) => setUserForm({ ...userForm, studentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Phone (E.164)</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Department / Program</label>
                <input
                  type="text"
                  value={userForm.department}
                  onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#003366] text-white font-bold">
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-3">
              {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#003366] text-white font-bold">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Creation & Edit Modals */}
      <EventCreationModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        onCreateEvent={handleCreateEvent}
      />

      <EventEditModal
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
        onSaveEvent={handleUpdateEvent}
      />
    </div>
  );
}
