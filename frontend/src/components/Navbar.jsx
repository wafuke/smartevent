import React from 'react';
import { Calendar, User, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuthModal, onSignOut }) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center space-x-2.5 cursor-pointer"
          onClick={() => setActiveTab('home')}
        >
          <div className="w-8 h-8 rounded-lg bg-[#003366] flex items-center justify-center text-white font-black text-sm">
            SE
          </div>
          <span className="font-extrabold text-xl text-[#003366] tracking-tight">SMARTEVENT</span>
        </div>

        {/* Center Nav Links - Matching Mockup */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('home')}
            className={`transition-colors ${activeTab === 'home' ? 'text-[#003366] font-bold border-b-2 border-[#003366] pb-0.5' : 'hover:text-[#003366]'}`}
          >
            Discover Events
          </button>
          <button
            onClick={() => setActiveTab('organizer')}
            className={`transition-colors ${activeTab === 'organizer' ? 'text-[#003366] font-bold border-b-2 border-[#003366] pb-0.5' : 'hover:text-[#003366]'}`}
          >
            Organize
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`transition-colors ${activeTab === 'features' ? 'text-[#003366] font-bold border-b-2 border-[#003366] pb-0.5' : 'hover:text-[#003366]'}`}
          >
            Features
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`transition-colors ${activeTab === 'calendar' ? 'text-[#003366] font-bold border-b-2 border-[#003366] pb-0.5' : 'hover:text-[#003366]'}`}
          >
            My Calendar
          </button>
        </nav>

        {/* Auth Controls */}
        <div className="flex items-center space-x-3 text-sm">
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
                onClick={onSignOut}
                title="Log Out"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all ml-1 text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={onOpenAuthModal}
                className="font-semibold text-slate-700 hover:text-[#003366] text-sm"
              >
                Log In
              </button>
              <button
                onClick={onOpenAuthModal}
                className="px-5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold text-sm shadow-sm transition-all"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
