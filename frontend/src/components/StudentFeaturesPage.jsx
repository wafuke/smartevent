import React from 'react';
import { Bell, Brain, Calendar, ShieldCheck, Zap, Smartphone, CheckCircle } from 'lucide-react';

export default function StudentFeaturesPage() {
  const features = [
    {
      icon: Bell,
      iconBg: "bg-amber-100 text-amber-700",
      title: "Priority SMS Notifications",
      description: "Never miss crucial event updates. Receive classified High-Priority alerts via Africa's Talking API for urgent venue or time changes."
    },
    {
      icon: Brain,
      iconBg: "bg-blue-100 text-blue-700",
      title: "ML Attendance Predictions",
      description: "Scikit-Learn machine learning forecasts event turnout headcount in real time so you know which sessions are filling up fast."
    },
    {
      icon: Calendar,
      iconBg: "bg-indigo-100 text-indigo-700",
      title: "1-Tap RSVP & Calendar Sync",
      description: "Instantly register for campus workshops, Hackathons, and sports competitions with one tap and sync with your personal schedule."
    },
    {
      icon: Smartphone,
      iconBg: "bg-emerald-100 text-emerald-700",
      title: "Cross-Platform Mobile App",
      description: "Dedicated mobile interface (React Native / Expo) optimized for student iOS and Android smartphones."
    }
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12">
      
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h2 className="text-3xl font-black text-[#0f172a] tracking-tight">
          SmartEvent Platform Features
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          SmartEvent combines machine learning attendance predictions with priority SMS dispatch to keep Strathmore University students informed and engaged.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${f.iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
