import React, { useState } from 'react';
import { Search, Calendar, MapPin, Clock, Check, Bell, TrendingUp, Sparkles, BookOpen, Palette, Film, Award } from 'lucide-react';

export default function StudentLandingPage({ events, registeredEventIds, onRegisterEvent, onNavigateOrganizer, onOpenAuthModal }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const categories = ['All', 'Academic', 'Workshop', 'Seminar', 'Sports', 'Career Fair'];

  // Default featured events matching the uploaded UI mockup
  const featuredEvents = [
    {
      id: "evt-f1",
      title: "CS Club Hackathon",
      date: "Nov 15",
      time: "5:00 PM",
      location: "Tech Center",
      badge: "Register to get reminders.",
      category: "Academic",
      icon: BookOpen,
      iconBg: "bg-blue-100 text-blue-700"
    },
    {
      id: "evt-f2",
      title: "Art Society Workshop",
      date: "Nov 16",
      time: "2:00 PM",
      location: "Art Studio",
      badge: "Seats filling up fast!",
      category: "Workshop",
      icon: Palette,
      iconBg: "bg-amber-100 text-amber-700"
    },
    {
      id: "evt-f3",
      title: "Campus Movie Night",
      date: "Nov 18",
      time: "7:00 PM",
      location: "Amphitheater",
      badge: "High prediction: Arrive early!",
      category: "Social",
      icon: Film,
      iconBg: "bg-red-100 text-red-700"
    }
  ];

  const filteredEvents = events.filter(evt => {
    const matchesCat = selectedCategory === 'All' || evt.category === selectedCategory;
    const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-16 pb-12">
      
      {/* HERO BANNER - Matching Uploaded Image Layout */}
      <section className="relative pt-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0f172a] tracking-tight leading-[1.1]">
              University Events, <br />
              <span className="text-[#003366]">Smarter.</span>
            </h1>

            <div className="space-y-3 text-slate-600 text-sm md:text-base leading-relaxed">
              <p>
                <strong className="text-slate-900 font-bold">Clubs & Organizers:</strong> List events, predict attendance, and optimize success.
              </p>
              <p>
                <strong className="text-slate-900 font-bold">Students:</strong> Discover, register, and prioritize what matters most to you.
              </p>
            </div>

            {/* Action Buttons matching image */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onNavigateOrganizer}
                className="px-6 py-3 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
              >
                For Organizers: List Event
              </button>

              <a
                href="#discover-feed"
                className="px-6 py-3 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
              >
                For Students: Find Events
              </a>
            </div>
          </div>

          {/* Right Hero Illustration Container matching uploaded image */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-full max-w-md p-6 rounded-3xl bg-gradient-to-tr from-blue-50 via-slate-100 to-indigo-50 border border-slate-200/80 shadow-xl relative overflow-hidden">
              
              {/* Graphic Illustration Cards */}
              <div className="space-y-4">
                
                {/* Attendance Prediction Badge */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#003366] flex items-center justify-center font-bold">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Attendance Prediction</span>
                      <span className="text-[10px] font-semibold text-emerald-600">88% Accuracy Rate</span>
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-extrabold text-[#003366]">
                    LIVE
                  </div>
                </div>

                {/* Campus Event Hub Box */}
                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-md text-center space-y-3">
                  <div className="w-16 h-16 bg-blue-900 rounded-2xl mx-auto flex items-center justify-center text-amber-400 font-extrabold text-2xl shadow-md">
                    🏫
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Strathmore Campus Event Hub</h4>
                  <p className="text-xs text-slate-500">Priority SMS Alerts & ML Attendance Forecasting</p>
                </div>

                {/* Registration Notification Badge */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Instant Student RSVP</span>
                    <span className="text-[10px] text-slate-500">Priority SMS Alert Scheduled</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DISCOVER SMARTEVENT - Top 3 Cards Row Matching Uploaded Image */}
      <section className="space-y-6 pt-4">
        <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
          Discover Smartevent
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredEvents.map((evt) => {
            const Icon = evt.icon;
            return (
              <div 
                key={evt.id} 
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${evt.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{evt.title}</h3>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p><strong>Date:</strong> {evt.date} | <strong>Time:</strong> {evt.time}</p>
                  <p><strong>Location:</strong> {evt.location}</p>
                </div>

                <div className="pt-2 text-xs font-semibold text-blue-900">
                  {evt.badge}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MAIN ALL EVENTS DISCOVERY FEED */}
      <section id="discover-feed" className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
              All Available Campus Events
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Explore workshops, academic talks, and sports competitions</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#003366]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#003366] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isRegistered = registeredEventIds.includes(evt.id);
            const utilPct = Math.round(((evt.registrationCount || 0) / evt.venueCapacity) * 100);

            return (
              <div 
                key={evt.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#003366] border border-blue-200">
                      {evt.category}
                    </span>
                    {isRegistered && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                        <Check className="w-3 h-3 inline" />
                        <span>REGISTERED</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{evt.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{evt.description}</p>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-700" />
                      <span>{evt.date} • {evt.time || evt.timeSlot}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{evt.venue} ({evt.venueCapacity} seats)</span>
                    </div>
                  </div>
                </div>

                {/* Capacity Fill Meter */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                    <span>Capacity Fill:</span>
                    <span className="text-slate-900 font-bold">{evt.registrationCount} / {evt.venueCapacity}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-[#003366] h-full rounded-full" style={{ width: `${Math.min(utilPct, 100)}%` }}></div>
                  </div>
                </div>

                {/* RSVP Action */}
                <button
                  onClick={() => onRegisterEvent(evt.id)}
                  disabled={isRegistered}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 ${
                    isRegistered
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white'
                  }`}
                >
                  {isRegistered ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>RSVP Confirmed</span>
                    </>
                  ) : (
                    <span>Register / RSVP Now</span>
                  )}
                </button>

              </div>
            );
          })}
        </div>

      </section>

      {/* FOOTER - Matching Uploaded Image Layout */}
      <footer className="pt-8 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          © 2026 <strong>SmartEvent.edu</strong> | University Event Solutions
        </div>
        <div className="flex space-x-6 font-semibold">
          <span className="hover:text-slate-900 cursor-pointer">About</span>
          <span className="hover:text-slate-900 cursor-pointer">Contact</span>
          <span className="hover:text-slate-900 cursor-pointer">Privacy</span>
        </div>
      </footer>

    </div>
  );
}
