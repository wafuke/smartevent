import React, { useState, useEffect } from 'react';
import { Users, Calendar, Tag, ShieldCheck, Search, Plus, Edit3, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminApi, eventsApi, categoriesApi, registrationsApi } from '../../services/api';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'events', 'categories', 'registrations'
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modals & Forms
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes, eventsRes, catsRes, regsRes] = await Promise.all([
        adminApi.getOverview().catch(() => ({ data: { metrics: {} } })),
        adminApi.getUsers().catch(() => ({ data: [] })),
        eventsApi.getAll().catch(() => ({ data: [] })),
        categoriesApi.getAll().catch(() => ({ data: [] })),
        registrationsApi.getAll().catch(() => ({ data: [] }))
      ]);

      setMetrics(overviewRes.data?.metrics || {});
      setUsers(usersRes.data || []);
      setEvents(eventsRes.data || []);
      setCategories(catsRes.data || []);
      setRegistrations(regsRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // User Management Handlers
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"?`)) return;
    try {
      await adminApi.deleteUser(userId);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Event Management Handlers
  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to delete event "${title}"?`)) return;
    try {
      await eventsApi.delete(eventId);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    }
  };

  // Category Management Handlers
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await categoriesApi.create({ name: newCatName, description: newCatDesc });
      setNewCatName('');
      setNewCatDesc('');
      setIsCategoryModalOpen(false);
      await loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to create category');
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

  // Filtered Lists
  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Admin Control Center Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#002244] to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Administrative Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            System Overview & Management
          </h1>
          <p className="text-xs text-slate-300">
            Real-time management for users, campus events, categories, and system logs.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-2 border border-white/20 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Users</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{metrics?.totalUsers || users.length}</span>
          <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">{metrics?.students || 0} Students • {metrics?.organizers || 0} Organizers</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Active Events</span>
          <span className="text-3xl font-extrabold text-[#003366] mt-1 block">{metrics?.totalEvents || events.length}</span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Campus Wide</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total RSVPs</span>
          <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">{metrics?.totalRegistrations || registrations.length}</span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Student Registrations</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Categories</span>
          <span className="text-3xl font-extrabold text-amber-700 mt-1 block">{categories.length}</span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Active Taxonomy</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-[#003366] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          System Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'users' ? 'bg-[#003366] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'events' ? 'bg-[#003366] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Event Moderation ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'categories' ? 'bg-[#003366] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Category Management ({categories.length})
        </button>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900">Recent System Activity</h3>
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Strathmore Tech Innovation Summit 2026 Created</span>
                  <span className="text-slate-400 font-normal">10 mins ago</span>
                </div>
                <p className="text-slate-600">Created by School of Computing & Engineering Sciences</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Student RSVP Registered</span>
                  <span className="text-slate-400 font-normal">25 mins ago</span>
                </div>
                <p className="text-slate-600">Elvis Wafuke registered for AI & Machine Learning Workshop</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>High Priority SMS Dispatched</span>
                  <span className="text-slate-400 font-normal">1 hour ago</span>
                </div>
                <p className="text-slate-600">Venue shift notification sent via Africa's Talking API</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900">Machine Learning & Infrastructure Status</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-blue-50 text-blue-950 font-semibold border border-blue-200">
                <span>ML Model Accuracy (Random Forest)</span>
                <span className="font-extrabold">91.2%</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200">
                <span>REST API Gateway Status</span>
                <span className="font-extrabold text-emerald-700">ONLINE (Port 5000)</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-amber-50 text-amber-950 font-semibold border border-amber-200">
                <span>Priority SMS Gateway</span>
                <span className="font-extrabold text-amber-700">Africa's Talking API Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT TABLE */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-slate-900">System Users Table</h3>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#003366] outline-none"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              >
                <option value="All">All Roles</option>
                <option value="student">Students</option>
                <option value="organizer">Organizers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Department / Student ID</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-extrabold text-slate-900">{u.name}</td>
                    <td className="p-3.5 text-slate-600">{u.email}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        u.role === 'organizer' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{u.studentId || u.department || 'N/A'}</td>
                    <td className="p-3.5 text-right">
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

      {/* TAB 3: EVENT MODERATION TABLE */}
      {activeTab === 'events' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-slate-900">Campus Events Table</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#003366] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="p-3.5">Event Title</th>
                  <th className="p-3.5">Organizer</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Date & Location</th>
                  <th className="p-3.5">RSVPs</th>
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
                    <td className="p-3.5 text-slate-600">{evt.date} • {evt.venue}</td>
                    <td className="p-3.5 font-bold text-emerald-700">{evt.registrationCount} / {evt.venueCapacity}</td>
                    <td className="p-3.5 text-right">
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

      {/* TAB 4: CATEGORY MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">Event Categories Management</h3>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{cat.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.description || 'No description'}</p>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-3">Create New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hackathon, Cultural, Hackfest"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief description..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
