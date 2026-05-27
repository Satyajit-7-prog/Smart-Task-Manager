import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCircle2, AlertTriangle, Info, Sparkles, Trash2, X, Check } from 'lucide-react';

export default function NotificationBell() {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900/80 transition-all relative flex items-center justify-center"
        title="Notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center border border-white dark:border-slate-950 shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 z-30 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-250">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-100/50 dark:bg-white/2">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <span>Alert Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 rounded-md text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all text-xs font-semibold flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-xs font-semibold flex items-center space-x-1"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear all</span>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-500/10 border border-slate-500/10 flex items-center justify-center text-slate-500 mb-3 animate-pulse">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-350">All caught up!</p>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-[200px]">
                  No pending alerts or task completions to display.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = {
                  success: CheckCircle2,
                  warning: AlertTriangle,
                  error: AlertTriangle,
                  info: Sparkles,
                }[notif.type] || Info;

                const borderClass = {
                  success: 'border-l-emerald-500 dark:border-l-emerald-500',
                  warning: 'border-l-amber-500 dark:border-l-amber-500',
                  error: 'border-l-rose-500 dark:border-l-rose-500',
                  info: 'border-l-cyan-500 dark:border-l-cyan-500',
                }[notif.type] || 'border-l-slate-500';

                const iconColor = {
                  success: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                  warning: 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
                  error: 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
                  info: 'text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                }[notif.type] || 'text-slate-500';

                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={`p-4 text-left flex items-start space-x-3 hover:bg-slate-100/50 dark:hover:bg-white/3 transition-colors border-l-4 ${borderClass} ${
                      !notif.read ? 'bg-cyan-500/[0.02] dark:bg-cyan-500/[0.01] cursor-pointer' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold truncate ${!notif.read ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[9px] text-slate-500 dark:text-slate-500 flex-shrink-0 ml-1">
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-1 font-medium leading-relaxed ${!notif.read ? 'text-slate-650 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'}`}>
                        {notif.message}
                      </p>
                    </div>

                    {/* Unread Indicator dot */}
                    {!notif.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 self-center flex-shrink-0"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
