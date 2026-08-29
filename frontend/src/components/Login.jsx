import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API } from '../services/api';
import '../styles/login.css';

export const Login = () => {
  const { login, showToast } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [department, setDepartment] = useState('eye');
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.getDepartments()
      .then(res => {
        if (res.data && res.data.length > 0) {
          setDepartments(res.data);
          setDepartment(res.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(userId, password, role, department);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoId, demoPass, demoRole, demoDept = 'eye') => {
    setUserId(demoId);
    setPassword(demoPass);
    setRole(demoRole);
    if (demoDept) setDepartment(demoDept);

    setLoading(true);
    try {
      await login(demoId, demoPass, demoRole, demoDept);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-view">
      <div className="login-bg-decor"></div>
      <div className="login-bg-decor-2"></div>

      <div className="login-wrapper">
        {/* Left Hero Section */}
        <div className="login-hero">
          <div className="hero-pill">
            <span className="hero-pill-badge">CLINICAL SUITE</span>
            <span>Intelligent Hospital Operations & React Engine</span>
          </div>
          <h1 className="hero-heading">Unified Care. <span>Seamless Operations.</span></h1>
          <p className="hero-description">
            Experience role-tailored workflows for Hospital Administrators, Department Heads, Physicians, Ward Nurses, and Pharmacy Compounders with full conflict protection.
          </p>

          <div className="role-highlights-grid">
            <div className="role-highlight-card">
              <div className="role-highlight-icon admin">🛡️</div>
              <div className="role-highlight-info">
                <h4>Hospital Admin</h4>
                <p>Full staff profile access with credentials, department creation & staff removal.</p>
              </div>
            </div>
            <div className="role-highlight-card">
              <div className="role-highlight-icon hod">🎖️</div>
              <div className="role-highlight-info">
                <h4>Department HOD</h4>
                <p>Strictly scoped access to department-specific staff & rosters.</p>
              </div>
            </div>
            <div className="role-highlight-card">
              <div className="role-highlight-icon doctor">🩺</div>
              <div className="role-highlight-info">
                <h4>Doctor / Physician</h4>
                <p>Consultation triage, EMR notes & appointment conflict shield.</p>
              </div>
            </div>
            <div className="role-highlight-card">
              <div className="role-highlight-icon nurse">💉</div>
              <div className="role-highlight-info">
                <h4>Ward Nurse</h4>
                <p>Bed status matrix, vitals logger & medication rounds.</p>
              </div>
            </div>
            <div className="role-highlight-card" style={{ gridColumn: '1 / -1' }}>
              <div className="role-highlight-icon compounder">💊</div>
              <div className="role-highlight-info">
                <h4>Compounder / Pharmacist</h4>
                <p>Live prescription fulfillment, dosage verification, & inventory alerts.</p>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Demo Accounts */}
          <div className="demo-accounts-section">
            <div className="demo-title">
              <span>⚡ Fast 1-Click Demo Login</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Click to auto-fill & login</span>
            </div>
            <div className="demo-btn-group">
              <button type="button" className="demo-chip" onClick={() => handleDemoLogin('admin101', 'admin123', 'admin')}>
                <span className="dot dot-admin"></span> Admin (Sarah Jenkins)
              </button>
              <button type="button" className="demo-chip" onClick={() => handleDemoLogin('mgr101', 'mgr123', 'management')}>
                <span className="dot" style={{ backgroundColor: '#7c3aed' }}></span> Management (Arthur Sterling)
              </button>
              <button type="button" className="demo-chip" onClick={() => handleDemoLogin('hod_eye', 'eye123', 'hod', 'eye')}>
                <span className="dot dot-hod"></span> HOD Eye (Dr. Evelyn Reed)
              </button>
              <button type="button" className="demo-chip" onClick={() => handleDemoLogin('doc_eye1', 'doc123', 'doctor', 'eye')}>
                <span className="dot dot-doc"></span> Doctor (Dr. Alistair Vance)
              </button>
              <button type="button" className="demo-chip" onClick={() => handleDemoLogin('nurse_eye1', 'nurse123', 'nurse', 'eye')}>
                <span className="dot dot-nurse"></span> Nurse (Sister Clara Belle)
              </button>
              <button type="button" className="demo-chip" onClick={() => handleDemoLogin('comp_eye1', 'comp123', 'compounder', 'eye')}>
                <span className="dot dot-comp"></span> Compounder (Rajesh Patel)
              </button>
            </div>
          </div>
        </div>

        {/* Right Login Card */}
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-brand-icon">🏥</div>
            <h2>Staff Portal Login</h2>
            <p>Select your designation radio option and sign in</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Role Radio Group */}
            <div className="role-selector-container">
              <label className="role-selector-label">1. Select Your Staff Designation:</label>
              <div className="role-radio-grid">
                <label className="role-radio-option">
                  <input
                    type="radio"
                    name="login_role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={() => setRole('admin')}
                  />
                  <div className="role-radio-card">
                    <span className="icon">🛡️</span>
                    <span className="name">Admin</span>
                    <span className="sub">Full Access</span>
                  </div>
                </label>
                <label className="role-radio-option">
                  <input
                    type="radio"
                    name="login_role"
                    value="management"
                    checked={role === 'management'}
                    onChange={() => setRole('management')}
                  />
                  <div className="role-radio-card">
                    <span className="icon">🏢</span>
                    <span className="name">Management</span>
                    <span className="sub">Logistics & Beds</span>
                  </div>
                </label>
                <label className="role-radio-option">
                  <input
                    type="radio"
                    name="login_role"
                    value="hod"
                    checked={role === 'hod'}
                    onChange={() => setRole('hod')}
                  />
                  <div className="role-radio-card">
                    <span className="icon">🎖️</span>
                    <span className="name">HOD</span>
                    <span className="sub">Dept Scope</span>
                  </div>
                </label>
              </div>

              <div className="role-radio-grid" style={{ marginTop: '0.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <label className="role-radio-option">
                  <input
                    type="radio"
                    name="login_role"
                    value="doctor"
                    checked={role === 'doctor'}
                    onChange={() => setRole('doctor')}
                  />
                  <div className="role-radio-card">
                    <span className="icon">🩺</span>
                    <span className="name">Doctor</span>
                    <span className="sub">Clinical</span>
                  </div>
                </label>
                <label className="role-radio-option">
                  <input
                    type="radio"
                    name="login_role"
                    value="nurse"
                    checked={role === 'nurse'}
                    onChange={() => setRole('nurse')}
                  />
                  <div className="role-radio-card">
                    <span className="icon">💉</span>
                    <span className="name">Nurse</span>
                    <span className="sub">Ward Care</span>
                  </div>
                </label>
                <label className="role-radio-option">
                  <input
                    type="radio"
                    name="login_role"
                    value="compounder"
                    checked={role === 'compounder'}
                    onChange={() => setRole('compounder')}
                  />
                  <div className="role-radio-card">
                    <span className="icon">💊</span>
                    <span className="name">Compounder</span>
                    <span className="sub">Pharmacy</span>
                  </div>
                </label>
              </div>

              {role === 'hod' && (
                <div className="hod-department-picker">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Select HOD Department Scope:</label>
                  <select
                    className="form-control"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '0.45rem' }}
                  >
                    {departments.length > 0 ? (
                      departments.map(d => (
                        <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="eye">👁️ Ophthalmology (Eye Department)</option>
                        <option value="cardio">❤️ Cardiology Department</option>
                        <option value="pedia">👶 Pediatrics Department</option>
                        <option value="ortho">🦴 Orthopedics Department</option>
                        <option value="neuro">🧠 Neurology Department</option>
                        <option value="general">🩺 General Medicine</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* User ID */}
            <div className="form-group">
              <label className="form-label">2. Staff User ID <span className="required">*</span></label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. admin101, doc_eye1"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">3. Access Password <span className="required">*</span></label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  title="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            <button type="submit" className="btn-login-submit" disabled={loading}>
              <span>{loading ? 'Authenticating...' : 'Secure Authenticate & Enter'}</span> ➔
            </button>
          </form>

          <div className="login-security-footer">
            <span>🔒 React Frontend • REST API Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
