import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { CheckCircle2, AlertTriangle, Info, X, Sparkles } from 'lucide-react';

export default function ToastContainer() {
  const { toasts } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = {
          success: CheckCircle2,
          warning: AlertTriangle,
          error: AlertTriangle,
          info: Sparkles,
        }[toast.type] || Info;

        const colorClasses = {
          success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/5',
          warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-amber-500/5',
          error: 'border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-rose-500/5',
          info: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400 shadow-cyan-500/5',
        }[toast.type] || 'border-slate-500/20 bg-slate-500/10 text-slate-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-2xl border backdrop-blur-xl shadow-lg border-solid transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${colorClasses}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <Icon className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-bold truncate leading-snug">{toast.title}</h5>
              <p className="text-xs text-slate-650 dark:text-slate-350 mt-1 font-medium leading-relaxed">
                {toast.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
