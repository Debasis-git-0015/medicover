import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard = () => {
  const { showToast, navigateToChat } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [costReports, setCostReports] = useState([]);
  const [deptFilter, setDeptFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'doctor',
    department: 'eye',
    designation: '',
    shift: 'Morning (08:00 - 16:00)',
    phone: ''
  });

  // New department form state
  const [newDept, setNewDept] = useState({
    id: '',
    name: '',
    code: '',
    head: '',
    icon: '🏥',
    beds: 12
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, deptsRes, reportsRes] = await Promise.all([
        API.getStaff(),
        API.getDepartments(),
        API.getCostReports()
      ]);
      setStaffList(staffRes.data || []);
      setDepartments(deptsRes.data || []);
      setCostReports(reportsRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const togglePasswordVisibility = (staffId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  const copyPassword = (password) => {
    navigator.clipboard.writeText(password);
    showToast('Password copied to clipboard!', 'info');
  };

  const handleToggleStatus = async (staffId) => {
    try {
      const res = await API.toggleStaffStatus(staffId);
      showToast(`Status updated to ${res.data.status}`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ADMIN-ONLY REMOVE ANY STAFF (INCLUDING HOD)
  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const res = await API.deleteStaff(staffToDelete.id);
      showToast(res.message || `Removed ${staffToDelete.name} (${staffToDelete.role.toUpperCase()})`, 'success');
      setStaffToDelete(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.addStaff(newStaff);
      showToast(`Staff member "${newStaff.name}" registered successfully!`, 'success');
      setIsAddStaffModalOpen(false);
      setNewStaff({
        id: '',
        name: '',
        email: '',
        password: '',
        role: 'doctor',
        department: departments.length > 0 ? departments[0].id : 'eye',
        designation: '',
        shift: 'Morning (08:00 - 16:00)',
        phone: ''
      });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ADMIN-ONLY ADD DEPARTMENT
  const handleAddDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.addDepartment(newDept);
      showToast(`Department "${newDept.name}" created successfully!`, 'success');
      setIsAddDeptModalOpen(false);
      setNewDept({
        id: '',
        name: '',
        code: '',
        head: '',
        icon: '🏥',
        beds: 12
      });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filtering
  let filteredStaff = [...staffList];
  if (deptFilter !== 'all') {
    filteredStaff = filteredStaff.filter(s => s.department === deptFilter || (s.department === 'all' && s.role === 'admin'));
  }
  if (roleFilter !== 'all') {
    filteredStaff = filteredStaff.filter(s => s.role === roleFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredStaff = filteredStaff.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }

  const activeDoctors = staffList.filter(s => s.role === 'doctor' && s.status === 'active').length;
  const activeNurses = staffList.filter(s => s.role === 'nurse' && s.status === 'active').length;
  const hodsCount = staffList.filter(s => s.role === 'hod').length;

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

  const emojiOptions = ['🏥', '👁️', '❤️', '👶', '🦴', '🧠', '🩺', '👂', '🔬', '✨', '🩹', '🧪', '🧬', '🚑'];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-nav">
          <div className="sidebar-section-title">Admin Management</div>
          <button className="nav-link active">
            <span className="nav-icon">👥</span>
            <span>All Staff Profiles</span>
          </button>
          <button className="nav-link" onClick={navigateToChat}>
            <span className="nav-icon">💬</span>
            <span>Inter-Staff Hub</span>
          </button>
        </div>
        <div>
          <div style={{ background: 'var(--primary-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)', fontSize: '0.8rem' }}>
            <strong style={{ color: 'var(--primary-900)' }}>Administrator Authority</strong>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
              Full control to add departments, manage login credentials, and remove any staff member or HOD.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="dashboard-main">
        <div className="dashboard-header-row">
          <div className="header-title-group">
            <h1>Hospital Staff Directory & Department Operations</h1>
            <p>Admin oversight for all departments, staff access credentials, and personnel removal.</p>
          </div>
          {/* ADMIN-ONLY ACTIONS: Add Department & Register Staff */}
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setIsAddDeptModalOpen(true)}>
              🏥 Add Department
            </button>
            <button className="btn btn-primary" onClick={() => setIsAddStaffModalOpen(true)}>
              ➕ Register New Staff
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrap blue">👥</div>
            <div className="metric-content">
              <span className="metric-label">Hospital Staff</span>
              <span className="metric-value">{staffList.length}</span>
              <span className="metric-sub">{hodsCount} Department HODs</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap emerald">🏥</div>
            <div className="metric-content">
              <span className="metric-label">Departments</span>
              <span className="metric-value">{departments.length}</span>
              <span className="metric-sub">{departments.reduce((acc, d) => acc + (d.beds || 0), 0)} Total Beds</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap indigo">🩺</div>
            <div className="metric-content">
              <span className="metric-label">Clinical Team</span>
              <span className="metric-value">{activeDoctors} Doctors</span>
              <span className="metric-sub">{activeNurses} Nurses on Duty</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap amber">🛡️</div>
            <div className="metric-content">
              <span className="metric-label">Admin Permissions</span>
              <span className="metric-value">Full Access</span>
              <span className="metric-sub">Add Dept • Remove Staff & HODs</span>
            </div>
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="dept-filter-bar">
          <button
            className={`dept-pill ${deptFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDeptFilter('all')}
          >
            🌐 All Departments ({staffList.length})
          </button>
          {departments.map(d => {
            const count = staffList.filter(s => s.department === d.id).length;
            return (
              <button
                key={d.id}
                className={`dept-pill ${deptFilter === d.id ? 'active' : ''}`}
                onClick={() => setDeptFilter(d.id)}
              >
                {d.icon} {d.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Staff Table Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>📋 Master Staff Records & Passwords</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search staff name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                />
              </div>
              <select
                className="form-control"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: 'auto', fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
              >
                <option value="all">All Roles</option>
                <option value="doctor">Doctors Only</option>
                <option value="nurse">Nurses Only</option>
                <option value="hod">HODs Only</option>
                <option value="compounder">Compounders Only</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>ID Code</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Access Password (Admin View)</th>
                  <th>Shift & Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading staff records...</td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-subtle)' }}>
                      No staff records matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map(s => {
                    const isVisible = visiblePasswords[s.id];
                    const pwd = s.password || `${s.role}123`;
                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>
                              {s.avatar || 'ST'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.8rem', background: 'var(--bg-app)', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                            {s.id}
                          </code>
                        </td>
                        <td>{getRoleBadge(s.role)}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--primary-800)', fontSize: '0.82rem' }}>
                            {s.department === 'all' ? 'Hospital Central' : s.department.toUpperCase()}
                          </span>
                        </td>
                        {/* PASSWORD VISIBILITY COLUMN FOR ADMIN */}
                        <td>
                          <div className="password-cell">
                            <span>{isVisible ? pwd : '••••••••'}</span>
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => togglePasswordVisibility(s.id)}
                              title={isVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isVisible ? '🙈' : '👁️'}
                            </button>
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => copyPassword(pwd)}
                              title="Copy Password"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🕒 {s.shift}</span><br />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>📞 {s.phone}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => setSelectedStaff(s)}
                              title="View Full Profile with Credentials"
                            >
                              👁️ View
                            </button>
                            <button
                              className={`btn btn-sm ${s.status === 'active' ? 'btn-outline-primary' : 'btn-success'}`}
                              onClick={() => handleToggleStatus(s.id)}
                            >
                              {s.status === 'active' ? 'Active' : 'On Leave'}
                            </button>
                            {/* ADMIN-ONLY REMOVE BUTTON (Can remove HOD, Doctor, Nurse, Compounder) */}
                            {s.role !== 'admin' && (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => setStaffToDelete(s)}
                                title={`Remove ${s.role.toUpperCase()} permanently`}
                              >
                                🗑️ Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1.4 MANAGEMENT WEEKLY COST & EXPENDITURE REPORTS SECTION */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">
              <span>📊 Weekly Cost & Operations Reports (Dispatched from Management)</span>
            </div>
            <span className="badge badge-indigo">{costReports.length} Reports Received</span>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Week Period</th>
                  <th>Total Expenditure</th>
                  <th>Bed Expansion</th>
                  <th>Drug Procurement</th>
                  <th>Logistics Overhead</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {costReports.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No cost reports submitted yet from Management.</td>
                  </tr>
                ) : (
                  costReports.map(report => (
                    <tr key={report.id}>
                      <td><code>{report.id}</code></td>
                      <td><strong>{report.weekRange}</strong></td>
                      <td><strong style={{ color: 'var(--primary-700)', fontSize: '1rem' }}>${report.totalCost?.toLocaleString()} USD</strong></td>
                      <td><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>${(report.breakdown?.bedExpansionCost || 0).toLocaleString()}</span></td>
                      <td><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>${(report.breakdown?.drugProcurementCost || 0).toLocaleString()}</span></td>
                      <td><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>${(report.breakdown?.distributionOverhead || 0).toLocaleString()}</span></td>
                      <td>
                        <strong>{report.submittedBy}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>🕒 {report.timestamp}</span>
                      </td>
                      <td>
                        <span className={`badge ${report.status === 'Reviewed by Admin' ? 'badge-emerald' : 'badge-amber'}`}>
                          ● {report.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal: View Staff Profile with Password */}
      {selectedStaff && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">👤 Staff Profile & Credentials</h3>
              <button className="btn-icon" onClick={() => setSelectedStaff(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div className="user-avatar" style={{ width: '70px', height: '70px', fontSize: '1.6rem', margin: '0 auto 0.75rem' }}>
                  {selectedStaff.avatar || 'ST'}
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedStaff.name}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{selectedStaff.designation}</p>
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  {getRoleBadge(selectedStaff.role)}
                  <span className={`badge ${selectedStaff.status === 'active' ? 'badge-emerald' : 'badge-amber'}`}>
                    ● {selectedStaff.status}
                  </span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', padding: '1.2rem', border: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Staff User ID</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>{selectedStaff.id}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Department</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary-700)', marginTop: '0.2rem' }}>{selectedStaff.department.toUpperCase()}</div>
                </div>
                {/* Clear Password View for Admin */}
                <div>
                  <span style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800 }}>🔑 Staff Password</span>
                  <div style={{ fontWeight: 800, color: '#9f1239', marginTop: '0.2rem', fontFamily: 'monospace', background: '#ffe4e6', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                    {selectedStaff.password || `${selectedStaff.role}123`}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Email Address</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>{selectedStaff.email}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Shift</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>{selectedStaff.shift}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Contact Phone</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>{selectedStaff.phone}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setSelectedStaff(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Staff (Admin-Only) */}
      {staffToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header" style={{ background: '#fff1f2', borderBottom: '1px solid #fecdd3' }}>
              <h3 className="modal-title" style={{ color: '#9f1239' }}>⚠️ Confirm Personnel Removal</h3>
              <button className="btn-icon" onClick={() => setStaffToDelete(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                Are you sure you want to permanently remove <strong>{staffToDelete.name}</strong> ({staffToDelete.role.toUpperCase()}) from the <strong>{staffToDelete.department.toUpperCase()}</strong> department?
              </p>
              <div style={{ marginTop: '1rem', background: 'var(--bg-app)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', border: '1px solid var(--border-light)' }}>
                <span>User ID: <code>{staffToDelete.id}</code></span><br />
                <span>Role: <strong>{staffToDelete.designation}</strong></span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginTop: '0.75rem' }}>
                This action will delete the user account and revoke system access immediately.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setStaffToDelete(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmDeleteStaff}>🗑️ Confirm & Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Department (Admin Only) */}
      {isAddDeptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🏥 Create New Hospital Department</h3>
              <button className="btn-icon" onClick={() => setIsAddDeptModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddDeptSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Department Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ENT (Ear, Nose & Throat)"
                    value={newDept.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const code = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
                      const id = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toLowerCase();
                      setNewDept({
                        ...newDept,
                        name,
                        code: newDept.code || code,
                        id: newDept.id || id
                      });
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Department Code <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ENT, DERM"
                      value={newDept.code}
                      onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department ID (Slug) <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ent, derma"
                      value={newDept.id}
                      onChange={(e) => setNewDept({ ...newDept, id: e.target.value.toLowerCase() })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Assigned Head (HOD)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dr. Julian Croft"
                      value={newDept.head}
                      onChange={(e) => setNewDept({ ...newDept, head: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Allocated Ward Beds</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="100"
                      value={newDept.beds}
                      onChange={(e) => setNewDept({ ...newDept, beds: parseInt(e.target.value, 10) || 10 })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Department Icon / Symbol</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {emojiOptions.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        className={`demo-chip ${newDept.icon === emoji ? 'active' : ''}`}
                        style={{
                          fontSize: '1.1rem',
                          padding: '0.35rem 0.6rem',
                          background: newDept.icon === emoji ? 'var(--primary-100)' : 'var(--bg-app)',
                          borderColor: newDept.icon === emoji ? 'var(--primary-600)' : 'var(--border-light)'
                        }}
                        onClick={() => setNewDept({ ...newDept, icon: emoji })}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddDeptModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register New Staff */}
      {isAddStaffModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">➕ Register Hospital Personnel</h3>
              <button className="btn-icon" onClick={() => setIsAddStaffModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddStaffSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Staff Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dr. Julian Croft"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Unique User ID <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. doc_eye2, hod_ent"
                      value={newStaff.id}
                      onChange={(e) => setNewStaff({ ...newStaff, id: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. pass123"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Assigned Role <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    >
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="compounder">Compounder</option>
                      <option value="hod">HOD (Head of Dept)</option>
                      <option value="management">Management (Operations & Logistics)</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={newStaff.department}
                      onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                      ))}
                      <option value="all">All (Central Admin)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation / Title <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Senior Eye Specialist, Head of ENT"
                    value={newStaff.designation}
                    onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="staff@medicover.org"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assigned Shift</label>
                    <select
                      className="form-control"
                      value={newStaff.shift}
                      onChange={(e) => setNewStaff({ ...newStaff, shift: e.target.value })}
                    >
                      <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                      <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                      <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
                      <option value="General (09:00 - 18:00)">General (09:00 - 18:00)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddStaffModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
