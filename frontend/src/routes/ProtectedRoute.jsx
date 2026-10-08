import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, navigate, getRoleDashboardPath } = useAuth();

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Authentication Required</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            You must be logged in to access this section of SmartEvent.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all"
          >
            Return to Public Homepage
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Access Denied</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your account role (<strong className="uppercase text-[#003366]">{user.role}</strong>) is not authorized to access this route.
          </p>
          <button
            onClick={() => navigate(getRoleDashboardPath())}
            className="w-full py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold transition-all flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to My Authorized Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return children;
}
