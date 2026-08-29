import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../services/api';

const AuthContext = createContext(null);
const SESSION_KEY = 'medicover_active_session_v1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Navigation state: 'dashboard' or 'chat'
  const [currentView, setCurrentView] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const login = async (userId, password, role, department = null) => {
    const res = await API.login(userId, password, role, department);
    if (res.success && res.user) {
      setUser(res.user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(res.user));
      setCurrentView('dashboard');
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      return res.user;
    }
    throw new Error(res.message || 'Authentication failed.');
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    setCurrentView('dashboard');
    showToast('Signed out successfully.', 'info');
  };

  const navigateToChat = () => {
    setCurrentView('chat');
  };

  const navigateToDashboard = () => {
    setCurrentView('dashboard');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        currentView,
        setCurrentView,
        navigateToChat,
        navigateToDashboard,
        showToast,
        toasts,
        removeToast
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
