import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { 
  Sparkles, Plus, Search, Filter, RefreshCw, CheckCircle2, 
  Hourglass, AlertTriangle, Lightbulb 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  
  // NLP state
  const [nlpInput, setNlpInput] = useState('');
  const [nlpParsing, setNlpParsing] = useState(false);
  const [nlpFeedback, setNlpFeedback] = useState(null);
  const nlpParsingRef = useRef(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch categories
      const catData = await api.get('/categories/');
      setCategories(catData);

      // Construct task query params
      let params = [];
      if (statusFilter) params.push(`status_filter=${statusFilter}`);
      if (priorityFilter) params.push(`priority_filter=${priorityFilter}`);
      if (categoryFilter) params.push(`category_id_filter=${categoryFilter}`);
      
      const queryStr = params.length > 0 ? `?${params.join('&')}` : '';
      const taskData = await api.get(`/tasks/${queryStr}`);
      setTasks(taskData);

      // Fetch analytics summary for dashboard counters and AI insights banner
      const analyticsData = await api.get('/analytics/');
      setAnalyticsSummary(analyticsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Task operation: Toggle complete status
  const handleToggleComplete = async (task) => {
    try {
      const updatedStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      const updatedTask = await api.put(`/tasks/${task.id}`, { status: updatedStatus });
      
      // Update list locally
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      
      // Fetch fresh analytics
      const analyticsData = await api.get('/analytics/');
      setAnalyticsSummary(analyticsData);
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  // Task operation: Save (Create / Update)
  const handleSaveTask = async (taskData) => {
    try {
      if (selectedTask) {
        // Update task
        const updated = await api.put(`/tasks/${selectedTask.id}`, taskData);
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));
      } else {
        // Create task
        const created = await api.post('/tasks/', taskData);
        setTasks(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
      setSelectedTask(null);

      // Fetch fresh analytics
      const analyticsData = await api.get('/analytics/');
      setAnalyticsSummary(analyticsData);
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  // Task operation: Delete
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      
      // Fetch fresh analytics
      const analyticsData = await api.get('/analytics/');
      setAnalyticsSummary(analyticsData);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // NLP operation: Quick Add
  const handleNlpSubmit = async (e) => {
    e.preventDefault();
    if (!nlpInput.trim() || nlpParsing || nlpParsingRef.current) return;
    
    nlpParsingRef.current = true;
    setNlpParsing(true);
    setNlpFeedback(null);
    try {
      const createdTask = await api.post('/tasks/nlp-quick-add', { text: nlpInput.trim() });
      setTasks(prev => [createdTask, ...prev]);
      setNlpInput('');
      
      // Render clean parsing feedback
      setNlpFeedback({
        success: true,
        message: `Parsed: "${createdTask.title}"`
      });
      setTimeout(() => setNlpFeedback(null), 4000);

      // Fetch fresh analytics
      const analyticsData = await api.get('/analytics/');
      setAnalyticsSummary(analyticsData);
    } catch (err) {
      setNlpFeedback({
        success: false,
        message: err.message || 'NLP Parsing failed.'
      });
    } finally {
      nlpParsingRef.current = false;
      setNlpParsing(false);
    }
  };

  // Filter tasks locally by search term
  const filteredTasks = tasks.filter(task => {
    const search = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(search) ||
      (task.description && task.description.toLowerCase().includes(search))
    );
  });

  return (
    <div className="pl-64 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Banner and Quick actions */}
      <header className="p-8 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between transition-colors">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hi, {user ? (user.full_name || user.email.split('@')[0]) : 'Productive Mind'} 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Let's manage your schedule with our productivity assistance engine.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900/80 transition-all ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Refresh Sync"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              setSelectedTask(null);
              setIsModalOpen(true);
            }}
            className="glass-button-primary py-2.5 px-5 flex items-center space-x-2 font-bold text-sm"
          >
            <Plus className="w-4 h-4 text-white stroke-[3px]" />
            <span>New Task</span>
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      {analyticsSummary && (
        <section className="px-8 pt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider block">Total Tasks</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 block">{analyticsSummary.summary.total_tasks}</span>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Hourglass className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider block">Completed</span>
              <span className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1 block">{analyticsSummary.summary.completed_tasks}</span>
            </div>
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider block">Completion Rate</span>
              <span className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1 block">{analyticsSummary.summary.completion_rate}%</span>
            </div>
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider block">Overdue</span>
              <span className={`text-3xl font-extrabold mt-1 block ${analyticsSummary.summary.overdue_tasks > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-slate-500 dark:text-slate-300'}`}>
                {analyticsSummary.summary.overdue_tasks}
              </span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              analyticsSummary.summary.overdue_tasks > 0 
                ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400' 
                : 'bg-slate-500/10 border border-slate-200 dark:border-slate-500/20 text-slate-500 dark:text-slate-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </section>
      )}

      {/* AI Suggestions / Insight Banner */}
      {analyticsSummary && analyticsSummary.insights && analyticsSummary.insights.length > 0 && (
        <section className="px-8 pt-6">
          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-cyan-400 bg-gradient-to-r from-cyan-500/5 to-transparent flex items-start space-x-3.5 shadow-lg shadow-cyan-500/5">
            <div className="mt-1 bg-cyan-500/10 p-1.5 rounded-lg border border-cyan-500/20 text-cyan-400">
              <Lightbulb className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">AI Productivity Companion</h4>
              <ul className="mt-2 space-y-1.5">
                {analyticsSummary.insights.map((insight, idx) => (
                  <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* NLP Quick Add Bar */}
      <section className="px-8 pt-6">
        <form onSubmit={handleNlpSubmit} className="glass-panel p-4 rounded-2xl relative">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-cyan-500 dark:text-cyan-400 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Quick Add task with AI: 'Submit physics lab tomorrow evening' or 'Client call on Friday at 3 PM'"
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/50 pl-12 pr-28 py-3 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-800/80 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm backdrop-blur-md transition-colors"
              disabled={nlpParsing}
            />
            <button
              type="submit"
              disabled={nlpParsing || !nlpInput.trim()}
              className="absolute right-2 py-2 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {nlpParsing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <span>AI Parse</span>
                </>
              )}
            </button>
          </div>
          {nlpFeedback && (
            <div className={`mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg inline-block border ${
              nlpFeedback.success 
                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300' 
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {nlpFeedback.message}
            </div>
          )}
        </form>
      </section>

      {/* Filters Strip */}
      <section className="px-8 pt-6 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input pl-10 py-2.5 text-sm w-full"
          />
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input py-2 px-3 text-xs appearance-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="glass-input py-2 px-3 text-xs appearance-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="glass-input py-2 px-3 text-xs appearance-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Task Grid / View */}
      <main className="p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Loading task data...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-panel p-16 rounded-3xl text-center flex flex-col items-center justify-center">
            <Sparkles className="w-12 h-12 text-slate-500 mb-4 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No active tasks found</h3>
            <p className="text-slate-500 dark:text-slate-450 text-sm max-w-md mt-1.5">
              Add a new task manually or parse a quick-add query in plain English to populate your board!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={(task) => {
                  setSelectedTask(task);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </main>

      {/* Edit/Create Modal */}
      <TaskModal
        isOpen={isModalOpen}
        task={selectedTask}
        categories={categories}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveTask}
      />
    </div>
  );
}
