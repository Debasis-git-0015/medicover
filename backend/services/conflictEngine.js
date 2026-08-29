/**
 * ============================================================================
 * DOCTOR APPOINTMENT AVAILABILITY & OVERLAP CONFLICT DETECTION ENGINE
 * ============================================================================
 * Workflow:
 * Requested appointment
 *         ↓
 * Is doctor working that day? (YES/NO)
 *         ↓ [YES]
 * Is requested time within schedule? (YES/NO)
 *         ↓ [YES]
 * Does another appointment overlap? (YES/NO)
 *         ↓
 *     NO → BOOK (201 Created)
 *     YES → REJECT (409 Conflict)
 *
 * Overlap Condition:
 * new_start < existing_end AND new_end > existing_start
 */

// Helper to convert "HH:MM" (24h) to minutes from midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

// Helper to parse shift string like "Morning (08:00 - 16:00)" or "08:00 - 16:00"
function parseShiftHours(shiftStr) {
  if (!shiftStr) {
    return { startMin: 8 * 60, endMin: 18 * 60, display: '08:00 - 18:00' };
  }
  const match = shiftStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (match) {
    const startMin = timeToMinutes(match[1]);
    const endMin = timeToMinutes(match[2]);
    return { startMin, endMin, display: `${match[1]} - ${match[2]}` };
  }
  return { startMin: 8 * 60, endMin: 18 * 60, display: '08:00 - 18:00' };
}

// Determine if doctor is scheduled to work on the given date (YYYY-MM-DD)
function isDoctorWorkingOnDay(doctor, dateStr) {
  // Check if doctor status is explicitly on leave
  if (doctor.status === 'on-leave' || doctor.status === 'inactive') {
    return {
      working: false,
      reason: `Dr. ${doctor.name} is currently marked as On Leave.`
    };
  }

  // Parse day of week
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayIndex = dateObj.getDay(); // 0 = Sun, 6 = Sat

  // By policy: Clinical staff off on Sundays unless emergency on-call
  if (doctor.offDays && doctor.offDays.includes(dayIndex)) {
    return {
      working: false,
      reason: `Dr. ${doctor.name} does not have scheduled clinic hours on this day.`
    };
  }

  return { working: true };
}

// Validate requested appointment slot against doctor's schedule and existing appointments
function validateAppointmentBooking({ doctor, date, startTime, endTime, existingAppointments, excludeAppointmentId = null }) {
  // --- Step 1: Is doctor working that day? ---
  const dayCheck = isDoctorWorkingOnDay(doctor, date);
  if (!dayCheck.working) {
    return {
      isValid: false,
      statusCode: 400,
      code: 'DOCTOR_NOT_WORKING_DAY',
      message: `Doctor Not Working on Day: ${dayCheck.reason}`
    };
  }

  // --- Step 2: Time sanity check ---
  const newStartMin = timeToMinutes(startTime);
  const newEndMin = timeToMinutes(endTime);

  if (newStartMin === null || newEndMin === null) {
    return {
      isValid: false,
      statusCode: 400,
      code: 'INVALID_TIME_FORMAT',
      message: 'Invalid time format. Please provide valid HH:MM times.'
    };
  }

  if (newStartMin >= newEndMin) {
    return {
      isValid: false,
      statusCode: 400,
      code: 'INVALID_TIME_RANGE',
      message: `Start time (${startTime}) must be strictly before end time (${endTime}).`
    };
  }

  const durationMin = newEndMin - newStartMin;
  if (durationMin < 10) {
    return {
      isValid: false,
      statusCode: 400,
      code: 'DURATION_TOO_SHORT',
      message: 'Appointment duration must be at least 10 minutes.'
    };
  }

  // --- Step 3: Is requested time within doctor's shift schedule? ---
  const shift = parseShiftHours(doctor.shift);
  if (newStartMin < shift.startMin || newEndMin > shift.endMin) {
    return {
      isValid: false,
      statusCode: 400,
      code: 'OUTSIDE_SHIFT_HOURS',
      message: `Time Outside Working Hours: Dr. ${doctor.name}'s shift is ${shift.display}. Requested ${startTime} - ${endTime} falls outside scheduled clinic hours.`
    };
  }

  // --- Step 4: Does another appointment overlap? ---
  // Overlap condition: new_start < existing_end AND new_end > existing_start
  const doctorAppointments = existingAppointments.filter(appt => 
    appt.doctorId === doctor.id &&
    appt.date === date &&
    appt.status !== 'Cancelled' &&
    appt.id !== excludeAppointmentId
  );

  for (const existing of doctorAppointments) {
    const existStartMin = timeToMinutes(existing.startTime);
    const existEndMin = timeToMinutes(existing.endTime);

    // EXACT OVERLAP CONDITION:
    const isOverlapping = (newStartMin < existEndMin) && (newEndMin > existStartMin);

    const docTitle = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
    if (isOverlapping) {
      return {
        isValid: false,
        statusCode: 409, // 409 Conflict
        code: 'DOCTOR_AVAILABILITY_CONFLICT',
        message: `❌ Conflict Detected: ${docTitle} already has an overlapping appointment with ${existing.patientName} from ${existing.startTime} to ${existing.endTime}.`,
        conflictDetails: {
          requestedSlot: `${startTime} - ${endTime}`,
          conflictingAppointment: {
            id: existing.id,
            patientName: existing.patientName,
            patientId: existing.patientId,
            time: `${existing.startTime} - ${existing.endTime}`,
            type: existing.type || 'Consultation'
          },
          overlapConditionMet: `(${newStartMin} < ${existEndMin}) AND (${newEndMin} > ${existStartMin})`
        }
      };
    }
  }

  // No conflict!
  const docTitle = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
  return {
    isValid: true,
    statusCode: 201,
    message: `Appointment successfully booked for ${docTitle} on ${date} (${startTime} - ${endTime}).`
  };
}

