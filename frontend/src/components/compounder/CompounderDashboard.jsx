import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const CompounderDashboard = () => {
  const { user, showToast, navigateToChat } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Restock modal state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockAmount, setRestockAmount] = useState(50);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rxRes, invRes] = await Promise.all([
        API.getPrescriptions(),
        API.getInventory()
      ]);
      setPrescriptions(rxRes.data || []);
      setInventory(invRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateRxStatus = async (rxId, nextStatus) => {
    try {
      await API.updatePrescriptionStatus(rxId, nextStatus, user?.name);
      showToast(`Prescription ${rxId} is now marked as "${nextStatus}"`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockItem) return;

    try {
      await API.updateStock(restockItem.id, parseInt(restockAmount, 10));
      showToast(`Stock increased by +${restockAmount} units`, 'success');
      setIsRestockModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openRestock = (item) => {
    setRestockItem(item);
    setRestockAmount(50);
    setIsRestockModalOpen(true);
  };

  let filteredPrescriptions = [...prescriptions];
  if (statusFilter !== 'all') {
    filteredPrescriptions = filteredPrescriptions.filter(p => p.status.toLowerCase() === statusFilter.toLowerCase());
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredPrescriptions = filteredPrescriptions.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.patientName.toLowerCase().includes(q) ||
      p.doctorName.toLowerCase().includes(q)
    );
  }

  const pendingCount = prescriptions.filter(p => p.status === 'Pending').length;
  const compoundingCount = prescriptions.filter(p => p.status === 'Compounding').length;
  const lowStockCount = inventory.filter(i => i.stock <= i.minThreshold).length;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-nav">
          <div className="sidebar-section-title">Pharmacy Station</div>
          <button className="nav-link active">
            <span className="nav-icon">💊</span>
            <span>Dispensing Queue</span>
          </button>
          <button className="nav-link" onClick={navigateToChat}>
            <span className="nav-icon">💬</span>
            <span>Clinical Intercom</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <section className="dashboard-main">
        <div className="dashboard-header-row">
          <div className="header-title-group">
            <h1>Compounder Pharmacy Dispensing Desk</h1>
            <p>Fulfill physician orders, verify dosages, and manage medicine inventory.</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrap amber">⏳</div>
            <div className="metric-content">
              <span className="metric-label">Pending Dispensation</span>
              <span className="metric-value">{pendingCount}</span>
              <span className="metric-sub">{compoundingCount} in compounding</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap emerald">✅</div>
            <div className="metric-content">
              <span className="metric-label">Dispensed Today</span>
              <span className="metric-value">{prescriptions.filter(p => p.status === 'Dispensed').length}</span>
              <span className="metric-sub">Verified prescriptions</span>
            </div>
          </div>
          <div className="metric-card">
            <div className={`metric-icon-wrap ${lowStockCount > 0 ? 'rose' : 'blue'}`}>📦</div>
            <div className="metric-content">
              <span className="metric-label">Inventory Alerts</span>
              <span className="metric-value">{lowStockCount} Items</span>
              <span className="metric-sub">{lowStockCount > 0 ? 'Below safety threshold' : 'All stock normal'}</span>
            </div>
          </div>
        </div>

        <div className="grid-2-col">
          {/* Live Prescription Queue */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span>📑 Incoming Prescription Orders</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className={`dept-pill ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
                <button className={`dept-pill ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>Pending</button>
                <button className={`dept-pill ${statusFilter === 'compounding' ? 'active' : ''}`} onClick={() => setStatusFilter('compounding')}>In Prep</button>
                <button className={`dept-pill ${statusFilter === 'dispensed' ? 'active' : ''}`} onClick={() => setStatusFilter('dispensed')}>Dispensed</button>
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Rx #, patient name, or doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredPrescriptions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-subtle)' }}>No prescriptions found.</div>
              ) : (
                filteredPrescriptions.map(rx => (
                  <div key={rx.id} className="prescription-card">
                    <div className="prescription-header">
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                          ORDER: {rx.id} • {rx.timestamp}
                        </span>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                          {rx.patientName} <code style={{ fontSize: '0.78rem' }}>({rx.patientId})</code>
                        </h4>
                        <span className="rx-doctor-tag">Prescribed by {rx.doctorName} ({rx.department?.toUpperCase()} Dept)</span>
                      </div>
                      <span className={`badge ${rx.status === 'Dispensed' ? 'badge-emerald' : (rx.status === 'Compounding' ? 'badge-indigo' : 'badge-amber')}`}>
                        ● {rx.status}
                      </span>
                    </div>

                    <div className="rx-med-list">
                      {rx.medicines.map((m, idx) => (
                        <div key={idx} className="rx-med-item">
                          <span><strong>{m.name}</strong> • {m.dosage} ({m.frequency})</span>
                          <span style={{ color: 'var(--text-muted)' }}>{m.duration}</span>
                        </div>
                      ))}
                    </div>

                    {rx.instructions && (
                      <div style={{ background: 'var(--primary-50)', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--primary-900)', marginBottom: '0.75rem', borderLeft: '3px solid var(--primary-500)' }}>
                        <strong>Special Note:</strong> {rx.instructions}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {rx.dispensedBy ? `Verified & Dispensed by: ${rx.dispensedBy} (${rx.dispensedTime})` : 'Awaiting compounder processing'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {rx.status === 'Pending' && (
                          <button className="btn btn-sm btn-outline-primary" onClick={() => updateRxStatus(rx.id, 'Compounding')}>
                            ⚙️ Start Compounding
                          </button>
                        )}
                        {rx.status !== 'Dispensed' ? (
                          <button className="btn btn-sm btn-success" onClick={() => updateRxStatus(rx.id, 'Dispensed')}>
                            ✅ Verify & Dispense
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-secondary" onClick={() => showToast(`Printed Rx label for ${rx.patientName}`, 'info')}>
                            🏷️ Print Label
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pharmacy Inventory */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span>📦 Medicine Stock & Inventory</span>
              </div>
            </div>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Safety Min</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => {
                    const isLow = item.stock <= item.minThreshold;
                    const isCrit = item.stock <= item.minThreshold / 2;
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong><br />
                          <code style={{ fontSize: '0.75rem' }}>{item.id}</code>
                        </td>
                        <td><span className="badge badge-gray">{item.category}</span></td>
                        <td>
                          <strong style={{ fontSize: '1rem', color: isCrit ? 'var(--accent-rose)' : (isLow ? 'var(--accent-amber)' : 'var(--text-main)') }}>
                            {item.stock}
                          </strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{item.unit}</span>
                        </td>
                        <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.minThreshold}</span></td>
                        <td>
                          {item.warning ? (
                            <span className="stock-warning">⚠️ {item.warning}</span>
                          ) : (
                            <span className="badge badge-emerald">✓ Optimal</span>
                          )}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-secondary" onClick={() => openRestock(item)}>
                            ➕ Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Modal: Restock */}
      {isRestockModalOpen && restockItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">📦 Restock Pharmacy Inventory</h3>
              <button className="btn-icon" onClick={() => setIsRestockModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleRestockSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Medicine Item</label>
                  <input type="text" className="form-control" value={`${restockItem.name} (Current: ${restockItem.stock} ${restockItem.unit})`} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Units to Add <span className="required">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="1000"
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRestockModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Stock Addition</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
