import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import NotificationBell from '../components/NotificationBell';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
import { Sparkles, Brain, Award, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/');
      setData(res);
    } catch (err) {
      console.error('Error fetching analytics details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pl-64 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center space-y-4 transition-colors duration-200">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Computing advanced productivity analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pl-64 p-8 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center flex flex-col items-center justify-center transition-colors duration-200">
        <Brain className="w-12 h-12 text-slate-500 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No telemetry recorded yet</h3>
        <p className="text-slate-500 dark:text-slate-450 text-sm max-w-sm mt-1">
          Complete some tasks to unlock your detailed behavior models and productivity charts!
        </p>
      </div>
    );
  }

  const { summary, daily_trend, category_breakdown, hourly_distribution, insights } = data;

  return (
    <div className="pl-64 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-12 transition-colors duration-200 animate-tab-fade-in">
      {/* Header */}
      <header className="p-8 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Productivity Insights</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Deep behavior analytics and historical performance charts computed by the AI Engine.
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <NotificationBell />
        </div>
      </header>

      {/* Grid of Contents */}
      <div className="p-8 space-y-8">
        
        {/* Row 1: Insights & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* AI Insights Companion */}
          <div className="glass-panel p-6 rounded-3xl lg:col-span-2 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 mb-5">
                <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Behavioral Diagnostics</h3>
              </div>
              
              <div className="space-y-4">
                {insights.map((insight, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
                  >
                    <span className="text-sm">
                      {insight.includes('⚠️') ? '⚠️' : insight.includes('🧠') ? '🧠' : '💡'}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {insight.replace(/^[⚠️🧠💡]\s*/, '')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/40 text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center">
              <span>Updated in real-time based on completion signals</span>
              <Award className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            </div>
          </div>

          {/* Performance Summary Metrics */}
          <div className="glass-panel p-6 rounded-3xl space-y-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Metrics Summary</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800/40">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Task Completion Rate</span>
                <span className="text-lg font-extrabold text-green-600 dark:text-green-400">{summary.completion_rate}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800/40">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Completed Tasks</span>
                <span className="text-lg font-extrabold text-cyan-600 dark:text-cyan-400">{summary.completed_tasks}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800/40">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending Tasks</span>
                <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">{summary.pending_tasks}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Reschedule Resets (Overdue)</span>
                <span className={`text-lg font-extrabold ${summary.overdue_tasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-300'}`}>
                  {summary.overdue_tasks}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2.5 border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.completion_rate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Completion Trend & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Completion Trend */}
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Daily Completion Trend</h3>
              </div>
              <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                Last 7 Days
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily_trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    name="Completed Tasks" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    dot={{ stroke: '#06b6d4', strokeWidth: 2, r: 4, fill: '#0b0f19' }}
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    name="Performance Score" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Productivity Breakdowns */}
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4.5 h-4.5 text-purple-500 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Category Telemetry Breakdown</h3>
              </div>
            </div>

            {category_breakdown.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
                Categorize your tasks to populate breakdown graphs!
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={category_breakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="completed" name="Completed Tasks" radius={[6, 6, 0, 0]}>
                      {category_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar dataKey="avg_delay" name="Avg Reschedules" fill="rgba(251, 191, 36, 0.65)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Hourly Productivity distribution */}
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4.5 h-4.5 text-yellow-600 dark:text-yellow-400 animate-pulse" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Hourly Productivity Peak Zones (UTC)</h3>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Discover which hours you are statistically most active</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly_distribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="completions" 
                  name="Task Completions" 
                  stroke="#06b6d4" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorCompletions)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
