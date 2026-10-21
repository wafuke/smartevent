import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const GOOGLE_WORKSPACE_ACCOUNTS = [
  { name: 'Elvis Wanyama Wafuke', email: 'student@strathmore.edu', role: 'student', badge: 'Student • 154210' },
  { name: 'Amina Hassan', email: 'amina.hassan@strathmore.edu', role: 'student', badge: 'Student • 154382' },
  { name: "Dr. Joseph Orero (SCES Dean's Office)", email: 'organizer@strathmore.edu', role: 'organizer', badge: 'Organizer • ORG-001' },
  { name: '@iLabAfrica Innovation Centre', email: 'ilab@strathmore.edu', role: 'organizer', badge: 'Organizer • ORG-002' },
  { name: 'Elvis Wanyama Wafuke (Admin)', email: 'admin@strathmore.edu', role: 'admin', badge: 'Admin • ADM-001' },
  { name: 'Mr. Allan Vikiru', email: 'allan.vikiru@strathmore.edu', role: 'admin', badge: 'Supervisor Admin • ADM-002' }
];

export default function AuthModal({ isOpen, initialTab = 'login', onClose }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(initialTab === 'login');
  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    phone: '+254712345678',
    department: 'BSc Informatics & Computer Science'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Google Account Chooser state
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  useEffect(() => {
    setIsLogin(initialTab === 'login');
    setErrorMsg('');
    setShowGooglePicker(false);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  // Fill verified demo account credentials into the form and authenticate against backend /api/auth/login
  const handleFillAndLoginDemo = async (email, role) => {
    setErrorMsg('');
    setSelectedRole(role);
    setFormData((prev) => ({ ...prev, email, password: 'password123' }));
    setIsLoading(true);
    try {
      const res = await authApi.login({
        email,
        password: 'password123',
        role
      });
      login(res.user, res.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAccountSelect = async (acct) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await authApi.googleLogin({
        email: acct.email,
        name: acct.name,
        role: acct.role,
        googleId: `google_${acct.email}`
      });
      login(res.user, res.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) {
      setErrorMsg('Please enter your Google / @strathmore.edu email address.');
      return;
    }
    await handleGoogleAccountSelect({
      email: customGoogleEmail.trim(),
      name: customGoogleName.trim() || customGoogleEmail.split('@')[0],
      role: selectedRole
    });
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
          phone: formData.phone,
          department: formData.department
        });
        login(res.user, res.token);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl relative my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-sm font-bold p-1.5 rounded-full hover:bg-slate-100"
        >
          ✕
        </button>

        {/* Modal Title */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-[#003366] text-amber-400 flex items-center justify-center mx-auto font-black text-sm mb-2 shadow-sm">
            SE
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {showGooglePicker
              ? 'Sign in with Google'
              : isLogin
              ? 'Sign In to SmartEvent'
              : 'Create SmartEvent Account'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {showGooglePicker
              ? 'Choose your @strathmore.edu Google Workspace or Gmail account'
              : 'Authenticated with Bcrypt + JWT Role-Based Access Control'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {showGooglePicker ? (
          <div className="space-y-3">
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {GOOGLE_WORKSPACE_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleGoogleAccountSelect(acct)}
                  className="w-full p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#003366] text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {acct.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{acct.name}</div>
                      <div className="text-[11px] text-slate-500">{acct.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {acct.badge}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomGoogleSubmit} className="pt-2 border-t border-slate-200 space-y-2.5">
              <span className="block text-[10px] font-bold uppercase text-slate-500">
                Or use another Google Account ({selectedRole})
              </span>
              <input
                type="text"
                placeholder="Your Full Name"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              />
              <input
                type="email"
                required
                placeholder="your.name@strathmore.edu or @gmail.com"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowGooglePicker(false); setErrorMsg(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#003366] text-white text-xs font-bold hover:bg-[#002244]"
                >
                  {isLoading ? 'Verifying...' : 'Continue with Google'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={() => { setShowGooglePicker(true); setErrorMsg(''); }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>Continue with Google (@strathmore.edu)</span>
            </button>

            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase">or email & password</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Select University Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
                >
                  <option value="student">🎓 Student Account</option>
                  <option value="organizer">📢 Event Organizer Account</option>
                  <option value="admin">👑 System Administrator Account</option>
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
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
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
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
                />
              </div>

              {!isLogin && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedRole === 'student' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Admission No</label>
                      <input
                        type="text"
                        placeholder="e.g. 154210"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  )}
                  <div className={selectedRole === 'student' ? '' : 'col-span-2'}>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">Phone (SMS)</label>
                    <input
                      type="text"
                      placeholder="+254712345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all shadow-md mt-1 flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? 'Verifying Credentials...' : isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Seeded Demo Accounts (Verified via Backend API) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block text-center">
                Seeded Strathmore Accounts (Password: password123)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFillAndLoginDemo('student@strathmore.edu', 'student')}
                  className="py-1.5 px-2 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-[11px] font-bold transition-all text-center truncate"
                >
                  🎓 Elvis (154210)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillAndLoginDemo('organizer@strathmore.edu', 'organizer')}
                  className="py-1.5 px-2 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition-all text-center truncate"
                >
                  📢 SCES Organizer
                </button>
                <button
                  type="button"
                  onClick={() => handleFillAndLoginDemo('admin@strathmore.edu', 'admin')}
                  className="py-1.5 px-2 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-[11px] font-bold transition-all text-center truncate"
                >
                  👑 Admin 1 (Elvis)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillAndLoginDemo('allan.vikiru@strathmore.edu', 'admin')}
                  className="py-1.5 px-2 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-[11px] font-bold transition-all text-center truncate"
                >
                  👑 Admin 2 (Vikiru)
                </button>
              </div>
            </div>

            {/* Modal Footer Toggle */}
            <div className="pt-2 text-center border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
                className="font-bold text-[#003366] hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
