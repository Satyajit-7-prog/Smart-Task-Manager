import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutGrid, BarChart2, LogOut, Sun, Moon, Sparkles } from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, onNavigate }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'analytics', label: 'AI Analytics', icon: BarChart2 },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-200 dark:border-slate-800/80 flex flex-col h-screen fixed left-0 top-0 z-20 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center space-x-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/15">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Smart Task
          </h1>
          <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase -mt-0.5">
            AI Assistant
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/15 to-cyan-500/15 border-l-2 border-cyan-400 text-cyan-300 font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-650 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
        >
          <span className="font-medium">Interface Color</span>
          {isDark ? (
            <div className="flex items-center space-x-1.5 text-yellow-400">
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-cyan-400">
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </div>
          )}
        </button>

        {/* User Block */}
        {user && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {user.full_name || 'Premium User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
