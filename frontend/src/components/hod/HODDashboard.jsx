import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const HODDashboard = () => {
  const { user, showToast, navigateToChat } = useAuth();
  const [deptStaff, setDeptStaff] = useState([]);
  const [deptBeds, setDeptBeds] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // HOD Requisition Modal State
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [reqForm, setReqForm] = useState({
    requestType: 'Urgent Drug Supplies',
    items: '',
    quantity: 10,
    priority: 'Urgent',
    notes: ''
  });

  const currentDept = user?.department || 'eye';

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, bedsRes, reqsRes] = await Promise.all([
        API.getStaff({ department: currentDept }),
        API.getBeds({ department: currentDept }),
        API.getRequisitions({ department: currentDept })
      ]);
      setDeptStaff((staffRes.data || []).filter(s => s.department === currentDept));
      setDeptBeds(bedsRes.data || []);
      setRequisitions(reqsRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDept]);

  const handleToggleStatus = async (staffId) => {
    try {
      const res = await API.toggleStaffStatus(staffId);
      showToast(`Duty status updated to ${res.data.status}`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Submit Requirement Request to Management
  const handleReqSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.createRequisition({
        department: currentDept,
        hodName: user.name,
        hodId: user.id,
        ...reqForm
      });
      showToast(res.message || 'Requirement request dispatched to Management!', 'success', 4000);
      setIsReqModalOpen(false);
      setReqForm({
        requestType: 'Urgent Drug Supplies',
        items: '',
        quantity: 10,
        priority: 'Urgent',
        notes: ''
      });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="role-tag admin">🛡️ Admin</span>;
      case 'management': return <span className="role-tag" style={{ background: '#f5f3ff', color: '#6d28d9' }}>🏢 Management</span>;
      case 'hod': return <span className="role-tag hod">🎖️ HOD</span>;
      case 'doctor': return <span className="role-tag doctor">🩺 Doctor</span>;
      case 'nurse': return <span className="role-tag nurse">💉 Nurse</span>;
      case 'compounder': return <span className="role-tag compounder">💊 Compounder</span>;
      default: return <span className="badge badge-gray">{role}</span>;
    }
  };

  let filteredStaff = [...deptStaff];
  if (roleFilter !== 'all') {
    filteredStaff = filteredStaff.filter(s => s.role === roleFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredStaff = filteredStaff.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q)
    );
  }

  const activeStaffCount = deptStaff.filter(s => s.status === 'active').length;
  const pendingReqs = requisitions.filter(r => r.status === 'Pending Review').length;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-nav">
          <div className="sidebar-section-title">Department Console</div>
          <button className="nav-link active">
            <span className="nav-icon">📊</span>
            <span>Department Roster</span>
          </button>
          <button className="nav-link" onClick={() => setIsReqModalOpen(true)}>
            <span className="nav-icon">📋</span>
            <span>Request to Management {pendingReqs > 0 && <span className="badge badge-amber" style={{ marginLeft: 'auto', padding: '0.1rem 0.4rem' }}>{pendingReqs}</span>}</span>
          </button>
          <button className="nav-link" onClick={navigateToChat}>
            <span className="nav-icon">💬</span>
            <span>Staff Discussion</span>
          </button>
        </div>
        <div>
          <div style={{ background: 'var(--accent-amber-light)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a', fontSize: '0.78rem', color: '#92400e' }}>
            <strong>🔒 Scoped Department</strong>
            <p style={{ marginTop: '0.2rem', fontSize: '0.72rem' }}>
              HOD view is strictly isolated to your assigned {currentDept.toUpperCase()} department staff, beds, and requisitions.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="dashboard-main">
        <div className="dept-banner">
          <div className="dept-banner-info">
            <h2>{currentDept.toUpperCase()} Department Console</h2>
            <p>Restricted Departmental Administrative Console • Scoped Strictly to Your Ward Staff</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsReqModalOpen(true)}>
              📋 Request to Management
            </button>
            <div className="dept-banner-badge">
              🔒 Scope: {currentDept.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrap blue">👨‍⚕️</div>
            <div className="metric-content">
              <span className="metric-label">Dept Staff</span>
              <span className="metric-value">{deptStaff.length}</span>
              <span className="metric-sub">{activeStaffCount} currently on shift</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap emerald">🛏️</div>
            <div className="metric-content">
              <span className="metric-label">Ward Status</span>
              <span className="metric-value">{deptBeds.length} Beds</span>
              <span className="metric-sub">Dedicated department beds</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap indigo">📋</div>
            <div className="metric-content">
              <span className="metric-label">Management Requests</span>
              <span className="metric-value">{requisitions.length} Sent</span>
              <span className="metric-sub">{pendingReqs} pending fulfillment</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap amber">⚡</div>
            <div className="metric-content">
              <span className="metric-label">Conflict Engine</span>
              <span className="metric-value">Active</span>
              <span className="metric-sub">Protects Dept Doctors</span>
            </div>
          </div>
        </div>

        {/* HOD Requisitions Tracking Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">
              <span>📋 Requisitions & Requirements Sent to Hospital Management</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setIsReqModalOpen(true)}>
              ➕ Submit New Request to Management
            </button>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Request Type</th>
                  <th>Requested Items & Units</th>
                  <th>Priority</th>
                  <th>Clinical Reason</th>
                  <th>Submitted At</th>
                  <th>Management Status</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '1.75rem', color: 'var(--text-subtle)' }}>
                      No requirement requests sent yet. Click "Submit New Request to Management" above.
                    </td>
                  </tr>
                ) : (
                  requisitions.map(req => (
                    <tr key={req.id}>
                      <td><code>{req.id}</code></td>
                      <td><span className="badge badge-indigo">{req.requestType}</span></td>
                      <td>
                        <strong>{req.items}</strong><br />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quantity: <strong>{req.quantity}</strong></span>
                      </td>
                      <td>
                        <span className={`badge ${req.priority === 'Critical Emergency' ? 'badge-rose' : (req.priority === 'Urgent' ? 'badge-amber' : 'badge-emerald')}`}>
                          ● {req.priority}
                        </span>
                      </td>
                      <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.notes || 'N/A'}</span></td>
                      <td><span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>🕒 {req.timestamp}</span></td>
                      <td>
                        <span className={`badge ${req.status === 'Approved & Fulfilled' ? 'badge-emerald' : (req.status === 'Rejected' ? 'badge-rose' : 'badge-amber')}`}>
                          ● {req.status}
                        </span>
                        {req.fulfilledBy && (
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                            by {req.fulfilledBy} ({req.fulfilledDate})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid-2-col">
          {/* Department Staff Roster */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span>👥 Department Clinical Staff</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', width: '150px' }}
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', width: 'auto' }}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Staff</option>
                  <option value="doctor">Doctors</option>
                  <option value="nurse">Nurses</option>
                  <option value="compounder">Compounders</option>
                </select>
              </div>
            </div>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>ID</th>
                    <th>Role</th>
                    <th>Designation</th>
                    <th>Shift</th>
                    <th>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(s => (
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
                      <td><code>{s.id}</code></td>
                      <td>{getRoleBadge(s.role)}</td>
                      <td><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.designation}</span></td>
                      <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🕒 {s.shift}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => setSelectedStaff(s)}>
                            👁️ Profile
                          </button>
                          <button
                            className={`btn btn-sm ${s.status === 'active' ? 'btn-outline-primary' : 'btn-success'}`}
                            onClick={() => handleToggleStatus(s.id)}
                          >
                            {s.status === 'active' ? 'Active' : 'On Leave'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Beds Visualizer */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span>🛏️ Department Beds & Ward Status</span>
              </div>
            </div>
            <div className="card-body">
              <div className="ward-grid">
                {deptBeds.map(bed => (
                  <div key={bed.id} className={`bed-card ${bed.status}`}>
                    <div className="bed-header">
                      <span className="bed-number">{bed.id}</span>
                      <span className={`badge ${bed.status === 'occupied' ? 'badge-blue' : (bed.status === 'critical' ? 'badge-rose' : 'badge-emerald')}`}>
                        ● {bed.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="bed-body">
                      <div className="bed-patient-name">{bed.patientName || 'Vacant Bed'}</div>
                      <div className="bed-patient-detail">{bed.vitalsSummary || 'Ready'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal: Request Requirements to Management */}
      {isReqModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📋 Request Requirements to Management</h3>
              <button className="btn-icon" onClick={() => setIsReqModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleReqSubmit}>
              <div className="modal-body">
                <div style={{ background: 'var(--primary-50)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                  <strong>From:</strong> {user.name} ({currentDept.toUpperCase()} Department HOD)<br />
                  <strong>To:</strong> Hospital Management & Operations Desk
                </div>

                <div className="form-group">
                  <label className="form-label">Requirement Category <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={reqForm.requestType}
                    onChange={(e) => setReqForm({ ...reqForm, requestType: e.target.value })}
                  >
                    <option value="Urgent Drug Supplies">Urgent Drug Supplies / Medications</option>
                    <option value="Additional Beds">Additional Ward / Telemetry Beds</option>
                    <option value="Surgical Equipment">Surgical & Clinical Equipment</option>
                    <option value="Staffing / Other">Staffing & Ward Logistics</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Specific Items / Equipment Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Timolol 0.5% Drops (20 bottles) or 2 Acute Beds"
                    value={reqForm.items}
                    onChange={(e) => setReqForm({ ...reqForm, items: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Quantity Needed <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="1000"
                      value={reqForm.quantity}
                      onChange={(e) => setReqForm({ ...reqForm, quantity: parseInt(e.target.value, 10) || 1 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Urgency / Priority</label>
                    <select
                      className="form-control"
                      value={reqForm.priority}
                      onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value })}
                    >
                      <option value="Routine">Routine (Standard Replenishment)</option>
                      <option value="Urgent">Urgent (Within 24 Hours)</option>
                      <option value="Critical Emergency">Critical Emergency (Immediate)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Justification & Notes</label>
                  <textarea
                    className="form-control"
                    placeholder="Explain why this resource is urgently needed for patient care in your department..."
                    value={reqForm.notes}
                    onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsReqModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">🚀 Dispatch Request to Management</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Profile Modal */}
      {selectedStaff && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">👤 Department Staff Details</h3>
              <button className="btn-icon" onClick={() => setSelectedStaff(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div className="user-avatar" style={{ width: '60px', height: '60px', fontSize: '1.4rem', margin: '0 auto 0.5rem' }}>
                  {selectedStaff.avatar}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedStaff.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedStaff.designation}</p>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div><strong>Staff ID:</strong> {selectedStaff.id}</div>
                <div><strong>Department:</strong> {selectedStaff.department.toUpperCase()}</div>
                <div><strong>Shift:</strong> {selectedStaff.shift}</div>
                <div><strong>Phone:</strong> {selectedStaff.phone}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setSelectedStaff(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
