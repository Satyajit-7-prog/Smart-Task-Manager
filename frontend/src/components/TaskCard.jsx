import React from 'react';
import { Calendar, Trash2, Edit3, CheckCircle, Circle, Sparkles, AlertCircle, History } from 'lucide-react';

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }) {
  const isCompleted = task.status === 'Completed';

  // Format Due Date
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    
    // Check if overdue
    const isOverdue = date < now && !isCompleted;
    
    // Formatting options
    const isToday = date.toDateString() === now.toDateString();
    
    let timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let dateStrFormatted = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    return {
      text: isToday ? `Today at ${timeStr}` : `${dateStrFormatted} at ${timeStr}`,
      isOverdue
    };
  };

  const dueDetails = formatDueDate(task.due_date);

  const priorityStyles = {
    High: { bg: 'bg-red-500/10', border: 'border-red-500/25', text: 'text-red-400' },
    Medium: { bg: 'bg-orange-500/10', border: 'border-orange-500/25', text: 'text-orange-400' },
    Low: { bg: 'bg-green-500/10', border: 'border-green-500/25', text: 'text-green-400' }
  };

  const currentPriority = priorityStyles[task.priority] || priorityStyles.Medium;

  return (
    <div 
      className={`glass-panel p-5 rounded-2xl border transition-all duration-300 relative group ${
        isCompleted 
          ? 'opacity-60 bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-900' 
          : 'border-slate-200/60 dark:border-slate-800/40 hover:border-slate-350 dark:hover:border-slate-700/60 hover:bg-slate-50/60 dark:hover:bg-slate-900/65 shadow-md hover:shadow-cyan-500/5 hover:-translate-y-0.5'
      }`}
    >
      {/* Glow highlight on hover for pending high priority items */}
      {!isCompleted && task.priority === 'High' && (
        <div className="absolute -inset-[1px] bg-gradient-to-r from-red-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-[1px]"></div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Toggle Checkbox & Title */}
        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
          <button
            onClick={() => onToggleComplete(task)}
            className="mt-0.5 text-slate-400 hover:text-cyan-400 active:scale-90 transition-all flex-shrink-0"
          >
            {isCompleted ? (
              <CheckCircle className="w-6 h-6 text-cyan-400 fill-cyan-400/10" />
            ) : (
              <Circle className="w-6 h-6 border-slate-600 hover:border-cyan-400" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h3 
              className={`font-semibold text-[15px] leading-snug truncate ${
                isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-xs mt-1 text-slate-650 dark:text-slate-400 line-clamp-2 ${isCompleted ? 'text-slate-500/75' : ''}`}>
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-800/80 rounded-lg transition-all"
            title="Edit Task"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Badges / Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800/40 flex flex-wrap gap-2 items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        
        {/* Left Side: Category & Priority */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Category Badge */}
          {task.category && (
            <span 
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center space-x-1.5 font-medium text-slate-600 dark:text-slate-300"
            >
              <span 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: task.category.color }}
              ></span>
              <span>{task.category.name}</span>
            </span>
          )}

          {/* Priority Badge with Sparkles if AI Predicted */}
          <span 
            className={`px-2.5 py-1 rounded-full border flex items-center space-x-1 font-semibold ${currentPriority.bg} ${currentPriority.border} ${currentPriority.text}`}
          >
            {task.ai_predicted_priority && (
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" title="AI Predicted Priority" />
            )}
            <span>{task.priority}</span>
          </span>

          {/* Delay warnings if task was rescheduled */}
          {task.delay_count > 0 && !isCompleted && (
            <span 
              className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90 font-medium flex items-center space-x-1"
              title={`This task was rescheduled ${task.delay_count} times.`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Rescheduled {task.delay_count}x</span>
            </span>
          )}
        </div>

        {/* Right Side: Due Date */}
        {dueDetails && (
          <div 
            className={`flex items-center space-x-1.5 ${
              dueDetails.isOverdue 
                ? 'text-red-600 dark:text-red-400 font-semibold animate-pulse' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{dueDetails.text}</span>
            {dueDetails.isOverdue && <span className="text-[10px] bg-red-500/15 border border-red-500/25 px-1.5 py-0.5 rounded uppercase tracking-wider">Overdue</span>}
          </div>
        )}
      </div>
    </div>
  );
}
