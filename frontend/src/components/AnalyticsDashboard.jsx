import React from 'react';
import { Brain, BarChart3, TrendingUp, CheckCircle2, ShieldCheck, PieChart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from 'recharts';

export default function AnalyticsDashboard() {
  const attendanceData = [
    { month: 'May', registered: 420, predicted: 340, actual: 335 },
    { month: 'Jun', registered: 510, predicted: 410, actual: 425 },
    { month: 'Jul', registered: 380, predicted: 300, actual: 295 },
    { month: 'Aug', registered: 600, predicted: 490, actual: 485 },
    { month: 'Sep', registered: 615, predicted: 492, actual: 490 }
  ];

  const categoryData = [
    { category: 'Academic', count: 4, turnout: 84 },
    { category: 'Workshops', categoryFull: 'Hands-on Workshops', count: 3, turnout: 78 },
    { category: 'Seminars', count: 2, turnout: 72 },
    { category: 'Sports', count: 2, turnout: 88 },
    { category: 'Career Fair', count: 1, turnout: 92 }
  ];

  const smsPriorityData = [
    { name: 'High Priority', count: 480, fill: '#ef4444' },
    { name: 'Medium Priority', count: 650, fill: '#f59e0b' },
    { name: 'Low Priority', count: 290, fill: '#3b82f6' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 border-l-4 border-l-indigo-500">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Machine Learning Predictive Analytics & System Reports</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative analysis of Scikit-learn Random Forest attendance predictions versus actual turnout rates.
            </p>
          </div>
        </div>
      </div>

      {/* Model Performance Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase">ML Model Accuracy (R² Score)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">91.2%</span>
            <span className="text-xs text-emerald-400 font-semibold">High Precision</span>
          </div>
          <p className="text-xs text-slate-400">Random Forest Regressor trained on 1,200 historical event records.</p>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase">Mean Absolute Error (MAE)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-400">± 4.8</span>
            <span className="text-xs text-slate-400">Attendees</span>
          </div>
          <p className="text-xs text-slate-400">Average variance between predicted and actual event headcount.</p>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase">Priority SMS Turnout Boost</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400">+12.5%</span>
            <span className="text-xs text-emerald-400 font-semibold">Turnout Lift</span>
          </div>
          <p className="text-xs text-slate-400">High-priority SMS alerts significantly increase student attendance.</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Predicted vs Actual Attendance */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span>Registered vs Predicted vs Actual Attendance</span>
            </h3>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Bar dataKey="registered" name="Total RSVPs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="predicted" name="ML Predicted" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual Turnout" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Turnout Rate by Event Category */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span>Average Student Turnout Rate by Category (%)</span>
            </h3>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="turnout" name="Avg Turnout %" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Priority SMS Volume Distribution Card */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>Priority SMS Delivery Engine Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {smsPriorityData.map((item) => (
            <div key={item.name} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">{item.name}</span>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></span>
              </div>
              <div className="text-2xl font-bold text-white">{item.count}</div>
              <p className="text-[10px] text-slate-400">Messages sent through Africa's Talking API</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
