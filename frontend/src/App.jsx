import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import { Brain } from 'lucide-react';
import ToastContainer from './components/ToastContainer';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Handle routing / authentication transitions automatically
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (!initialCheckDone) {
          setCurrentPage('app');
          setInitialCheckDone(true);
        } else if (currentPage !== 'login' && currentPage !== 'register' && currentPage !== 'forgot-password') {
          setCurrentPage('app');
        }
      } else {
        setInitialCheckDone(true);
        if (currentPage === 'app') {
          setCurrentPage('login');
        }
      }
    }
  }, [user, loading, currentPage, initialCheckDone]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center space-y-4 transition-colors duration-200">
        {/* Glow behind loading */}
        <div className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Brain className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wider animate-pulse uppercase">
          Loading...
        </p>
      </div>
    );
  }

  // Handle Unauthenticated Routes
  if (currentPage === 'login') {
    return (
      <>
        <Login onNavigate={setCurrentPage} />
        <ToastContainer />
      </>
    );
  }

  if (currentPage === 'register') {
    return (
      <>
        <Register onNavigate={setCurrentPage} />
        <ToastContainer />
      </>
    );
  }

  if (currentPage === 'forgot-password') {
    return (
      <>
        <ForgotPassword onNavigate={setCurrentPage} />
        <ToastContainer />
      </>
    );
  }

  // Handle Authenticated App
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 animate-page-fade-in">
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
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
