/**
 * Automated Conflict Detection Test Suite
 */

const conflictEngine = require('../services/conflictEngine');

const mockDoctor = {
  id: 'doc_eye1',
  altId: 'DOC001',
  name: 'Dr. Alistair Vance',
  role: 'doctor',
  shift: 'Morning (08:00 - 16:00)',
  status: 'active'
};

const existingAppointments = [
  {
    id: 'APT-7001',
    doctorId: 'doc_eye1',
    patientName: 'Patient A',
    date: '2026-08-29',
    startTime: '10:00',
    endTime: '10:30',
    status: 'Confirmed'
  }
];

const testCases = [
  {
    name: 'Conflict Case: 10:15 - 10:45 (Patient B overlaps 10:00 - 10:30)',
    input: { doctor: mockDoctor, date: '2026-08-29', startTime: '10:15', endTime: '10:45', existingAppointments },
    expectedValid: false,
    expectedStatus: 409,
    expectedCode: 'DOCTOR_AVAILABILITY_CONFLICT'
  },
  {
    name: 'Conflict Case: 09:45 - 10:15 (Overlaps beginning)',
    input: { doctor: mockDoctor, date: '2026-08-29', startTime: '09:45', endTime: '10:15', existingAppointments },
    expectedValid: false,
    expectedStatus: 409,
    expectedCode: 'DOCTOR_AVAILABILITY_CONFLICT'
  },
  {
    name: 'Conflict Case: 10:05 - 10:25 (Completely inside existing)',
    input: { doctor: mockDoctor, date: '2026-08-29', startTime: '10:05', endTime: '10:25', existingAppointments },
    expectedValid: false,
    expectedStatus: 409,
    expectedCode: 'DOCTOR_AVAILABILITY_CONFLICT'
  },
  {
    name: 'Adjacent Valid Case: 09:30 - 10:00 (Right before, non-overlapping)',
    input: { doctor: mockDoctor, date: '2026-08-29', startTime: '09:30', endTime: '10:00', existingAppointments },
    expectedValid: true,
    expectedStatus: 201
  },
  {
    name: 'Adjacent Valid Case: 10:30 - 11:00 (Right after, non-overlapping)',
    input: { doctor: mockDoctor, date: '2026-08-29', startTime: '10:30', endTime: '11:00', existingAppointments },
    expectedValid: true,
    expectedStatus: 201
  },
  {
    name: 'Outside Shift Hours: 19:00 - 19:30 (Doctor shift ends at 16:00)',
    input: { doctor: mockDoctor, date: '2026-08-29', startTime: '19:00', endTime: '19:30', existingAppointments },
    expectedValid: false,
    expectedStatus: 400,
    expectedCode: 'OUTSIDE_SHIFT_HOURS'
  }
];

console.log('====================================================');
console.log('🧪 RUNNING DOCTOR AVAILABILITY CONFLICT TESTS');
console.log('====================================================');

let passed = 0;
testCases.forEach((tc, i) => {
  const result = conflictEngine.validateAppointmentBooking(tc.input);
  const ok = (result.isValid === tc.expectedValid) && (result.statusCode === tc.expectedStatus);

  if (ok) {
    passed++;
    console.log(`[PASS] Test ${i + 1}: ${tc.name}`);
    console.log(`       Result: ${result.statusCode} | ${result.message}`);
  } else {
    console.error(`[FAIL] Test ${i + 1}: ${tc.name}`);
    console.error(`       Expected Valid: ${tc.expectedValid}, Got: ${result.isValid}`);
    console.error(`       Expected Status: ${tc.expectedStatus}, Got: ${result.statusCode}`);
  }
});

console.log('====================================================');
console.log(`Test Results: ${passed} / ${testCases.length} PASSED`);
console.log('====================================================');

if (passed === testCases.length) {
  process.exit(0);
} else {
  process.exit(1);
}
