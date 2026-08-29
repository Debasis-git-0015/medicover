import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout, currentView, navigateToChat, navigateToDashboard } = useAuth();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="role-tag admin">🛡️ Admin</span>;
      case 'management': return <span className="role-tag" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>🏢 Management</span>;
      case 'hod': return <span className="role-tag hod">🎖️ HOD</span>;
      case 'doctor': return <span className="role-tag doctor">🩺 Doctor</span>;
      case 'nurse': return <span className="role-tag nurse">💉 Nurse</span>;
      case 'compounder': return <span className="role-tag compounder">💊 Compounder</span>;
      default: return <span className="badge badge-gray">{role}</span>;
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-brand">
        <div className="brand-icon">🏥</div>
        <div className="brand-text">
          <div className="brand-title">MediCover<span>.my</span></div>
          <div className="brand-subtitle">Health Management System</div>
        </div>
      </div>

      <div className="navbar-center">
        <div className="current-time-badge">
          <span className="live-dot"></span>
          <span>{timeStr || 'Loading clock...'}</span>
        </div>
      </div>

      <div className="navbar-actions">
        {currentView === 'chat' ? (
          <button className="btn btn-primary btn-sm" onClick={navigateToDashboard} title="Return to Dashboard">
            ⬅️ Back to Dashboard
          </button>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={navigateToChat} title="Inter-Staff Hub">
            💬 Staff Hub
          </button>
        )}

        <div className="user-profile-menu">
          <div className="user-avatar">{user.avatar || 'U'}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role-badge">
              {getRoleBadge(user.role)} • <span style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{user.department === 'all' ? 'Hospital' : user.department.toUpperCase()}</span>
            </span>
          </div>
        </div>

        <button className="btn btn-outline-primary btn-sm" onClick={logout} title="Sign Out">
          🚪 Sign Out
        </button>
      </div>
    </header>
  );
};
