import React from 'react';
import { Brain, BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function AnalyticsDashboard() {
  const attendanceData = [
    { month: 'May', registered: 420, predicted: 340, actual: 335 },
    { month: 'Jun', registered: 510, predicted: 410, actual: 425 },
    { month: 'Jul', registered: 380, predicted: 300, actual: 295 },
    { month: 'Aug', registered: 600, predicted: 490, actual: 485 },
    { month: 'Sep', registered: 615, predicted: 492, actual: 490 }
  ];

  const categoryData = [
    { category: 'Academic', turnout: 84 },
    { category: 'Workshops', turnout: 78 },
    { category: 'Seminars', turnout: 72 },
    { category: 'Sports', turnout: 88 },
    { category: 'Career Fair', turnout: 92 }
  ];

  const smsPriorityData = [
    { name: 'High Priority', count: 480, fill: '#dc2626' },
    { name: 'Medium Priority', count: 650, fill: '#d97706' },
    { name: 'Low Priority', count: 290, fill: '#0284c7' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-2xl md:text-3xl font-extrabold text-blue-950 tracking-tight">Machine Learning Predictive Analytics</h2>
        <p className="text-sm text-slate-600 mt-1 font-medium">
          Scikit-learn model evaluation metrics, turnout forecasts, and SMS delivery distribution.
        </p>
      </div>

      {/* Model Performance Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="clean-card p-5 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">ML Model Accuracy (R²)</span>
          <div className="text-3xl font-extrabold text-blue-950">91.2%</div>
          <p className="text-xs text-slate-500">Random Forest Regressor trained on 1,500 event records</p>
        </div>

        <div className="clean-card p-5 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Mean Absolute Error (MAE)</span>
          <div className="text-3xl font-extrabold text-amber-700">± 4.8</div>
          <p className="text-xs text-slate-500">Average student attendance headcount variance</p>
        </div>

        <div className="clean-card p-5 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Priority SMS Turnout Lift</span>
          <div className="text-3xl font-extrabold text-emerald-700">+12.5%</div>
          <p className="text-xs text-slate-500">Increased turnout rate for High-Priority SMS alerts</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="clean-card p-6 space-y-4">
          <h3 className="text-base font-bold text-blue-950 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-800" />
            <span>Registered vs Predicted vs Actual Turnout</span>
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a' }} />
                <Legend />
                <Bar dataKey="registered" name="Total RSVPs" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="predicted" name="ML Predicted" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual Turnout" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clean-card p-6 space-y-4">
          <h3 className="text-base font-bold text-blue-950 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-800" />
            <span>Average Student Turnout Rate by Category (%)</span>
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                <YAxis dataKey="category" type="category" stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a' }} />
                <Bar dataKey="turnout" name="Avg Turnout %" fill="#003366" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Priority SMS Stats */}
      <div className="clean-card p-6 space-y-4">
        <h3 className="text-base font-bold text-blue-950 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-blue-800" />
          <span>Priority SMS Delivery Distribution</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {smsPriorityData.map((item) => (
            <div key={item.name} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{item.name}</span>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></span>
              </div>
              <div className="text-2xl font-extrabold text-blue-950">{item.count}</div>
              <p className="text-[10px] text-slate-500">Messages sent via Africa's Talking API</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
