import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ManagementDashboard = () => {
  const { user, showToast, navigateToChat } = useAuth();
  const [activeTab, setActiveTab] = useState('requisitions'); // 'requisitions' | 'beds' | 'orders' | 'distributions' | 'reports'
  const [departments, setDepartments] = useState([]);
  const [beds, setBeds] = useState([]);
  const [drugOrders, setDrugOrders] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [costReports, setCostReports] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  // 1. Add Beds Form
  const [bedForm, setBedForm] = useState({
    departmentId: 'eye',
    room: 'Ward Main',
    bedCode: '',
    count: 2
  });

  // 2. Drug Order Form
  const [orderForm, setOrderForm] = useState({
    drugName: 'Moxifloxacin 0.5% Eye Drops',
    category: 'Ophthalmic / Antibiotic',
    quantity: 100,
    unitPrice: 15,
    supplier: 'Alcon Global Pharma'
  });

  // 3. Distribution Form
  const [distForm, setDistForm] = useState({
    drugName: 'Timolol Maleate 0.5% Drops',
    targetDepartment: 'eye',
    quantity: 20
  });

  // 4. Weekly Cost Report Form
  const [reportForm, setReportForm] = useState({
    weekRange: 'Aug 22 - Aug 28, 2026',
    bedExpansionCost: 4500,
    drugProcurementCost: 7800,
    distributionOverhead: 1950
  });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [deptsRes, bedsRes, ordersRes, distsRes, reportsRes, reqsRes, invRes] = await Promise.all([
        API.getDepartments(),
        API.getBeds(),
        API.getDrugOrders(),
        API.getDistributions(),
        API.getCostReports(),
        API.getRequisitions(),
        API.getInventory()
      ]);
      setDepartments(deptsRes.data || []);
      if (deptsRes.data && deptsRes.data.length > 0 && !bedForm.departmentId) {
        setBedForm(prev => ({ ...prev, departmentId: deptsRes.data[0].id }));
      }
      setBeds(bedsRes.data || []);
      setDrugOrders(ordersRes.data || []);
      setDistributions(distsRes.data || []);
      setCostReports(reportsRes.data || []);
      setRequisitions(reqsRes.data || []);
      setInventory(invRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 1.1 Add Beds to Department
  const handleAddBeds = async (e) => {
    e.preventDefault();
    try {
      const res = await API.addManagementBeds(bedForm);
      showToast(res.message || 'Beds successfully allocated!', 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 1.2 Drug Order Submit
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await API.createDrugOrder({
        ...orderForm,
        orderedBy: `${user.name} (Management)`
      });
      showToast(res.message || 'Purchase order placed!', 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 1.3 Drug Distribution Submit
  const handleCreateDistribution = async (e) => {
    e.preventDefault();
    try {
      const res = await API.createDistribution({
        ...distForm,
        dispatchedBy: `${user.name} (Management)`
      });
      showToast(res.message || 'Batch dispatched to department!', 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 1.4 Send Weekly Cost Report to Admin
  const handleSendCostReport = async (e) => {
    e.preventDefault();
    try {
      const res = await API.createCostReport({
        ...reportForm,
        submittedBy: `${user.name} (Director of Management)`
      });
      showToast(res.message || 'Weekly Cost Report dispatched to Hospital Admin!', 'success', 5000);
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Fulfill HOD Requisition
  const handleFulfillRequisition = async (reqId, status) => {
    try {
      const res = await API.updateRequisitionStatus(reqId, {
        status,
        fulfilledBy: `${user.name} (Management)`
      });
      showToast(res.message || `Requisition marked as ${status}`, 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const pendingReqsCount = requisitions.filter(r => r.status === 'Pending Review').length;
  const totalBedsCount = beds.length;
  const totalOrdersAmount = drugOrders.reduce((acc, o) => acc + (o.totalCost || 0), 0);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-nav">
          <div className="sidebar-section-title">Management Desk</div>
          <button
            type="button"
            className={`nav-link ${activeTab === 'requisitions' ? 'active' : ''}`}
            onClick={() => setActiveTab('requisitions')}
          >
            <span className="nav-icon">📥</span>
            <span>HOD Requisitions {pendingReqsCount > 0 && <span className="badge badge-rose" style={{ marginLeft: 'auto', padding: '0.1rem 0.45rem' }}>{pendingReqsCount}</span>}</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'beds' ? 'active' : ''}`}
            onClick={() => setActiveTab('beds')}
          >
            <span className="nav-icon">🛏️</span>
            <span>1.1 Department Beds</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span className="nav-icon">📦</span>
            <span>1.2 Drug Procurement</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'distributions' ? 'active' : ''}`}
            onClick={() => setActiveTab('distributions')}
          >
            <span className="nav-icon">🚚</span>
            <span>1.3 Drug Distribution</span>
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span className="nav-icon">📊</span>
            <span>1.4 Weekly Cost Reports</span>
          </button>
          <button type="button" className="nav-link" onClick={navigateToChat}>
            <span className="nav-icon">💬</span>
            <span>Staff Hub & Intercom</span>
          </button>
        </div>

        <div>
          <div style={{ background: '#f5f3ff', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid #ddd6fe', fontSize: '0.78rem', color: '#5b21b6' }}>
            <strong>🏢 Operations & Logistics</strong>
            <p style={{ marginTop: '0.2rem', fontSize: '0.72rem' }}>
              Responsible for resource allocations, supplier drug procurement, and weekly expenditure reports to Admin.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="dashboard-main">
        <div className="dashboard-header-row">
          <div className="header-title-group">
            <h1>Hospital Management & Operational Logistics</h1>
            <p>Department Bed Provisioning • Bulk Drug Ordering • Departmental Distribution • Admin Cost Reports</p>
          </div>
          <div className="header-actions">
            <span className="badge" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
              🏢 Logged in as Arthur Sterling (Director of Management)
            </span>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrap indigo">📥</div>
            <div className="metric-content">
              <span className="metric-label">HOD Requests</span>
              <span className="metric-value">{pendingReqsCount} Pending</span>
              <span className="metric-sub">{requisitions.length} Total Submissions</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap emerald">🛏️</div>
            <div className="metric-content">
              <span className="metric-label">Hospital Beds</span>
              <span className="metric-value">{totalBedsCount} Beds</span>
              <span className="metric-sub">Across {departments.length} Departments</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap blue">📦</div>
            <div className="metric-content">
              <span className="metric-label">Drug Orders</span>
              <span className="metric-value">${totalOrdersAmount.toLocaleString()}</span>
              <span className="metric-sub">{drugOrders.length} Bulk Purchase Orders</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap amber">📊</div>
            <div className="metric-content">
              <span className="metric-label">Weekly Reports</span>
              <span className="metric-value">{costReports.length} Dispatched</span>
              <span className="metric-sub">Submitted to Hospital Admin</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TAB 0: INCOMING HOD REQUISITIONS
            ========================================================================= */}
        {activeTab === 'requisitions' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span>📥 Incoming Department HOD Resource Requisitions</span>
              </div>
              <span className="badge badge-amber">{pendingReqsCount} Awaiting Review</span>
            </div>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Req #</th>
                    <th>Department</th>
                    <th>Requesting HOD</th>
                    <th>Category</th>
                    <th>Requested Item & Quantity</th>
                    <th>Priority</th>
                    <th>Clinical Justification</th>
                    <th>Status</th>
                    <th>Management Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No requisitions submitted yet.</td>
                    </tr>
                  ) : (
                    requisitions.map(req => (
                      <tr key={req.id}>
                        <td><code>{req.id}</code></td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--primary-800)' }}>
                            {req.department.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <strong>{req.hodName}</strong><br />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>🕒 {req.timestamp}</span>
                        </td>
                        <td><span className="badge badge-indigo">{req.requestType}</span></td>
                        <td>
                          <strong>{req.items}</strong><br />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quantity: <strong>{req.quantity}</strong></span>
                        </td>
                        <td>
                          <span className={`badge ${req.priority === 'Critical Emergency' ? 'badge-rose' : (req.priority === 'Urgent' ? 'badge-amber' : 'badge-emerald')}`}>
                            ● {req.priority}
                          </span>
                        </td>
                        <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.notes || 'Routine department requirement'}</span></td>
                        <td>
                          <span className={`badge ${req.status === 'Approved & Fulfilled' ? 'badge-emerald' : (req.status === 'Rejected' ? 'badge-rose' : 'badge-amber')}`}>
                            ● {req.status}
                          </span>
                          {req.fulfilledBy && (
                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                              by {req.fulfilledBy}
                            </span>
                          )}
                        </td>
                        <td>
                          {req.status === 'Pending Review' ? (
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleFulfillRequisition(req.id, 'Approved & Fulfilled')}
                                title="Approve and fulfill requirements"
                              >
                                ✅ Fulfill
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleFulfillRequisition(req.id, 'Rejected')}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: 1.1 ADD BEDS TO DEPARTMENTS
            ========================================================================= */}
        {activeTab === 'beds' && (
          <div className="grid-2-col">
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span>🛏️ 1.1 Allocate & Expand Department Beds</span>
                </div>
              </div>
              <form onSubmit={handleAddBeds}>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Target Department <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={bedForm.departmentId}
                      onChange={(e) => setBedForm({ ...bedForm, departmentId: e.target.value })}
                      required
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.icon} {d.name} (Current: {d.beds || 0} Beds)</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Ward / Room Location</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Room 105 / Acute Wing"
                        value={bedForm.room}
                        onChange={(e) => setBedForm({ ...bedForm, room: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Number of Beds to Add <span className="required">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="20"
                        value={bedForm.count}
                        onChange={(e) => setBedForm({ ...bedForm, count: parseInt(e.target.value, 10) || 1 })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Custom Bed Code Prefix (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Leave empty for auto-code (e.g. EYE, 108)"
                      value={bedForm.bedCode}
                      onChange={(e) => setBedForm({ ...bedForm, bedCode: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    ➕ Allocate Beds to Department
                  </button>
                </div>
              </form>
            </div>

            {/* Department Bed Quota Summary */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span>📊 Current Department Bed Allocation Matrix</span>
                </div>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Head of Dept (HOD)</th>
                      <th>Beds Quota</th>
                      <th>Live Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map(d => {
                      const deptBeds = beds.filter(b => b.dept === d.id);
                      const occupied = deptBeds.filter(b => b.status === 'occupied' || b.status === 'critical').length;
                      return (
                        <tr key={d.id}>
                          <td>
                            <strong style={{ color: 'var(--text-main)' }}>{d.icon} {d.name}</strong>
                          </td>
                          <td><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{d.head}</span></td>
                          <td><strong style={{ color: 'var(--primary-700)' }}>{d.beds || deptBeds.length} Beds</strong></td>
                          <td>
                            <span className="badge badge-blue">{occupied} Occupied</span> / <span className="badge badge-emerald">{deptBeds.length - occupied} Vacant</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: 1.2 BULK DRUG PROCUREMENT ORDERS
            ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="grid-2-col">
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span>📦 1.2 Issue Bulk Drug Purchase Order</span>
                </div>
              </div>
              <form onSubmit={handleCreateOrder}>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Drug / Medication Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Moxifloxacin 0.5% Eye Drops"
                      value={orderForm.drugName}
                      onChange={(e) => setOrderForm({ ...orderForm, drugName: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-control"
                        value={orderForm.category}
                        onChange={(e) => setOrderForm({ ...orderForm, category: e.target.value })}
                      >
                        <option value="Ophthalmic / Antibiotic">Ophthalmic / Antibiotic</option>
                        <option value="Cardiovascular">Cardiovascular</option>
                        <option value="Emergency & Trauma">Emergency & Trauma</option>
                        <option value="Pediatric Care">Pediatric Care</option>
                        <option value="General Analgesics">General Analgesics</option>
                        <option value="Anesthesia & Sedatives">Anesthesia & Sedatives</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pharmaceutical Supplier <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Pfizer Health Supplies"
                        value={orderForm.supplier}
                        onChange={(e) => setOrderForm({ ...orderForm, supplier: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Order Quantity (Units) <span className="required">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="10000"
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value, 10) || 1 })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Unit Price ($ USD) <span className="required">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        min="0.1"
                        step="0.1"
                        value={orderForm.unitPrice}
                        onChange={(e) => setOrderForm({ ...orderForm, unitPrice: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ background: 'var(--primary-50)', padding: '0.85rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-900)' }}>Calculated Total PO Cost:</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--primary-700)' }}>
                      ${(orderForm.quantity * orderForm.unitPrice).toLocaleString()} USD
                    </strong>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    🛒 Issue Drug Purchase Order
                  </button>
                </div>
              </form>
            </div>

            {/* Purchase Orders Log */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span>📑 Bulk Procurement PO Log</span>
                </div>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>PO #</th>
                      <th>Drug</th>
                      <th>Quantity</th>
                      <th>Total Cost</th>
                      <th>Supplier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugOrders.map(order => (
                      <tr key={order.id}>
                        <td><code>{order.id}</code></td>
                        <td>
                          <strong>{order.drugName}</strong><br />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{order.category}</span>
                        </td>
                        <td><strong>{order.quantity} units</strong></td>
                        <td><strong style={{ color: 'var(--primary-700)' }}>${order.totalCost.toLocaleString()}</strong></td>
                        <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{order.supplier}</span></td>
                        <td>
                          <span className={`badge ${order.status === 'Delivered' ? 'badge-emerald' : 'badge-indigo'}`}>
                            ● {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: 1.3 DRUG DISTRIBUTION TO DEPARTMENTS
            ========================================================================= */}
        {activeTab === 'distributions' && (
          <div className="grid-2-col">
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span>🚚 1.3 Distribute Drugs to Department Wards</span>
                </div>
              </div>
              <form onSubmit={handleCreateDistribution}>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Select Drug to Transfer <span className="required">*</span></label>
                    <select
                      className="form-control"
                      value={distForm.drugName}
                      onChange={(e) => setDistForm({ ...distForm, drugName: e.target.value })}
                      required
                    >
                      {inventory.map(item => (
                        <option key={item.id} value={item.name}>{item.name} (Current Stock: {item.stock})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Target Department <span className="required">*</span></label>
                      <select
                        className="form-control"
                        value={distForm.targetDepartment}
                        onChange={(e) => setDistForm({ ...distForm, targetDepartment: e.target.value })}
                        required
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Units to Transfer <span className="required">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="500"
                        value={distForm.quantity}
                        onChange={(e) => setDistForm({ ...distForm, quantity: parseInt(e.target.value, 10) || 1 })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    🚀 Dispatch Drug Batch to Department
                  </button>
                </div>
              </form>
            </div>

            {/* Distribution Log */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span>📋 Departmental Dispatch History</span>
                </div>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Dispatch ID</th>
                      <th>Drug Name</th>
                      <th>Target Dept</th>
                      <th>Units</th>
                      <th>Batch Code</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map(dist => (
                      <tr key={dist.id}>
                        <td><code>{dist.id}</code></td>
                        <td><strong>{dist.drugName}</strong></td>
                        <td><span style={{ fontWeight: 700, color: 'var(--primary-800)' }}>{dist.targetDepartment?.toUpperCase()}</span></td>
                        <td><strong>{dist.quantity}</strong></td>
                        <td><code style={{ fontSize: '0.75rem' }}>{dist.batchNumber}</code></td>
                        <td><span className="badge badge-emerald">● {dist.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: 1.4 WEEKLY COST REPORTS TO ADMIN
            ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="grid-2-col">
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span>📊 1.4 Compile & Dispatch Weekly Cost Report to Admin</span>
                </div>
              </div>
              <form onSubmit={handleSendCostReport}>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Report Week Period <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Aug 22 - Aug 28, 2026"
                      value={reportForm.weekRange}
                      onChange={(e) => setReportForm({ ...reportForm, weekRange: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Bed Expansion Costs ($ USD)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={reportForm.bedExpansionCost}
                        onChange={(e) => setReportForm({ ...reportForm, bedExpansionCost: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Drug Procurement Costs ($ USD)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={reportForm.drugProcurementCost}
                        onChange={(e) => setReportForm({ ...reportForm, drugProcurementCost: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department Logistics & Distribution Overhead ($ USD)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={reportForm.distributionOverhead}
                      onChange={(e) => setReportForm({ ...reportForm, distributionOverhead: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #ddd6fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#5b21b6' }}>Total Weekly Expenditure:</span>
                    <strong style={{ fontSize: '1.4rem', color: '#6d28d9' }}>
                      ${(reportForm.bedExpansionCost + reportForm.drugProcurementCost + reportForm.distributionOverhead).toLocaleString()} USD
                    </strong>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    🚀 Dispatch Weekly Cost Report to Hospital Admin
                  </button>
                </div>
              </form>
            </div>

            {/* Dispatched Reports to Admin History */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span>📑 Dispatched Reports to Admin</span>
                </div>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>Week Period</th>
                      <th>Total Spend</th>
                      <th>Submitted By</th>
                      <th>Admin Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costReports.map(report => (
                      <tr key={report.id}>
                        <td><code>{report.id}</code></td>
                        <td><strong>{report.weekRange}</strong></td>
                        <td><strong style={{ color: 'var(--primary-700)' }}>${report.totalCost?.toLocaleString()}</strong></td>
                        <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{report.submittedBy}</span></td>
                        <td>
                          <span className={`badge ${report.status === 'Reviewed by Admin' ? 'badge-emerald' : 'badge-amber'}`}>
                            ● {report.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
