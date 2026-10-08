import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

import HomePage from '../pages/public/HomePage';
import StudentDashboardPage from '../pages/student/StudentDashboardPage';
import OrganizerDashboardPage from '../pages/organizer/OrganizerDashboardPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AuthModal from '../components/AuthModal';

export default function AppRoutes() {
  const { currentPath, navigate, user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  const handleOpenAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const renderCurrentRoute = () => {
    switch (currentPath) {
      case '/student/dashboard':
        return (
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        );

      case '/organizer/dashboard':
        return (
          <ProtectedRoute allowedRoles={['organizer', 'admin']}>
            <OrganizerDashboardPage />
          </ProtectedRoute>
        );

      case '/admin/dashboard':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        );

      case '/':
      default:
        return <HomePage onOpenAuthModal={handleOpenAuthModal} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-[#003366] flex items-center justify-center text-white font-black text-sm">
              SE
            </div>
            <span className="font-black text-xl text-[#003366] tracking-tight">SMARTEVENT</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-600">
            <button
              onClick={() => navigate('/')}
              className={`transition-colors ${currentPath === '/' ? 'text-[#003366] font-extrabold border-b-2 border-[#003366] pb-0.5' : 'hover:text-[#003366]'}`}
            >
              Public Homepage
            </button>

            {user?.role === 'student' && (
              <button
                onClick={() => navigate('/student/dashboard')}
                className={`transition-colors ${currentPath === '/student/dashboard' ? 'text-[#003366] font-extrabold border-b-2 border-[#003366] pb-0.5' : 'hover:text-[#003366]'}`}
              >
                My Student Dashboard
              </button>
            )}

            {(user?.role === 'organizer' || user?.role === 'admin') && (
              <button
                onClick={() => navigate('/organizer/dashboard')}
                className={`transition-colors ${currentPath === '/organizer/dashboard' ? 'text-[#003366] font-extrabold border-b-2 border-[#003366] pb-0.5' : 'hover:text-[#003366]'}`}
              >
                Organizer Dashboard
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin/dashboard')}
                className={`transition-colors ${currentPath === '/admin/dashboard' ? 'text-[#003366] font-extrabold border-b-2 border-[#003366] pb-0.5' : 'hover:text-[#003366]'}`}
              >
                Admin Control Center
              </button>
            )}
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center space-x-3 text-xs">
            {user ? (
              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-slate-900 block leading-tight text-xs">{user.name}</span>
                    <span className="text-[10px] font-bold uppercase text-[#0284c7]">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors ml-1 font-bold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenAuthModal('login')}
                  className="font-bold text-slate-700 hover:text-[#003366] px-3 py-2"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleOpenAuthModal('signup')}
                  className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-bold transition-all shadow-xs"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentRoute()}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © 2026 <strong>Strathmore University</strong> • SmartEvent Enterprise Platform
          </div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-[#003366] cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-[#003366] cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-[#003366] cursor-pointer">Help & Support</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
