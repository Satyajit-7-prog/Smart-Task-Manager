import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';
import { Brain } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle routing / authentication transitions automatically
  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentPage('app');
      } else {
        if (currentPage === 'app') {
          setCurrentPage('login');
        }
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center space-y-4 transition-colors duration-200">
        {/* Glow behind loading */}
        <div className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Brain className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wider animate-pulse uppercase">
          Synthesizing AI Environment
        </p>
      </div>
    );
  }

  // Handle Unauthenticated Routes
  if (currentPage === 'login') {
    return <Login onNavigate={setCurrentPage} />;
  }

  if (currentPage === 'register') {
    return <Register onNavigate={setCurrentPage} />;
  }

  // Handle Authenticated App
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onNavigate={setCurrentPage} 
      />
      {activeTab === 'dashboard' ? (
        <Dashboard />
      ) : (
        <Analytics />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
