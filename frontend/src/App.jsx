import React from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { HODDashboard } from './components/hod/HODDashboard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { NurseDashboard } from './components/nurse/NurseDashboard';
import { CompounderDashboard } from './components/compounder/CompounderDashboard';
import { ManagementDashboard } from './components/management/ManagementDashboard';
import { ChatHub } from './components/chat/ChatHub';

import './styles/main.css';
import './styles/dashboard.css';
import './styles/appointment.css';
import './styles/chat.css';

export const App = () => {
  const { user, currentView, toasts, removeToast } = useAuth();

  // If no user authenticated, show login view
  if (!user) {
    return (
      <>
        <Login />
        {/* Toast Notifications */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
              <span>{t.message}</span>
              <button className="btn-icon" style={{ width: '24px', height: '24px', border: 'none' }}>&times;</button>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Render Role Dashboard or Chat Hub
  const renderContent = () => {
    if (currentView === 'chat') {
      return <ChatHub />;
    }

    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'management':
        return <ManagementDashboard />;
      case 'hod':
        return <HODDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'nurse':
        return <NurseDashboard />;
      case 'compounder':
        return <CompounderDashboard />;
      default:
        return <div style={{ padding: '2rem' }}>Unknown user role: {user.role}</div>;
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-viewport">
        {renderContent()}
      </main>

      {/* Global Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
            <span>{t.message}</span>
            <button className="btn-icon" style={{ width: '24px', height: '24px', border: 'none' }}>&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default App;