/**
 * ============================================================================
 * WARD BED ALLOCATION & OCCUPANCY CONFLICT DETECTION ENGINE
 * ============================================================================
 * Condition:
 * If a bed is already occupied by a patient (status === 'occupied' || 'critical'
 * or bed.patientName is set to another patient), the system REJECTS booking
 * with HTTP 409 Conflict.
 */
function validateBedAppointment({ targetBed, patientId, patientName, allBeds }) {
  if (!targetBed) {
    return {
      isValid: false,
      statusCode: 404,
      code: 'BED_NOT_FOUND',
      message: 'Selected ward bed does not exist.'
    };
  }

  // 1. Check if the target bed is already occupied by another patient
  const isOccupied = (targetBed.status === 'occupied' || targetBed.status === 'critical') &&
    targetBed.patientId &&
    targetBed.patientId !== patientId;

  if (isOccupied || (targetBed.patientName && targetBed.patientName !== patientName && targetBed.status !== 'available')) {
    return {
      isValid: false,
      statusCode: 409, // 409 Conflict Error
      code: 'BED_OVERLAP_CONFLICT',
      message: `❌ Bed Overlap Conflict: Bed "${targetBed.id}" in room "${targetBed.room}" is ALREADY OCCUPIED by patient "${targetBed.patientName}". Two patients cannot occupy the same bed!`,
      conflictDetails: {
        bedId: targetBed.id,
        room: targetBed.room,
        currentPatient: targetBed.patientName,
        currentPatientId: targetBed.patientId,
        attemptedPatient: patientName,
        vitalsSummary: targetBed.vitalsSummary
      }
    };
  }

  // 2. Check if the patient is currently occupying another bed (Transfer scenario)
  const existingBed = (allBeds || []).find(b => b.patientId === patientId && b.id !== targetBed.id);

  return {
    isValid: true,
    statusCode: 200,
    previousBedId: existingBed ? existingBed.id : null,
    message: existingBed 
      ? `Patient transferred from ${existingBed.id} to ${targetBed.id}.` 
      : `Bed ${targetBed.id} successfully assigned to ${patientName}.`
  };
}

module.exports = {
  timeToMinutes,
  parseShiftHours,
  isDoctorWorkingOnDay,
  validateAppointmentBooking,
  validateBedAppointment
};
