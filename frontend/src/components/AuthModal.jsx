import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, GraduationCap, Lock, Mail, User, Building, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function AuthModal({ isOpen, initialTab = 'login', onClose }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(initialTab === 'login');
  const [selectedRole, setSelectedRole] = useState('student'); // 'admin', 'organizer', 'student'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    department: 'School of Computing & Engineering Sciences'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLogin(initialTab === 'login');
  }, [initialTab]);

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
      id: `usr-${role}-1`,
      name,
      email,
      role,
      studentId,
      department: 'Strathmore University'
    };

    const token = `token_${demoUser.id}_${Date.now()}`;
    login(demoUser, token);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const res = await authApi.login({
          email: formData.email,
          password: formData.password,
          role: selectedRole
        });
        login(res.user, res.token);
      } else {
        const res = await authApi.signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
          studentId: formData.studentId,
          department: formData.department
        });
        login(res.user, res.token);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl overflow-hidden relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-full hover:bg-slate-100"
        >
          ✕
        </button>

        {/* Modal Title */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-[#003366] text-white flex items-center justify-center mx-auto font-black text-sm mb-2 shadow-sm">
            SE
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {isLogin ? 'Sign In to SmartEvent' : 'Create SmartEvent Account'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Select your university role to proceed
          </p>
        </div>

        {/* Quick Role Preset Pills */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block text-center">
            Quick One-Tap Role Preset Login
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('student')}
              className="py-2 px-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-all text-center"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('organizer')}
              className="py-2 px-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all text-center"
            >
              📢 Organizer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="py-2 px-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-all text-center"
            >
              👑 Admin
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase">or enter credentials</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* Role selector dropdown */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Select Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
            >
              <option value="student">Student Account</option>
              <option value="organizer">Event Organizer Account</option>
              <option value="admin">System Administrator Account</option>
            </select>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Elvis Wanyama Wafuke"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">University Email</label>
            <input
              type="email"
              required
              placeholder="e.g. student@strathmore.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          {!isLogin && selectedRole === 'student' && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Student ID</label>
              <input
                type="text"
                placeholder="e.g. 154210"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all shadow-md mt-2 flex items-center justify-center space-x-2"
          >
            <span>{isLoading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Modal Footer Toggle */}
        <div className="pt-2 text-center border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
            className="font-bold text-[#003366] hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>

      </div>
    </div>
  );
}
