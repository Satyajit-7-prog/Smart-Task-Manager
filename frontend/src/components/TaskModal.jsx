import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { api } from '../utils/api';

export default function TaskModal({ isOpen, task, categories, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [categoryId, setCategoryId] = useState('');
  
  // States for creating a category inline
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#06b6d4');
  const [catError, setCatError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      // Format due date for datetime-local input (YYYY-MM-DDTHH:MM)
      if (task.due_date) {
        const d = new Date(task.due_date);
        const pad = (num) => String(num).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDueDate(formatted);
      } else {
        setDueDate('');
      }
      setPriority(task.priority || 'Medium');
      setCategoryId(task.category_id || '');
    } else {
      // Clear inputs for new task
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('Medium');
      setCategoryId('');
    }
    setIsCreatingCategory(false);
    setNewCatName('');
    setCatError('');
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const taskData = {
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      priority,
      category_id: categoryId ? parseInt(categoryId) : null
    };

    onSave(taskData);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCatError('');
    try {
      const newCat = await api.post('/categories/', {
        name: newCatName.trim(),
        color: newCatColor
      });
      // Add to list and select it
      categories.push(newCat);
      setCategoryId(newCat.id);
      setIsCreatingCategory(false);
      setNewCatName('');
    } catch (err) {
      setCatError(err.message || 'Failed to create category.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/55 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-panel w-full max-w-lg p-7 rounded-3xl ai-glow-ring relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6">
          {task ? 'Edit Task Details' : 'Add New Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Task Title
            </label>
            <input
              type="text"
              placeholder="e.g. Schedule team project sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Description (Optional)
            </label>
            <textarea
              placeholder="Brief details or steps..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full min-h-[90px] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="glass-input w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="glass-input w-full appearance-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800/50 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Category
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-semibold transition-colors"
              >
                {isCreatingCategory ? 'Select Existing' : '+ Create Category'}
              </button>
            </div>

            {isCreatingCategory ? (
              <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-3">
                {catError && <p className="text-xs text-red-400">{catError}</p>}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New Category Name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="glass-input py-2 text-sm flex-1"
                  />
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-11 h-11 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="w-full py-2 bg-gradient-to-r from-purple-500/80 to-cyan-500/80 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all"
                >
                  Save Category
                </button>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="glass-input w-full appearance-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end space-x-3 border-t border-slate-200 dark:border-slate-800/50 pt-5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="glass-button-secondary py-2 px-5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-button-primary py-2 px-5 text-sm flex items-center space-x-1.5"
            >
              {!task && <Sparkles className="w-4 h-4 text-white animate-pulse" />}
              <span>{task ? 'Update Details' : 'Generate Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
