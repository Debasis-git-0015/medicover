import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const DoctorDashboard = () => {
  const { user, showToast, navigateToChat } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Prescription Modal State
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [rxMedicines, setRxMedicines] = useState([
    { name: '', dosage: '', frequency: 'Twice daily', duration: '7 days' }
  ]);
  const [rxInstructions, setRxInstructions] = useState('');

  // Appointment Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingConflictError, setBookingConflictError] = useState(null);
  const [bookingData, setBookingData] = useState({
    doctorId: user?.id || 'doc_eye1',
    date: '2026-08-29',
    startTime: '10:15',
    endTime: '10:45',
    patientName: 'Patient B (Conflict Test)',
    type: 'Clinical Examination',
    notes: 'Urgent checkup'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientsRes, rxRes, apptRes] = await Promise.all([
        API.getPatients({ department: user?.department || 'eye' }),
        API.getPrescriptions({ department: user?.department || 'eye' }),
        API.getAppointments({ doctorId: user?.id || 'doc_eye1', date: '2026-08-29' })
      ]);
      const pList = patientsRes.data || [];
      setPatients(pList);
      if (pList.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pList[0].id);
      }
      setPrescriptions(rxRes.data || []);
      setAppointments(apptRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Prescription builder rows
  const addMedicineRow = () => {
    setRxMedicines(prev => [...prev, { name: '', dosage: '', frequency: 'Twice daily', duration: '7 days' }]);
  };

  const removeMedicineRow = (index) => {
    setRxMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleRxSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const validMeds = rxMedicines.filter(m => m.name.trim());
    if (validMeds.length === 0) {
      showToast('Please add at least one medication.', 'warning');
      return;
    }

    try {
      const res = await API.createPrescription({
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        department: selectedPatient.department,
        doctorId: user.id,
        doctorName: user.name,
        medicines: validMeds,
        instructions: rxInstructions
      });
      showToast(`Prescription ${res.data.id} dispatched to Pharmacy queue!`, 'success');
      setIsRxModalOpen(false);
      setRxMedicines([{ name: '', dosage: '', frequency: 'Twice daily', duration: '7 days' }]);
      setRxInstructions('');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Appointment booking submission with Conflict Engine integration
  const handleBookingSubmit = async (e) => {
    if (e) e.preventDefault();
    setBookingConflictError(null);

    try {
      const res = await API.bookAppointment({
        ...bookingData,
        doctorId: user?.id || 'doc_eye1'
      });
      showToast(res.message || 'Appointment booked successfully!', 'success');
      setIsBookingModalOpen(false);
      loadData();
    } catch (err) {
      setBookingConflictError({
        message: err.message,
        details: err.conflictDetails
      });
      showToast(err.message, 'error', 5000);
    }
  };

  // Quick Conflict Sandbox Test Runner
  const runConflictTest = async (scenario) => {
    if (scenario === 'overlap_conflict') {
      // 10:15 - 10:45 overlaps existing 10:00 - 10:30
      const testData = {
        doctorId: user?.id || 'doc_eye1',
        date: '2026-08-29',
        startTime: '10:15',
        endTime: '10:45',
        patientName: 'Patient B (Conflict Test)',
        type: 'Urgent Consultation',
        notes: 'Testing overlap conflict'
      };
      setBookingData(testData);
      setIsBookingModalOpen(true);
      setBookingConflictError(null);

      // Auto-trigger backend validation
      setTimeout(async () => {
        try {
          await API.bookAppointment(testData);
        } catch (err) {
          setBookingConflictError({
            message: err.message,
            details: err.conflictDetails
          });
        }
      }, 300);

    } else if (scenario === 'valid_after') {
      // 10:30 - 11:00 non-overlapping
      const testData = {
        doctorId: user?.id || 'doc_eye1',
        date: '2026-08-29',
        startTime: '10:30',
        endTime: '11:00',
        patientName: 'Patient C (Valid Slot)',
        type: 'Routine Follow-up',
        notes: 'Adjacent slot test'
      };
      setBookingData(testData);
      setIsBookingModalOpen(true);
      setBookingConflictError(null);

      setTimeout(async () => {
        try {
          const res = await API.bookAppointment(testData);
          showToast(res.message || 'Appointment booked successfully!', 'success');
          loadData();
        } catch (err) {
          setBookingConflictError({
            message: err.message,
            details: err.conflictDetails
          });
        }
      }, 300);
    }
  };

  const patientPrescriptions = selectedPatient ? prescriptions.filter(p => p.patientId === selectedPatient.id) : [];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-nav">
          <div className="sidebar-section-title">Clinical Desk</div>
          <button className="nav-link active">
            <span className="nav-icon">🩺</span>
            <span>Consultation & EMR</span>
          </button>
          <button className="nav-link" onClick={navigateToChat}>
            <span className="nav-icon">💬</span>
            <span>Nurse & Pharmacy Chat</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <section className="dashboard-main">
        <div className="dashboard-header-row">
          <div className="header-title-group">
            <h1>Physician Consultation & Schedule Desk</h1>
            <p>Examine patients, issue digital prescriptions, and manage conflict-free appointment schedules.</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setBookingConflictError(null);
                setBookingData({
                  doctorId: user?.id || 'doc_eye1',
                  date: '2026-08-29',
                  startTime: '11:00',
                  endTime: '11:30',
                  patientName: 'New Patient',
                  type: 'Routine Consultation',
                  notes: ''
                });
                setIsBookingModalOpen(true);
              }}
            >
              📅 Book Appointment Slot
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrap blue">🩺</div>
            <div className="metric-content">
              <span className="metric-label">Patient Queue</span>
              <span className="metric-value">{patients.length}</span>
              <span className="metric-sub">{patients.filter(p => p.triage === 'Emergency' || p.triage === 'Urgent').length} high priority cases</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap emerald">🕒</div>
            <div className="metric-content">
              <span className="metric-label">Assigned Shift</span>
              <span className="metric-value" style={{ fontSize: '1.15rem' }}>{user?.shift?.split(' ')[0] || 'Morning'}</span>
              <span className="metric-sub">{user?.shift}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-wrap amber">🛡️</div>
            <div className="metric-content">
              <span className="metric-label">Availability Shield</span>
              <span className="metric-value">Active</span>
              <span className="metric-sub">Auto-rejects double-booking</span>
            </div>
          </div>
        </div>

        {/* DOCTOR AVAILABILITY OVERLAP CONFLICT SANDBOX TESTER */}
        <div className="sandbox-card">
          <div className="sandbox-title">
            <span>⚡ Doctor Availability Overlap Conflict Sandbox</span>
            <span className="badge badge-indigo">Exact Formula Engine</span>
          </div>
          <p className="sandbox-desc">
            Existing confirmed slot: <strong>10:00 - 10:30 (Patient A)</strong>. Test the backend conflict check: <code>new_start &lt; existing_end AND new_end &gt; existing_start</code>.
          </p>
          <div className="sandbox-quick-test-btns">
            <button
              type="button"
              className="test-btn btn-test-conflict"
              onClick={() => runConflictTest('overlap_conflict')}
            >
              🧪 Test Overlap Conflict (10:15 - 10:45) ➔ Expect 409 REJECT
            </button>
            <button
              type="button"
              className="test-btn btn-test-valid"
              onClick={() => runConflictTest('valid_after')}
            >
              ✅ Test Adjacent Valid Slot (10:30 - 11:00) ➔ Expect 201 BOOKED
            </button>
          </div>
        </div>

        {/* Today's Appointment Schedule */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">
              <span>📅 Today's Doctor Appointment Schedule</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Protected by Backend Conflict Shield
            </div>
          </div>
          <div className="card-body">
            {appointments.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-subtle)', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                No appointments booked for today.
              </div>
            ) : (
              <div className="timeline-slot-grid">
                {appointments.map(appt => (
                  <div key={appt.id} className="appointment-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="appointment-time-badge">
                        <span>🕒</span>
                        <span>{appt.startTime} - {appt.endTime}</span>
                      </div>
                      <div className="appointment-patient-meta">
                        <h4>{appt.patientName} <code style={{ fontSize: '0.75rem' }}>({appt.patientId})</code></h4>
                        <p>Type: <strong>{appt.type}</strong> • {appt.notes || 'Routine consultation'}</p>
                      </div>
                    </div>
                    <div>
                      <span className="badge badge-emerald">● Confirmed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Consultation Workstation */}
        <div className="grid-2-col">
          {/* Patient Queue */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span>📋 Department Patient Queue</span>
              </div>
            </div>
            <div className="card-body">
              {patients.map(p => (
                <div
                  key={p.id}
                  className={`patient-queue-item ${p.id === selectedPatientId ? 'active' : ''}`}
                  onClick={() => setSelectedPatientId(p.id)}
                >
                  <div className="patient-info-left">
                    <div className="patient-avatar-badge">{p.name.split(' ').map(n => n[0]).join('')}</div>
                    <div className="patient-meta">
                      <h4>{p.name}</h4>
                      <p>Bed: <strong>{p.bed}</strong> • {p.age} yrs, {p.gender}</p>
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${p.triage === 'Emergency' ? 'triage-emergency' : (p.triage === 'Urgent' ? 'triage-urgent' : 'triage-routine')}`}>
                      {p.triage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Patient EMR Details */}
          {selectedPatient && (
            <div className="card" style={{ border: '1.5px solid var(--primary-200)' }}>
              <div className="card-header" style={{ background: 'var(--primary-50)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase' }}>
                    Patient ID: {selectedPatient.id} • {selectedPatient.bed}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.15rem' }}>{selectedPatient.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-primary" onClick={() => setIsRxModalOpen(true)}>
                    ✍️ Write Prescription
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={navigateToChat}>
                    💬 Discuss with Nurse
                  </button>
                </div>
              </div>

              <div className="card-body">
                {/* Vitals */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', background: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-subtle)' }}>BP</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{selectedPatient.vitals.bp || '120/80'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-subtle)' }}>PULSE</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{selectedPatient.vitals.pulse || '75 bpm'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-subtle)' }}>SpO2</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{selectedPatient.vitals.spo2 || '98%'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-subtle)' }}>TEMP</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{selectedPatient.vitals.temp || '98.6 °F'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>PRIMARY DIAGNOSIS</span>
                    <div style={{ fontWeight: 700, color: 'var(--primary-900)', marginTop: '0.2rem' }}>{selectedPatient.diagnosis}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>ALLERGIES</span>
                    <div style={{ fontWeight: 700, color: selectedPatient.allergies === 'None' ? 'var(--text-muted)' : 'var(--accent-rose)', marginTop: '0.2rem' }}>
                      ⚠️ {selectedPatient.allergies}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>PRESENTING SYMPTOMS</span>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>{selectedPatient.symptoms}</p>
                  </div>
                </div>

                {/* Prescriptions */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    💊 Patient Prescriptions ({patientPrescriptions.length})
                  </h4>
                  {patientPrescriptions.map(rx => (
                    <div key={rx.id} className="prescription-card" style={{ marginBottom: '0.6rem', padding: '0.85rem' }}>
                      <div className="prescription-header">
                        <div>
                          <strong>{rx.id}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginLeft: '0.5rem' }}>🕒 {rx.timestamp}</span>
                        </div>
                        <span className={`badge ${rx.status === 'Dispensed' ? 'badge-emerald' : 'badge-amber'}`}>● {rx.status}</span>
                      </div>
                      <div className="rx-med-list">
                        {rx.medicines.map((m, i) => (
                          <div key={i} className="rx-med-item">
                            <span><strong>{m.name}</strong> • {m.dosage} ({m.frequency})</span>
                            <span style={{ color: 'var(--text-muted)' }}>{m.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal: Write Prescription */}
      {isRxModalOpen && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">✍️ Digital Prescription Builder</h3>
              <button className="btn-icon" onClick={() => setIsRxModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleRxSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Patient ID</label>
                    <input type="text" className="form-control" value={selectedPatient.id} readOnly />
                  </div>
                  <div>
                    <label className="form-label">Patient Name & Bed</label>
                    <input type="text" className="form-control" value={`${selectedPatient.name} (${selectedPatient.bed})`} readOnly />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Medications & Dosing</label>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={addMedicineRow}>
                    ➕ Add Line
                  </button>
                </div>

                {rxMedicines.map((med, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr auto', gap: '0.5rem', marginBottom: '0.6rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Drug Name (e.g. Timolol 0.5%)"
                      value={med.name}
                      onChange={(e) => {
                        const updated = [...rxMedicines];
                        updated[index].name = e.target.value;
                        setRxMedicines(updated);
                      }}
                      required
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Dose"
                      value={med.dosage}
                      onChange={(e) => {
                        const updated = [...rxMedicines];
                        updated[index].dosage = e.target.value;
                        setRxMedicines(updated);
                      }}
                      required
                    />
                    <select
                      className="form-control"
                      value={med.frequency}
                      onChange={(e) => {
                        const updated = [...rxMedicines];
                        updated[index].frequency = e.target.value;
                        setRxMedicines(updated);
                      }}
                    >
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="3 times daily">3 times daily</option>
                      <option value="Every 4 hours">Every 4 hours</option>
                      <option value="PRN (As needed)">PRN (As needed)</option>
                      <option value="STAT (Immediate)">STAT (Immediate)</option>
                    </select>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Duration"
                      value={med.duration}
                      onChange={(e) => {
                        const updated = [...rxMedicines];
                        updated[index].duration = e.target.value;
                        setRxMedicines(updated);
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => removeMedicineRow(index)}
                      style={{ height: '36px', width: '36px', padding: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Clinical Instructions</label>
                  <textarea
                    className="form-control"
                    placeholder="e.g. Monitor pupil response after first dose."
                    value={rxInstructions}
                    onChange={(e) => setRxInstructions(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRxModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">🚀 Dispatch to Pharmacy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Book Appointment with Doctor Availability Conflict Validator */}
      {isBookingModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">📅 Book Appointment Slot</h3>
              <button className="btn-icon" onClick={() => setIsBookingModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleBookingSubmit}>
              <div className="modal-body">
                {/* Conflict Alert Banner */}
                {bookingConflictError && (
                  <div className="conflict-banner">
                    <div className="conflict-banner-header">
                      <span>⚠️ {bookingConflictError.message}</span>
                    </div>
                    <div className="conflict-banner-body">
                      <p>The backend rejected this booking request to prevent double-booking.</p>
                      {bookingConflictError.details && (
                        <div className="conflict-formula-badge">
                          🧮 Formula: new_start &lt; existing_end AND new_end &gt; existing_start ({bookingConflictError.details.overlapConditionMet})
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Patient Name / Identifier <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={bookingData.patientName}
                    onChange={(e) => setBookingData({ ...bookingData, patientName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Appointment Date <span className="required">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Start Time (24h) <span className="required">*</span></label>
                    <input
                      type="time"
                      className="form-control"
                      value={bookingData.startTime}
                      onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time (24h) <span className="required">*</span></label>
                    <input
                      type="time"
                      className="form-control"
                      value={bookingData.endTime}
                      onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Appointment Type</label>
                  <select
                    className="form-control"
                    value={bookingData.type}
                    onChange={(e) => setBookingData({ ...bookingData, type: e.target.value })}
                  >
                    <option value="Routine Consultation">Routine Consultation</option>
                    <option value="Urgent Clinical Review">Urgent Clinical Review</option>
                    <option value="Post-Op Eye Examination">Post-Op Eye Examination</option>
                    <option value="Cardiac Diagnostic Evaluation">Cardiac Diagnostic Evaluation</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsBookingModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">⚡ Validate & Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
