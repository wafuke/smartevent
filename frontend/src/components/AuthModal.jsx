import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  GraduationCap,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const DEVICE_GOOGLE_STORAGE_KEY = 'smartevent_device_google_accounts';

function getDeviceGoogleAccounts() {
  try {
    const raw = localStorage.getItem(DEVICE_GOOGLE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDeviceGoogleAccount(account) {
  try {
    const existing = getDeviceGoogleAccounts().filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase()
    );
    const updated = [
      {
        email: account.email.toLowerCase(),
        name: account.name,
        role: account.role,
        lastUsed: new Date().toISOString()
      },
      ...existing
    ].slice(0, 5);
    localStorage.setItem(DEVICE_GOOGLE_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

function removeDeviceGoogleAccount(email) {
  try {
    const updated = getDeviceGoogleAccounts().filter(
      (a) => a.email.toLowerCase() !== email.toLowerCase()
    );
    localStorage.setItem(DEVICE_GOOGLE_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export default function AuthModal({ isOpen, initialTab = 'login', onClose }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(initialTab === 'login');
  const [signupRole, setSignupRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    phone: '+2547',
    department: 'BSc Informatics & Computer Science'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Google OAuth Account Chooser & 1-Step Email Sign-In/Sign-Up State
  const [showGoogleFlow, setShowGoogleFlow] = useState(false);
  const [deviceGoogleAccounts, setDeviceGoogleAccounts] = useState([]);
  const [googleStep, setGoogleStep] = useState('chooser'); // 'chooser' | 'email'
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleRole, setGoogleRole] = useState('student');

  useEffect(() => {
    setIsLogin(initialTab === 'login');
    setErrorMsg('');
    setShowGoogleFlow(false);
    setShowPassword(false);
    const saved = getDeviceGoogleAccounts();
    setDeviceGoogleAccounts(saved);
    setGoogleStep(saved.length > 0 ? 'chooser' : 'email');
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const openGoogleSignIn = () => {
    setErrorMsg('');
    const saved = getDeviceGoogleAccounts();
    setDeviceGoogleAccounts(saved);
    setGoogleEmail('');
    setGoogleName('');
    setGoogleRole(signupRole || 'student');
    setGoogleStep(saved.length > 0 ? 'chooser' : 'email');
    setShowGoogleFlow(true);
  };

  const completeGoogleAuth = async ({ email, name, role }) => {
    const trimmed = String(email || '').trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Enter a valid @strathmore.edu Google Workspace or Gmail address.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await authApi.googleLogin({
        email: trimmed,
        name: name && String(name).trim() ? String(name).trim() : undefined,
        role: role || 'student'
      });
      const updated = saveDeviceGoogleAccount(res.user);
      setDeviceGoogleAccounts(updated);
      login(res.user, res.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Google authentication failed. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSavedGoogleAccount = (acct) => {
    completeGoogleAuth({
      email: acct.email,
      name: acct.name,
      role: acct.role || 'student'
    });
  };

  const handleRemoveSavedGoogleAccount = (e, email) => {
    e.stopPropagation();
    const updated = removeDeviceGoogleAccount(email);
    setDeviceGoogleAccounts(updated);
    if (updated.length === 0) {
      setGoogleStep('email');
    }
  };

  const handleGoogleEmailSubmit = (e) => {
    e.preventDefault();
    completeGoogleAuth({
      email: googleEmail,
      name: googleName,
      role: googleRole
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isLogin) {
      if (!formData.email.trim() || !formData.password) {
        setErrorMsg('Please enter your university email and password.');
        return;
      }
    } else {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
        setErrorMsg('Full name, email address, and password are required.');
        return;
      }
      if (formData.password.length < 8 || !/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password)) {
        setErrorMsg('Password must be at least 8 characters and contain both letters and numbers.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (signupRole === 'student' && !/^\d{5,8}$/.test(formData.studentId.trim())) {
        setErrorMsg('Student admission number must be 5 to 8 digits (e.g. 154210).');
        return;
      }
      const cleanedPhone = formData.phone.replace(/[\s\-()]/g, '');
      if (!/^(\+?254|0)[17]\d{8}$/.test(cleanedPhone)) {
        setErrorMsg('Enter a valid Kenyan mobile number (e.g. +254712345678 or 0712345678).');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const res = await authApi.login({
          email: formData.email.trim(),
          password: formData.password,
          role: 'auto'
        });
        login(res.user, res.token);
      } else {
        const res = await authApi.signup({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: signupRole,
          studentId: formData.studentId.trim(),
          phone: formData.phone.trim(),
          department: formData.department.trim()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full hover:bg-slate-100"
          aria-label="Close modal"
        >
          Close
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-2xl bg-[#003366] text-amber-400 flex items-center justify-center mx-auto font-black text-base shadow-sm">
            SE
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {showGoogleFlow
              ? 'Continue with Google'
              : isLogin
              ? 'Sign In to SmartEvent'
              : 'Create SmartEvent Account'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {showGoogleFlow
              ? 'Enter your Google or @strathmore.edu email to sign in or sign up instantly'
              : isLogin
              ? 'Enter your Strathmore email & password to access your portal'
              : 'Register as a Student or Event Organizer'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* GOOGLE OAUTH ACCOUNT CHOOSER & 1-CLICK EMAIL FLOW */}
        {showGoogleFlow ? (
          <div className="space-y-4">
            {googleStep === 'chooser' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-600">
                  Choose an account to continue to SmartEvent:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deviceGoogleAccounts.map((acct) => (
                    <div
                      key={acct.email}
                      onClick={() => handleSelectSavedGoogleAccount(acct)}
                      className="w-full p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-[#003366] text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {(acct.name || acct.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">
                            {acct.name || acct.email.split('@')[0]}
                          </div>
                          <div className="text-[11px] text-slate-500">{acct.email}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveSavedGoogleAccount(e, acct.email)}
                        title="Remove account from this device"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setGoogleEmail('');
                    setGoogleName('');
                    setErrorMsg('');
                    setGoogleStep('email');
                  }}
                  className="w-full p-3 rounded-2xl border border-dashed border-slate-300 hover:border-[#003366] hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4 text-[#003366]" />
                  <span>Use another Google / Strathmore email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleFlow(false);
                    setErrorMsg('');
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  ← Back
                </button>
              </div>
            )}

            {googleStep === 'email' && (
              <form onSubmit={handleGoogleEmailSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Google or Strathmore Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="name@strathmore.edu or name@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="block text-[11px] text-slate-500 mt-1">
                    Existing accounts sign in immediately. New emails are automatically registered.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Full Name <span className="font-normal text-slate-400">(optional for new accounts)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Elvis Wanyama Wafuke"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1.5">
                    Account Type <span className="font-normal text-slate-400">(if creating a new account)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGoogleRole('student')}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                        googleRole === 'student'
                          ? 'border-[#003366] bg-blue-50/70 text-[#003366]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoogleRole('organizer')}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                        googleRole === 'organizer'
                          ? 'border-[#003366] bg-blue-50/70 text-[#003366]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Organizer</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (deviceGoogleAccounts.length > 0) {
                        setGoogleStep('chooser');
                      } else {
                        setShowGoogleFlow(false);
                      }
                      setErrorMsg('');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm"
                  >
                    {isLoading ? 'Signing in...' : 'Continue with Google'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setErrorMsg('');
                }}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                  isLogin ? 'bg-[#003366] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setErrorMsg('');
                }}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                  !isLogin ? 'bg-[#003366] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={openGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase">
                or {isLogin ? 'sign in with email & password' : 'register with email & password'}
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1.5">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSignupRole('student')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                          signupRole === 'student'
                            ? 'border-[#003366] bg-blue-50/70 text-[#003366]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Student</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupRole('organizer')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                          signupRole === 'organizer'
                            ? 'border-[#003366] bg-blue-50/70 text-[#003366]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Organizer</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      {signupRole === 'organizer' ? 'Organizer / Society Name' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        signupRole === 'organizer'
                          ? 'e.g. Strathmore Robotics Club'
                          : 'e.g. Elvis Wanyama Wafuke'
                      }
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  University Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@strathmore.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
                />
              </div>

              {!isLogin && (
                <div className="grid grid-cols-2 gap-2.5">
                  {signupRole === 'student' ? (
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                        Admission Number (5-8 digits)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 154210"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                        Department / Faculty
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SCES"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Phone (Kenyan Mobile)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+254712345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Password {!isLogin && <span className="text-[10px] font-normal text-slate-400">(min 8 chars, letters + numbers)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={isLogin ? 'Enter your password' : 'At least 8 chars with letters & numbers'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#003366]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all shadow-md mt-1 flex items-center justify-center space-x-2"
              >
                <span>
                  {isLoading
                    ? 'Authenticating...'
                    : isLogin
                    ? 'Sign In to Dashboard'
                    : 'Create Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Security Notice */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protected by Bcrypt Password Hashing & Signed JWT RBAC</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
