import React, { useState } from 'react';
import { ShieldCheck, Calendar, GraduationCap, Lock, Mail, User, Building, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState('organizer'); // 'admin', 'organizer', 'student'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    department: 'School of Computing & Engineering Sciences'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuickDemoLogin = (role) => {
    setSelectedRole(role);
    let email = '';
    let name = '';
    let studentId = '';

    if (role === 'admin') {
      email = 'admin@strathmore.edu';
      name = 'System Administrator';
    } else if (role === 'organizer') {
      email = 'organizer@strathmore.edu';
      name = 'SCES Event Organizer';
    } else {
      email = 'student@strathmore.edu';
      name = 'Elvis Wanyama Wafuke';
      studentId = '154210';
    }

    const demoUser = {
      id: `usr-${role}-${Date.now()}`,
      name,
      email,
      role,
      studentId,
      department: 'Strathmore University'
    };

    localStorage.setItem('smartevent_user', JSON.stringify(demoUser));
    onAuthSuccess(demoUser);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: selectedRole
        })
      });

      const data = await response.json();
      setIsLoading(false);

      if (data.success) {
        localStorage.setItem('smartevent_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('smartevent_token', data.token);
        onAuthSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      setIsLoading(false);
      // Fallback demo authentication if offline
      const localUser = {
        id: `usr-${selectedRole}-${Date.now()}`,
        name: formData.name || (selectedRole === 'admin' ? 'System Administrator' : selectedRole === 'organizer' ? 'Event Organizer' : 'Strathmore Student'),
        email: formData.email || `${selectedRole}@strathmore.edu`,
        role: selectedRole,
        studentId: formData.studentId || '154210',
        department: formData.department
      };
      localStorage.setItem('smartevent_user', JSON.stringify(localUser));
      onAuthSuccess(localUser);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">SmartEvent Portal Authentication</h2>
          <p className="text-xs text-slate-500 font-medium">Select your role to access system permissions</p>
        </div>

        {/* Role Selector Pills */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Select Access Role</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center space-y-1 ${
                selectedRole === 'admin'
                  ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('organizer')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center space-y-1 ${
                selectedRole === 'organizer'
                  ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Organizer</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center space-y-1 ${
                selectedRole === 'student'
                  ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>
          </div>
        </div>

        {/* Sign In vs Sign Up Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${isLogin ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!isLogin ? 'bg-white text-blue-950 shadow-sm' : 'text-slate-500'}`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Allan Vikiru"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Strathmore Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@strathmore.edu"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {selectedRole === 'student' && !isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Admission Number</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g. 154210"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>{isLoading ? 'Processing...' : isLogin ? `Sign In as ${selectedRole.toUpperCase()}` : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Login Shortcuts */}
        <div className="pt-2 border-t border-slate-200 space-y-2 text-center">
          <span className="text-[11px] font-semibold text-slate-500">Quick 1-Click Demo Logins:</span>
          <div className="flex items-center justify-center space-x-2 text-[11px]">
            <button
              onClick={() => handleQuickDemoLogin('admin')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-900 font-bold border border-slate-200"
            >
              Demo Admin
            </button>
            <button
              onClick={() => handleQuickDemoLogin('organizer')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-900 font-bold border border-slate-200"
            >
              Demo Organizer
            </button>
            <button
              onClick={() => handleQuickDemoLogin('student')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-900 font-bold border border-slate-200"
            >
              Demo Student
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
