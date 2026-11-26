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

const DEFAULT_GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '604862097027-9p6jobl5dv420kotr4u5ob2als6qomvo.apps.googleusercontent.com';

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
  const [googleClientId, setGoogleClientId] = useState(DEFAULT_GOOGLE_CLIENT_ID);

  useEffect(() => {
    authApi
      .googleConfig()
      .then((cfg) => {
        if (cfg && cfg.clientId) setGoogleClientId(cfg.clientId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLogin(initialTab === 'login');
    setErrorMsg('');
    setShowPassword(false);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const launchRealGoogleOAuth = () => {
    setErrorMsg('');
    if (!googleClientId) {
      setErrorMsg('Google Client ID is not configured.');
      return;
    }

    const g = typeof window !== 'undefined' && window.google;
    if (g && g.accounts && g.accounts.oauth2) {
      try {
        const tokenClient = g.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (!tokenResponse) return;
            if (tokenResponse.error) {
              setErrorMsg(tokenResponse.error_description || 'Google Sign-In was cancelled or failed.');
              return;
            }
            if (!tokenResponse.access_token) return;
            setIsLoading(true);
            try {
              const res = await authApi.googleLogin({
                accessToken: tokenResponse.access_token,
                role: isLogin ? 'student' : signupRole || 'student'
              });
              login(res.user, res.token);
              onClose();
            } catch (err) {
              setErrorMsg(err.message || 'Google authentication failed.');
            } finally {
              setIsLoading(false);
            }
          },
          error_callback: () => {
            // If popup is blocked or fails, fall back to full-page Google OAuth redirect
            const redirectUri = `${window.location.origin}/`;
            const authUrl =
              `https://accounts.google.com/o/oauth2/v2/auth` +
              `?client_id=${encodeURIComponent(googleClientId)}` +
              `&redirect_uri=${encodeURIComponent(redirectUri)}` +
              `&response_type=token` +
              `&scope=${encodeURIComponent('openid email profile')}` +
              `&prompt=select_account` +
              `&state=${encodeURIComponent(isLogin ? 'student' : signupRole || 'student')}`;
            window.location.href = authUrl;
          }
        });
        tokenClient.requestAccessToken();
        return;
      } catch {
        // Fall through to full-page Google OAuth redirect
      }
    }

    // Standard Google OAuth 2.0 full-page redirect (works even if GIS script is blocked)
    const redirectUri = `${window.location.origin}/`;
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(googleClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&prompt=select_account` +
      `&state=${encodeURIComponent(isLogin ? 'student' : signupRole || 'student')}`;
    window.location.href = authUrl;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl relative">
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
            {isLogin ? 'Sign In to SmartEvent' : 'Create SmartEvent Account'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {isLogin
              ? 'Enter your Strathmore email & password or continue with Google'
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

            {/* Official Continue with Google Button */}
            <button
              type="button"
              onClick={launchRealGoogleOAuth}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 text-xs font-extrabold transition-all shadow-2xs flex items-center justify-center space-x-2.5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
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
      </div>
    </div>
  );
}
