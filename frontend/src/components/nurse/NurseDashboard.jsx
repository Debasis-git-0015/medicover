import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const NurseDashboard = () => {
  const { user, showToast, navigateToChat } = useAuth();
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Appoint Bed Modal State
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [appointForm, setAppointForm] = useState({
    bedId: '',
    patientId: '',
    patientName: '',
    triage: 'Routine',
    vitalsSummary: 'BP 120/80 | SpO2 98%',
    doctor: '',
    diagnosis: ''
  });

  // Bed Conflict Alert State
  const [selectedBedConflict, setSelectedBedConflict] = useState(null);

  // Vitals Modal State
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [vitalsPatient, setVitalsPatient] = useState(null);
  const [vitalsForm, setVitalsForm] = useState({
    bp: '120/80',
    pulse: '75',
    spo2: '98',
    temp: '98.6'
  });

  const currentDept = user?.department || 'eye';

  const loadData = async () => {
    setLoading(true);
    try {
      const [bedsRes, patientsRes, rxRes] = await Promise.all([
        API.getBeds({ department: currentDept }),
        API.getPatients({ department: currentDept }),
        API.getPrescriptions({ department: currentDept })
      ]);
      setBeds(bedsRes.data || []);
      setPatients(patientsRes.data || []);
      setPrescriptions(rxRes.data || []);

      // If form has no bedId, default to first available bed
      const firstAvailable = (bedsRes.data || []).find(b => b.status === 'available');
      if (firstAvailable && !appointForm.bedId) {
        setAppointForm(prev => ({ ...prev, bedId: firstAvailable.id }));
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Bed selection change in modal to detect overlap preview
  const handleBedSelectChange = (bedId) => {
    const target = beds.find(b => b.id === bedId);
    if (target && (target.status === 'occupied' || target.status === 'critical') && target.patientName) {
      setSelectedBedConflict({
        bedId: target.id,
        room: target.room,
        currentPatient: target.patientName,
        status: target.status
      });
    } else {
      setSelectedBedConflict(null);
    }
    setAppointForm(prev => ({ ...prev, bedId }));
  };

  // Open Appoint Bed Modal (optionally with pre-selected bed)
  const openAppointModal = (preselectedBedId = null) => {
    const targetBed = preselectedBedId 
      ? beds.find(b => b.id === preselectedBedId)
      : beds.find(b => b.status === 'available') || beds[0];

    const initialBedId = targetBed ? targetBed.id : '';
    handleBedSelectChange(initialBedId);

    setAppointForm({
      bedId: initialBedId,
      patientId: '',
      patientName: '',
      triage: 'Routine',
      vitalsSummary: 'BP 120/80 | SpO2 98%',
      doctor: `Dr. ${user.name.replace(/^(Sister|Nurse)\s+/, '')}`,
      diagnosis: ''
    });
    setIsAppointModalOpen(true);
  };

  // Handle Patient Selection in Appoint Modal
  const handlePatientSelect = (pId) => {
    if (!pId) {
      setAppointForm(prev => ({ ...prev, patientId: '', patientName: '' }));
      return;
    }
    const pt = patients.find(p => p.id === pId);
    if (pt) {
      setAppointForm(prev => ({
        ...prev,
        patientId: pt.id,
        patientName: pt.name,
        triage: pt.triage || 'Routine',
        diagnosis: pt.diagnosis || '',
        doctor: pt.doctor || prev.doctor
      }));
    }
  };

  // SUBMIT BED APPOINTMENT (With Backend Overlap Conflict Prevention)
  const handleAppointSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.appointBed(appointForm);
      showToast(res.message || `Bed ${appointForm.bedId} successfully appointed to ${appointForm.patientName}!`, 'success', 5000);
      setIsAppointModalOpen(false);
      setSelectedBedConflict(null);
      loadData();
    } catch (err) {
      // System throws error on collision/overlap!
      showToast(`❌ ${err.message}`, 'error', 6000);
    }
  };

  // DISCHARGE / VACATE BED
  const handleVacateBed = async (bedId, patientName) => {
    if (!window.confirm(`Are you sure you want to discharge patient "${patientName || 'Assigned Patient'}" and vacate Bed ${bedId}?`)) {
      return;
    }
    try {
      const res = await API.vacateBed(bedId);
      showToast(res.message || `Bed ${bedId} vacated and sanitized.`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openVitalsModal = (patientId, patientName) => {
    setVitalsPatient({ id: patientId, name: patientName });
    setIsVitalsModalOpen(true);
  };

  const handleVitalsSubmit = async (e) => {
    e.preventDefault();
    if (!vitalsPatient) return;

    try {
      await API.updatePatientVitals(vitalsPatient.id, {
        bp: vitalsForm.bp.trim(),
        pulse: `${vitalsForm.pulse.trim()} bpm`,
        spo2: `${vitalsForm.spo2.trim()}%`,
        temp: `${vitalsForm.temp.trim()} °F`
      });
      showToast(`Vitals logged for patient ${vitalsPatient.name}`, 'success');
      setIsVitalsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const markMedGiven = (patientName, medName) => {
    showToast(`Administered "${medName}" to ${patientName}`, 'success');
  };

  const occupied = beds.filter(b => b.status === 'occupied' || b.status === 'critical').length;
  const critical = beds.filter(b => b.status === 'critical').length;
  const available = beds.filter(b => b.status === 'available').length;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-nav">
          <div className="sidebar-section-title">Nursing Station</div>
          <button className="nav-link active">
            <span className="nav-icon">💉</span>
            <span>Ward & Bed Matrix</span>
          </button>
          <button className="nav-link" onClick={() => openAppointModal()}>
            <span className="nav-icon">🛏️</span>
            <span>Appoint Bed</span>
          </button>
          <button className="nav-link" onClick={navigateToChat}>
            <span className="nav-icon">💬</span>
            <span>Physician Intercom</span>
          </button>
        </div>

        <div>
          <div style={{ background: '#ecfdf5', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid #a7f3d0', fontSize: '0.78rem', color: '#065f46' }}>
            <strong>🛡️ Bed Conflict Shield Active</strong>
            <p style={{ marginTop: '0.2rem', fontSize: '0.72rem' }}>
              Automatic overlap detection prevents two patients from being assigned to the same bed simultaneously.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="dashboard-main">
        <div className="dashboard-header-row">
          <div className="header-title-group">
            <h1>Ward Nursing Station & Care Monitoring</h1>
            <p>Real-Time Bed Appointment • Anti-Collision Overlap Protection • Vitals Telemetry</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => openAppointModal()}>
              🛏️ Appoint Bed to Patient
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrap blue">🛏️</div>
            <div className="metric-content">
              <span className="metric-label">Occupied Beds</span>
              <span className="metric-value">{occupied} / {beds.length}</span>
              <span className="metric-sub">{available} vacant beds available</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap rose">🚨</div>
            <div className="metric-content">
              <span className="metric-label">Critical Patients</span>
              <span className="metric-value">{critical}</span>
              <span className="metric-sub">Frequent vitals checks required</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap emerald">💉</div>
            <div className="metric-content">
              <span className="metric-label">Medication Rounds</span>
              <span className="metric-value">Active</span>
              <span className="metric-sub">Synced with Pharmacy Dispenser</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap amber">⚡</div>
            <div className="metric-content">
              <span className="metric-label">Overlap Conflict Shield</span>
              <span className="metric-value">Online</span>
              <span className="metric-sub">Zero Bed Collision Guarantee</span>
            </div>
          </div>
        </div>

        {/* Ward Bed Matrix */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">
              <span>🛏️ Live Department Ward Beds Matrix</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span className="badge badge-emerald">● {available} Vacant</span>
              <span className="badge badge-blue">● {occupied} Occupied</span>
              <button className="btn btn-sm btn-primary" onClick={() => openAppointModal()}>
                ➕ Appoint Bed
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="ward-grid">
              {beds.map(bed => {
                const isOccupied = bed.status === 'occupied' || bed.status === 'critical';
                return (
                  <div key={bed.id} className={`bed-card ${bed.status}`}>
                    <div className="bed-header">
                      <div>
                        <span className="bed-number">{bed.id}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block' }}>Room {bed.room}</span>
                      </div>
                      <span className={`badge ${bed.status === 'occupied' ? 'badge-blue' : (bed.status === 'critical' ? 'badge-rose' : 'badge-emerald')}`}>
                        ● {bed.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="bed-body">
                      <div className="bed-patient-name">{bed.patientName || 'Vacant Bed'}</div>
                      <div className="bed-patient-detail" style={{ marginBottom: '0.75rem' }}>
                        {bed.vitalsSummary || 'Sanitized & Ready for Admission'}
                      </div>

                      {isOccupied ? (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openVitalsModal(bed.patientId, bed.patientName)}
                          >
                            📊 Vitals
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleVacateBed(bed.id, bed.patientName)}
                            title="Discharge patient and vacate bed"
                          >
                            🚪 Discharge / Vacate
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-success"
                          style={{ width: '100%' }}
                          onClick={() => openAppointModal(bed.id)}
                        >
                          ➕ Appoint Patient
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Medication Delivery Rounds */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>💊 Ward Medication Schedule (Doctor Prescriptions)</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Medication & Dose</th>
                  <th>Schedule Frequency</th>
                  <th>Dispense Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.flatMap(rx =>
                  (rx.medicines || []).map((med, idx) => (
                    <tr key={`${rx.id}-${idx}`}>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>{rx.patientName}</strong><br />
                        <code style={{ fontSize: '0.75rem' }}>{rx.patientId}</code>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary-800)' }}>{med.name}</span><br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.dosage}</span>
                      </td>
                      <td><span className="badge badge-indigo">{med.frequency}</span></td>
                      <td>
                        <span className={`badge ${rx.status === 'Dispensed' ? 'badge-emerald' : 'badge-amber'}`}>
                          ● {rx.status}
                        </span>
                        {rx.dispensedBy && (
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                            by {rx.dispensedBy}
                          </span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => markMedGiven(rx.patientName, med.name)}>
                          ✓ Given
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODAL: APPOINT BED TO PATIENT (WITH OVERLAP CONFLICT PREVENTION)
          ========================================================================= */}
      {isAppointModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🛏️ Appoint Ward Bed to Patient</h3>
              <button className="btn-icon" onClick={() => { setIsAppointModalOpen(false); setSelectedBedConflict(null); }}>&times;</button>
            </div>
            <form onSubmit={handleAppointSubmit}>
              <div className="modal-body">
                {/* Visual Overlap Conflict Warning Banner */}
                {selectedBedConflict && (
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem', marginBottom: '1.25rem', color: '#9f1239' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                      <span>⚠️ OVERLAP CONFLICT WARNING</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
                      Bed <strong>{selectedBedConflict.bedId}</strong> (Room {selectedBedConflict.room}) is currently <strong>OCCUPIED</strong> by <strong>{selectedBedConflict.currentPatient}</strong>.
                      <br />Submitting this will trigger a <strong>Bed Overlap Collision Error</strong>. Please select an available green bed.
                    </p>
                  </div>
                )}

                {/* Select Target Bed */}
                <div className="form-group">
                  <label className="form-label">Select Ward Bed <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={appointForm.bedId}
                    onChange={(e) => handleBedSelectChange(e.target.value)}
                    required
                  >
                    {beds.map(b => {
                      const isOcc = b.status === 'occupied' || b.status === 'critical';
                      return (
                        <option key={b.id} value={b.id}>
                          {isOcc ? `🔴 ${b.id} (Room ${b.room}) - OCCUPIED by ${b.patientName}` : `🟢 ${b.id} (Room ${b.room}) - AVAILABLE`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Patient Selection or Manual Entry */}
                <div className="form-group">
                  <label className="form-label">Select Admitted Patient</label>
                  <select
                    className="form-control"
                    value={appointForm.patientId}
                    onChange={(e) => handlePatientSelect(e.target.value)}
                  >
                    <option value="">-- Select Existing Admitted Patient or Enter Below --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id}) - Current Bed: {p.bed || 'Unassigned'}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Patient Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe"
                      value={appointForm.patientName}
                      onChange={(e) => setAppointForm({ ...appointForm, patientName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Patient ID (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. P-1005 (auto-generated if blank)"
                      value={appointForm.patientId}
                      onChange={(e) => setAppointForm({ ...appointForm, patientId: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Triage & Acuity Level</label>
                    <select
                      className="form-control"
                      value={appointForm.triage}
                      onChange={(e) => setAppointForm({ ...appointForm, triage: e.target.value })}
                    >
                      <option value="Routine">Routine (Stable Inpatient)</option>
                      <option value="Urgent">Urgent (Continuous Observation)</option>
                      <option value="Emergency">Emergency (Critical Telemetry)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attending Doctor</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dr. Alistair Vance"
                      value={appointForm.doctor}
                      onChange={(e) => setAppointForm({ ...appointForm, doctor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Vitals & Admission Summary</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. BP 120/80 | SpO2 98% | Pulse 75 bpm"
                    value={appointForm.vitalsSummary}
                    onChange={(e) => setAppointForm({ ...appointForm, vitalsSummary: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setIsAppointModalOpen(false); setSelectedBedConflict(null); }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${selectedBedConflict ? 'btn-danger' : 'btn-primary'}`}
                >
                  {selectedBedConflict ? '⚠️ Attempt Assignment (Will Error)' : '✅ Confirm Bed Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Vitals */}
      {isVitalsModalOpen && vitalsPatient && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📊 Record Patient Vitals</h3>
              <button className="btn-icon" onClick={() => setIsVitalsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleVitalsSubmit}>
              <div className="modal-body">
                <div style={{ background: 'var(--primary-50)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)', marginBottom: '1.25rem' }}>
                  <strong>Patient:</strong> {vitalsPatient.name} (<code>{vitalsPatient.id}</code>)<br />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ward physiological observation telemetry</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Blood Pressure (mmHg)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={vitalsForm.bp}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pulse Rate (bpm)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={vitalsForm.pulse}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Oxygen Saturation (SpO2 %)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={vitalsForm.spo2}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Body Temp (°F)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={vitalsForm.temp}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsVitalsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">💾 Save Vitals Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
