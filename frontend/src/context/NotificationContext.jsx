import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Load user-specific notifications from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`notifications_${user.email}`);
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
      setToasts([]);
    }
  }, [user]);

  // Save to localStorage when notifications state changes
  const saveNotifications = (updated) => {
    setNotifications(updated);
    if (user) {
      localStorage.setItem(`notifications_${user.email}`, JSON.stringify(updated));
    }
  };

  // Add a persistent notification
  const addNotification = (title, message, type = 'info') => {
    const newNotif = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type, // 'info', 'success', 'warning', 'error'
      read: false,
      timestamp: new Date().toISOString(),
    };
    const updated = [newNotif, ...notifications];
    saveNotifications(updated);
  };

  // Add a transient toast alert
  const addToast = (title, message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Helper to add both a notification and a toast
  const notify = (title, message, type = 'info') => {
    addNotification(title, message, type);
    addToast(title, message, type);
  };

  const markAsRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  // Function to scan task deadlines and reschedule count to trigger notifications
  const checkTaskDeadlines = (taskList) => {
    if (!user || !taskList || taskList.length === 0) return;

    const overdueKey = `alerted_overdue_${user.email}`;
    const delayKey = `alerted_delay_${user.email}`;

    const storedOverdue = localStorage.getItem(overdueKey);
    const storedDelay = localStorage.getItem(delayKey);

    const alertedOverdue = storedOverdue ? JSON.parse(storedOverdue) : [];
    const alertedDelay = storedDelay ? JSON.parse(storedDelay) : [];

    const newOverdueAlerts = [...alertedOverdue];
    const newDelayAlerts = [...alertedDelay];

    let changesMade = false;

    taskList.forEach((task) => {
      // 1. Check if Pending task is Overdue
      if (task.status === 'Pending' && task.due_date) {
        const dueDate = new Date(task.due_date);
        const now = new Date();
        if (dueDate < now) {
          // If not alerted yet
          if (!alertedOverdue.includes(task.id)) {
            notify(
              'Overdue Task Alert',
              `The task "${task.title}" is overdue! It was due on ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
              'error'
            );
            newOverdueAlerts.push(task.id);
            changesMade = true;
          }
        }
      }

      // 2. Check if Pending task has been rescheduled/delayed "many times" (delay_count >= 2)
      if (task.status === 'Pending' && task.delay_count >= 2) {
        if (!alertedDelay.includes(task.id)) {
          notify(
            'Procrastination Warning',
            `The task "${task.title}" has been rescheduled ${task.delay_count} times. Consider breaking it down or working on it soon!`,
            'warning'
          );
          newDelayAlerts.push(task.id);
          changesMade = true;
        }
      }
    });

    if (changesMade) {
      localStorage.setItem(overdueKey, JSON.stringify(newOverdueAlerts));
      localStorage.setItem(delayKey, JSON.stringify(newDelayAlerts));
    }
  };

  // Clean up alerts lists when task gets deleted or completed
  const syncAlertedList = (taskList) => {
    if (!user) return;
    const overdueKey = `alerted_overdue_${user.email}`;
    const delayKey = `alerted_delay_${user.email}`;

    const storedOverdue = localStorage.getItem(overdueKey);
    const storedDelay = localStorage.getItem(delayKey);

    if (storedOverdue) {
      const alerted = JSON.parse(storedOverdue);
      // Keep only active pending task IDs
      const activeIds = taskList.filter(t => t.status === 'Pending').map(t => t.id);
      const filtered = alerted.filter(id => activeIds.includes(id));
      localStorage.setItem(overdueKey, JSON.stringify(filtered));
    }
    if (storedDelay) {
      const alerted = JSON.parse(storedDelay);
      const activeIds = taskList.filter(t => t.status === 'Pending' && t.delay_count >= 2).map(t => t.id);
      const filtered = alerted.filter(id => activeIds.includes(id));
      localStorage.setItem(delayKey, JSON.stringify(filtered));
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        addNotification,
        addToast,
        notify,
        markAsRead,
        markAllAsRead,
        clearAll,
        checkTaskDeadlines,
        syncAlertedList,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
