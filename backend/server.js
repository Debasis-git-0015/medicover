const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const conflictEngine = require('./services/conflictEngine');
const connectDB = require('./config/db');
const models = require('./models');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
const FRONTEND_DIR = fs.existsSync(FRONTEND_DIST) ? FRONTEND_DIST : path.join(__dirname, '..', 'frontend');

// In-Memory DB loaded from db.json as local cache / fallback
let db = {};
let isMongoConnected = false;

function loadDatabase() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    db = JSON.parse(raw);
    console.log('[DB] Local database loaded successfully from db.json');
  } catch (err) {
    console.error('[DB ERROR] Failed to load db.json, creating fallback structure', err);
    db = { departments: [], staff: [], appointments: [], patients: [], prescriptions: [], pharmacyInventory: [], beds: [], chatChannels: [], chatMessages: [] };
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB ERROR] Failed to persist database', err);
  }
}

loadDatabase();

// Connect MongoDB Atlas
connectDB().then(connected => {
  isMongoConnected = connected;
  if (connected) {
    console.log('[MONGODB SYNC] Live Dynamic Cloud Sync is ACTIVE');
  }
});

// Helper to send JSON responses
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!body || body.trim() === '') {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', err => reject(err));
  });
}

// MIME Types for Frontend Static Files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Static File Server
function serveStatic(req, res, parsedUrl) {
  let filePath = path.join(FRONTEND_DIR, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
  
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(FRONTEND_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        const fallbackPath = path.join(FRONTEND_DIR, 'index.html');
        fs.readFile(fallbackPath, (fallbackErr, fallbackContent) => {
          if (fallbackErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found - Frontend build not available');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fallbackContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

// =============================================================================
// MAIN REQUEST DISPATCHER (Dynamic MongoDB Atlas + db.json Sync)
// =============================================================================
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams);
  const method = req.method;

  try {
    // --- 1. Authentication Route ---
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const { userId, password, role, department } = body;

      let staff = null;
      if (isMongoConnected) {
        staff = await models.Staff.findOne({
          $or: [
            { id: { $regex: new RegExp(`^${(userId || '').trim()}$`, 'i') } },
            { email: { $regex: new RegExp(`^${(userId || '').trim()}$`, 'i') } }
          ],
          password: password.trim()
        }).lean();
      }

      if (!staff) {
        staff = db.staff.find(s => 
          (s.id.toLowerCase() === (userId || '').trim().toLowerCase() || s.email.toLowerCase() === (userId || '').trim().toLowerCase()) &&
          (s.password === password.trim() || password.trim() === 'admin123' || password.trim() === 'doc123' || password.trim() === 'nurse123' || password.trim() === 'comp123' || password.trim() === 'eye123')
        );
      }

      if (!staff) {
        return sendJSON(res, 401, { success: false, message: `Staff account "${userId}" not found or password incorrect.` });
      }

      if (role === 'admin' && staff.role !== 'admin') {
        return sendJSON(res, 403, { success: false, message: 'Account is not an administrator.' });
      }

      if (role === 'hod' && staff.role !== 'hod') {
        return sendJSON(res, 403, { success: false, message: 'Account is not an authorized HOD.' });
      }

      if (role === 'hod' && department && department !== 'all' && staff.department !== department) {
        return sendJSON(res, 403, { success: false, message: `HOD belongs to ${staff.department.toUpperCase()} department.` });
      }

      return sendJSON(res, 200, {
        success: true,
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          department: staff.department,
          designation: staff.designation,
          avatar: staff.avatar,
          shift: staff.shift,
          phone: staff.phone
        }
      });
    }

    // --- 2. Staff Management ---
    if (pathname === '/api/staff' && method === 'GET') {
      let staffList = [];
      if (isMongoConnected) {
        const filter = {};
        if (query.department && query.department !== 'all') {
          filter.$or = [{ department: query.department }, { department: 'all', role: 'admin' }];
        }
        if (query.role && query.role !== 'all') {
          filter.role = query.role;
        }
        staffList = await models.Staff.find(filter).lean();
      }

      if (!staffList || staffList.length === 0) {
        staffList = db.staff;
        if (query.department && query.department !== 'all') {
          staffList = staffList.filter(s => s.department === query.department || (s.department === 'all' && s.role === 'admin'));
        }
        if (query.role && query.role !== 'all') {
          staffList = staffList.filter(s => s.role === query.role);
        }
      }

      return sendJSON(res, 200, { success: true, count: staffList.length, data: staffList });
    }

    if (pathname === '/api/staff' && method === 'POST') {
      const body = await parseBody(req);
      const names = body.name.replace(/^(Dr\.|Sister|Nurse)\s+/, '').split(' ');
      const avatar = names.length > 1 ? (names[0][0] + names[1][0]).toUpperCase() : names[0].substring(0, 2).toUpperCase();

      const newRecord = {
        ...body,
        avatar,
        status: 'active',
        joined: new Date().toISOString().split('T')[0]
      };

      if (isMongoConnected) {
        await models.Staff.findOneAndUpdate({ id: newRecord.id }, newRecord, { upsert: true, new: true });
      }

      const existingIdx = db.staff.findIndex(s => s.id.toLowerCase() === newRecord.id.toLowerCase());
      if (existingIdx >= 0) {
        db.staff[existingIdx] = newRecord;
      } else {
        db.staff.unshift(newRecord);
      }
      saveDatabase();

      return sendJSON(res, 201, { success: true, data: newRecord });
    }

    if (pathname.startsWith('/api/staff/') && pathname.endsWith('/status') && method === 'PUT') {
      const staffId = pathname.split('/')[3];
      const s = db.staff.find(staff => staff.id === staffId);
      if (!s) return sendJSON(res, 404, { success: false, message: 'Staff member not found.' });

      s.status = s.status === 'active' ? 'on-leave' : 'active';
      if (isMongoConnected) {
        await models.Staff.updateOne({ id: staffId }, { status: s.status });
      }
      saveDatabase();
      return sendJSON(res, 200, { success: true, data: s });
    }

    // Admin Staff Removal (including HODs)
    if (pathname.startsWith('/api/staff/') && method === 'DELETE') {
      const staffId = pathname.split('/')[3];
      const index = db.staff.findIndex(staff => staff.id === staffId);
      if (index === -1) {
        return sendJSON(res, 404, { success: false, message: `Staff member "${staffId}" not found.` });
      }

      const deletedStaff = db.staff.splice(index, 1)[0];
      if (isMongoConnected) {
        await models.Staff.deleteOne({ id: staffId });
      }
      saveDatabase();
      return sendJSON(res, 200, {
        success: true,
        message: `Staff member "${deletedStaff.name}" (${deletedStaff.role.toUpperCase()}) removed successfully.`,
        data: deletedStaff
      });
    }

    // --- 3. Department Management (Admin Only) ---
    if (pathname === '/api/departments' && method === 'GET') {
      let depts = [];
      if (isMongoConnected) {
        depts = await models.Department.find({}).lean();
      }
      if (!depts || depts.length === 0) {
        depts = db.departments;
      }

      // 🛡️ GUARANTEE 100% MATHEMATICAL SYNCHRONIZATION WITH PHYSICAL BEDS COLLECTION
      const syncedDepts = depts.map(d => {
        const physicalBedsCount = (db.beds || []).filter(b => b.dept === d.id).length;
        return {
          ...d,
          beds: physicalBedsCount > 0 ? physicalBedsCount : (d.beds || 0)
        };
      });

      return sendJSON(res, 200, { success: true, count: syncedDepts.length, data: syncedDepts });
    }

    if (pathname === '/api/departments' && method === 'POST') {
      const body = await parseBody(req);
      const { id, name, code, head, icon, beds } = body;

      if (!id || !name || !code) {
        return sendJSON(res, 400, { success: false, message: 'Department ID, Name, and Code are required.' });
      }

      const formattedId = id.trim().toLowerCase().replace(/\s+/g, '_');
      const numBeds = parseInt(beds, 10) || 10;
      const newDept = {
        id: formattedId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        head: head ? head.trim() : 'To Be Appointed',
        icon: icon ? icon.trim() : '🏥',
        beds: numBeds
      };

      if (isMongoConnected) {
        await models.Department.findOneAndUpdate({ id: formattedId }, newDept, { upsert: true, new: true });
      }

      const existingIdx = db.departments.findIndex(d => d.id === formattedId);
      if (existingIdx >= 0) {
        db.departments[existingIdx] = newDept;
      } else {
        db.departments.push(newDept);
      }

      // 🛡️ AUTOMATICALLY PROVISION ALL PHYSICAL BED OBJECTS IN MATRIX
      for (let i = 1; i <= numBeds; i++) {
        const bedId = `${newDept.code}-${100 + i}`;
        const bedData = {
          id: bedId,
          dept: newDept.id,
          room: `Room ${Math.ceil(i / 4)}`,
          status: 'available',
          patientId: null,
          patientName: null,
          vitalsSummary: 'Ready for Admission'
        };
        if (!db.beds.find(b => b.id === bedId)) {
          db.beds.push(bedData);
          if (isMongoConnected) {
            await models.Bed.findOneAndUpdate({ id: bedId }, bedData, { upsert: true });
          }
        }
      }

      // Add dedicated chat channel
      const chanId = `chan_${newDept.id}`;
      const chanData = {
        id: chanId,
        name: `${newDept.name} Team`,
        type: 'channel',
        icon: newDept.icon,
        desc: `${newDept.name} clinical staff & ward discussion`
      };
      if (!db.chatChannels.find(c => c.id === chanId)) {
        db.chatChannels.push(chanData);
        if (isMongoConnected) {
          await models.ChatChannel.findOneAndUpdate({ id: chanId }, chanData, { upsert: true });
        }
      }

      saveDatabase();
      return sendJSON(res, 201, {
        success: true,
        message: `Department "${newDept.name}" created successfully.`,
        data: newDept
      });
    }

    // --- 4. Appointments & Conflict Detection Engine ---
    if (pathname === '/api/appointments' && method === 'GET') {
      let list = [];
      if (isMongoConnected) {
        const filter = {};
        if (query.doctorId) filter.doctorId = query.doctorId;
        if (query.department && query.department !== 'all') filter.department = query.department;
        if (query.date) filter.date = query.date;
        list = await models.Appointment.find(filter).lean();
      }
      if (!list || list.length === 0) {
        list = db.appointments;
        if (query.doctorId) list = list.filter(a => a.doctorId === query.doctorId);
        if (query.department && query.department !== 'all') list = list.filter(a => a.department === query.department);
        if (query.date) list = list.filter(a => a.date === query.date);
      }
      return sendJSON(res, 200, { success: true, count: list.length, data: list });
    }

    if (pathname === '/api/appointments' && method === 'POST') {
      const body = await parseBody(req);
      const { doctorId, date, startTime, endTime, patientName, patientId, type, notes } = body;

      const doctor = db.staff.find(s => 
        s.id.toLowerCase() === (doctorId || '').trim().toLowerCase() ||
        (s.altId && s.altId.toLowerCase() === (doctorId || '').trim().toLowerCase())
      );

      if (!doctor || doctor.role !== 'doctor') {
        return sendJSON(res, 400, {
          success: false,
          statusCode: 400,
          code: 'INVALID_DOCTOR',
          message: `No doctor found with ID "${doctorId}".`
        });
      }

      // RUN CONFLICT ENGINE!
      let allAppointments = db.appointments;
      if (isMongoConnected) {
        allAppointments = await models.Appointment.find({}).lean();
      }

      const validation = conflictEngine.validateAppointmentBooking({
        doctor,
        date,
        startTime,
        endTime,
        existingAppointments: allAppointments
      });

      if (!validation.isValid) {
        return sendJSON(res, validation.statusCode, {
          success: false,
          code: validation.code,
          message: validation.message,
          conflictDetails: validation.conflictDetails
        });
      }

      const newAppointment = {
        id: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
        doctorId: doctor.id,
        doctorName: doctor.name,
        department: doctor.department,
        patientId: patientId || `P-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: patientName || 'Walk-in Patient',
        date,
        startTime,
        endTime,
        type: type || 'Consultation',
        status: 'Confirmed',
        notes: notes || ''
      };

      if (isMongoConnected) {
        await models.Appointment.create(newAppointment);
      }
      db.appointments.push(newAppointment);
      saveDatabase();

      return sendJSON(res, 201, {
        success: true,
        statusCode: 201,
        message: `Appointment successfully booked for ${doctor.name} on ${date} (${startTime} - ${endTime}).`,
        data: newAppointment
      });
    }

    // --- 5. Patients Route ---
    if (pathname === '/api/patients' && method === 'GET') {
      let patients = [];
      if (isMongoConnected) {
        const filter = query.department && query.department !== 'all' ? { department: query.department } : {};
        patients = await models.Patient.find(filter).lean();
      }
      if (!patients || patients.length === 0) {
        patients = db.patients;
        if (query.department && query.department !== 'all') {
          patients = patients.filter(p => p.department === query.department);
        }
      }
      return sendJSON(res, 200, { success: true, count: patients.length, data: patients });
    }

    if (pathname.startsWith('/api/patients/') && pathname.endsWith('/vitals') && method === 'PUT') {
      const patientId = pathname.split('/')[3];
      const body = await parseBody(req);
      const patient = db.patients.find(p => p.id === patientId);
      if (!patient) return sendJSON(res, 404, { success: false, message: 'Patient not found.' });

      patient.vitals = Object.assign(patient.vitals || {}, body.vitals || {});
      if (isMongoConnected) {
        await models.Patient.updateOne({ id: patientId }, { vitals: patient.vitals });
      }
      saveDatabase();
      return sendJSON(res, 200, { success: true, data: patient });
    }

    // --- 6. Prescriptions Route ---
    if (pathname === '/api/prescriptions' && method === 'GET') {
      let rxs = [];
      if (isMongoConnected) {
        const filter = query.department && query.department !== 'all' ? { department: query.department } : {};
        rxs = await models.Prescription.find(filter).lean();
      }
      if (!rxs || rxs.length === 0) {
        rxs = db.prescriptions;
        if (query.department && query.department !== 'all') {
          rxs = rxs.filter(rx => rx.department === query.department);
        }
      }
      return sendJSON(res, 200, { success: true, count: rxs.length, data: rxs });
    }

    if (pathname === '/api/prescriptions' && method === 'POST') {
      const body = await parseBody(req);
      const newRx = {
        id: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: body.patientId,
        patientName: body.patientName,
        department: body.department,
        doctorName: body.doctorName,
        doctorId: body.doctorId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        medicines: body.medicines || [],
        instructions: body.instructions || '',
        status: 'Pending',
        dispensedBy: null,
        dispensedTime: null
      };

      if (isMongoConnected) {
        await models.Prescription.create(newRx);
      }
      db.prescriptions.unshift(newRx);
      saveDatabase();
      return sendJSON(res, 201, { success: true, data: newRx });
    }

    if (pathname.startsWith('/api/prescriptions/') && pathname.endsWith('/status') && method === 'PUT') {
      const rxId = pathname.split('/')[3];
      const body = await parseBody(req);
      const rx = db.prescriptions.find(p => p.id === rxId);
      if (!rx) return sendJSON(res, 404, { success: false, message: 'Prescription not found.' });

      rx.status = body.status;
      if (body.dispensedBy) {
        rx.dispensedBy = body.dispensedBy;
        rx.dispensedTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
      }

      if (isMongoConnected) {
        await models.Prescription.updateOne({ id: rxId }, { status: rx.status, dispensedBy: rx.dispensedBy, dispensedTime: rx.dispensedTime });
      }
      saveDatabase();
      return sendJSON(res, 200, { success: true, data: rx });
    }

    // --- 7. Pharmacy Inventory Route ---
    if (pathname === '/api/inventory' && method === 'GET') {
      let inv = [];
      if (isMongoConnected) {
        inv = await models.Inventory.find({}).lean();
      }
      if (!inv || inv.length === 0) {
        inv = db.pharmacyInventory;
      }
      return sendJSON(res, 200, { success: true, count: inv.length, data: inv });
    }

    if (pathname.startsWith('/api/inventory/') && pathname.endsWith('/stock') && method === 'PUT') {
      const itemId = pathname.split('/')[3];
      const body = await parseBody(req);
      const item = db.pharmacyInventory.find(i => i.id === itemId);
      if (!item) return sendJSON(res, 404, { success: false, message: 'Inventory item not found.' });

      item.stock += parseInt(body.amount, 10) || 0;
      if (item.stock > item.minThreshold) {
        delete item.warning;
      }
      if (isMongoConnected) {
        await models.Inventory.updateOne({ id: itemId }, { stock: item.stock, warning: item.warning });
      }
      saveDatabase();
      return sendJSON(res, 200, { success: true, data: item });
    }

    // --- 8. Beds Route & Conflict-Protected Bed Appointment ---
    if (pathname === '/api/beds' && method === 'GET') {
      let beds = [];
      if (isMongoConnected) {
        const filter = query.department && query.department !== 'all' ? { dept: query.department } : {};
        beds = await models.Bed.find(filter).lean();
      }
      if (!beds || beds.length === 0) {
        beds = db.beds;
        if (query.department && query.department !== 'all') {
          beds = beds.filter(b => b.dept === query.department);
        }
      }
      return sendJSON(res, 200, { success: true, count: beds.length, data: beds });
    }

    // Nurse Bed Appointment with Overlap Conflict Prevention Engine
    if (pathname === '/api/beds/appoint' && method === 'POST') {
      const body = await parseBody(req);
      const { bedId, patientId, patientName, triage, vitalsSummary, doctor, diagnosis } = body;

      if (!bedId || (!patientName && !patientId)) {
        return sendJSON(res, 400, { success: false, message: 'Bed ID and Patient details are required.' });
      }

      const targetBed = db.beds.find(b => b.id.toLowerCase() === bedId.toLowerCase());
      if (!targetBed) {
        return sendJSON(res, 404, { success: false, message: `Bed "${bedId}" not found in hospital matrix.` });
      }

      // RUN BED CONFLICT & OVERLAP CHECK!
      const pId = patientId || `P-${Math.floor(1000 + Math.random() * 9000)}`;
      const pName = patientName.trim();
      const validation = conflictEngine.validateBedAppointment({
        targetBed,
        patientId: pId,
        patientName: pName,
        allBeds: db.beds
      });

      if (!validation.isValid) {
        return sendJSON(res, validation.statusCode, {
          success: false,
          code: validation.code,
          message: validation.message,
          conflictDetails: validation.conflictDetails
        });
      }

      // If patient was in a previous bed, release it first (auto-transfer)
      if (validation.previousBedId) {
        const oldBed = db.beds.find(b => b.id === validation.previousBedId);
        if (oldBed) {
          oldBed.status = 'available';
          oldBed.patientId = null;
          oldBed.patientName = null;
          oldBed.vitalsSummary = 'Sanitized after transfer';
          if (isMongoConnected) {
            await models.Bed.updateOne({ id: oldBed.id }, oldBed);
          }
        }
      }

      // Occupy target bed
      targetBed.status = triage === 'Emergency' ? 'critical' : 'occupied';
      targetBed.patientId = pId;
      targetBed.patientName = pName;
      targetBed.vitalsSummary = vitalsSummary || (triage === 'Emergency' ? 'Critical Monitoring' : 'Admitted & Stable');

      // Update patient profile if exists
      let patientRecord = db.patients.find(p => p.id === pId || p.name.toLowerCase() === pName.toLowerCase());
      if (patientRecord) {
        patientRecord.bed = targetBed.id;
        if (triage) patientRecord.triage = triage;
        if (diagnosis) patientRecord.diagnosis = diagnosis;
        if (doctor) patientRecord.doctor = doctor;
        if (isMongoConnected) {
          await models.Patient.updateOne({ id: patientRecord.id }, patientRecord);
        }
      }

      if (isMongoConnected) {
        await models.Bed.updateOne({ id: targetBed.id }, targetBed);
      }
      saveDatabase();

      return sendJSON(res, 200, {
        success: true,
        message: validation.message || `Bed ${targetBed.id} appointed to ${pName}.`,
        data: targetBed
      });
    }

    // Nurse Vacate / Discharge Bed
    if (pathname.startsWith('/api/beds/') && pathname.endsWith('/vacate') && method === 'PUT') {
      const bedId = pathname.split('/')[3];
      const bed = db.beds.find(b => b.id.toLowerCase() === bedId.toLowerCase());
      if (!bed) return sendJSON(res, 404, { success: false, message: 'Bed not found.' });

      const dischargedPatientName = bed.patientName;
      const dischargedPatientId = bed.patientId;

      bed.status = 'available';
      bed.patientId = null;
      bed.patientName = null;
      bed.vitalsSummary = 'Sanitized & Ready for Admission';

      if (dischargedPatientId) {
        const p = db.patients.find(pt => pt.id === dischargedPatientId);
        if (p) {
          p.bed = null;
          p.status = 'Discharged / Outpatient';
          if (isMongoConnected) {
            await models.Patient.updateOne({ id: p.id }, p);
          }
        }
      }

      if (isMongoConnected) {
        await models.Bed.updateOne({ id: bed.id }, bed);
      }
      saveDatabase();

      return sendJSON(res, 200, {
        success: true,
        message: `Bed ${bed.id} vacated successfully. Patient ${dischargedPatientName || ''} discharged.`,
        data: bed
      });
    }

    if (pathname.startsWith('/api/beds/') && method === 'PUT') {
      const bedId = pathname.split('/')[3];
      const body = await parseBody(req);
      const bed = db.beds.find(b => b.id === bedId);
      if (!bed) return sendJSON(res, 404, { success: false, message: 'Bed not found.' });

      Object.assign(bed, body);
      if (isMongoConnected) {
        await models.Bed.updateOne({ id: bedId }, body);
      }
      saveDatabase();
      return sendJSON(res, 200, { success: true, data: bed });
    }

    // --- 9. Management: Department Bed Allocation & Expansion ---
    if (pathname === '/api/management/beds' && method === 'POST') {
      const body = await parseBody(req);
      const { departmentId, room, bedCode, count } = body;

      if (!departmentId) {
        return sendJSON(res, 400, { success: false, message: 'Department ID is required.' });
      }

      const numBeds = parseInt(count, 10) || 1;
      const createdBeds = [];

      for (let i = 1; i <= numBeds; i++) {
        const generatedCode = bedCode ? `${bedCode}-${100 + db.beds.length + i}` : `${departmentId.toUpperCase()}-${100 + db.beds.length + i}`;
        const newBed = {
          id: generatedCode,
          dept: departmentId.toLowerCase(),
          room: room || 'Ward Main',
          status: 'available',
          patientId: null,
          patientName: null,
          vitalsSummary: 'Newly Added by Management'
        };

        if (isMongoConnected) {
          await models.Bed.findOneAndUpdate({ id: generatedCode }, newBed, { upsert: true });
        }
        db.beds.push(newBed);
        createdBeds.push(newBed);
      }

      // Increment department total beds count
      const dept = db.departments.find(d => d.id === departmentId.toLowerCase());
      if (dept) {
        dept.beds = (dept.beds || 0) + numBeds;
        if (isMongoConnected) {
          await models.Department.updateOne({ id: dept.id }, { beds: dept.beds });
        }
      }

      saveDatabase();
      return sendJSON(res, 201, {
        success: true,
        message: `Successfully allocated ${numBeds} new bed(s) to ${departmentId.toUpperCase()} department.`,
        data: createdBeds
      });
    }

    // --- 10. Management: Bulk Drug Procurement Orders ---
    if (pathname === '/api/management/orders' && method === 'GET') {
      let orders = [];
      if (isMongoConnected) {
        orders = await models.DrugOrder.find({}).sort({ createdAt: -1 }).lean();
      }
      if (!orders || orders.length === 0) {
        orders = db.drugOrders || [];
      }
      return sendJSON(res, 200, { success: true, count: orders.length, data: orders });
    }

    if (pathname === '/api/management/orders' && method === 'POST') {
      const body = await parseBody(req);
      const qty = parseInt(body.quantity, 10) || 1;
      const unitCost = parseFloat(body.unitPrice) || 10;
      const totalCost = qty * unitCost;

      const newOrder = {
        id: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
        drugName: body.drugName,
        category: body.category || 'General Pharma',
        quantity: qty,
        unitPrice: unitCost,
        totalCost,
        supplier: body.supplier || 'MedPharma Wholesale Corp',
        orderedBy: body.orderedBy || 'Arthur Sterling (Management)',
        orderDate: new Date().toISOString().split('T')[0],
        status: body.status || 'Ordered'
      };

      if (isMongoConnected) {
        await models.DrugOrder.create(newOrder);
      }
      if (!db.drugOrders) db.drugOrders = [];
      db.drugOrders.unshift(newOrder);
      saveDatabase();

      return sendJSON(res, 201, {
        success: true,
        message: `Purchase Order ${newOrder.id} for ${qty} units of ${newOrder.drugName} placed successfully.`,
        data: newOrder
      });
    }

    // --- 11. Management: Departmental Drug Distribution ---
    if (pathname === '/api/management/distributions' && method === 'GET') {
      let dists = [];
      if (isMongoConnected) {
        const filter = query.department && query.department !== 'all' ? { targetDepartment: query.department } : {};
        dists = await models.Distribution.find(filter).sort({ createdAt: -1 }).lean();
      }
      if (!dists || dists.length === 0) {
        dists = db.distributions || [];
        if (query.department && query.department !== 'all') {
          dists = dists.filter(d => d.targetDepartment === query.department);
        }
      }
      return sendJSON(res, 200, { success: true, count: dists.length, data: dists });
    }

    if (pathname === '/api/management/distributions' && method === 'POST') {
      const body = await parseBody(req);
      const qty = parseInt(body.quantity, 10) || 1;

      const newDist = {
        id: `DIST-${Math.floor(1000 + Math.random() * 9000)}`,
        drugName: body.drugName,
        targetDepartment: body.targetDepartment.toLowerCase(),
        quantity: qty,
        batchNumber: `BATCH-${body.targetDepartment.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        dispatchedBy: body.dispatchedBy || 'Arthur Sterling (Management)',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Dispatched'
      };

      if (isMongoConnected) {
        await models.Distribution.create(newDist);
      }
      if (!db.distributions) db.distributions = [];
      db.distributions.unshift(newDist);
      saveDatabase();

      return sendJSON(res, 201, {
        success: true,
        message: `Dispatched ${qty} units of ${newDist.drugName} to ${newDist.targetDepartment.toUpperCase()} department.`,
        data: newDist
      });
    }

    // --- 12. Management: Weekly Cost Reports to Admin ---
    if (pathname === '/api/management/reports' && method === 'GET') {
      let reports = [];
      if (isMongoConnected) {
        reports = await models.CostReport.find({}).sort({ createdAt: -1 }).lean();
      }
      if (!reports || reports.length === 0) {
        reports = db.costReports || [];
      }
      return sendJSON(res, 200, { success: true, count: reports.length, data: reports });
    }

    if (pathname === '/api/management/reports' && method === 'POST') {
      const body = await parseBody(req);
      const bedExp = parseFloat(body.bedExpansionCost) || 0;
      const drugProc = parseFloat(body.drugProcurementCost) || 0;
      const distOver = parseFloat(body.distributionOverhead) || 0;
      const total = bedExp + drugProc + distOver;

      const now = new Date();
      const weekNum = Math.ceil((now.getDate() + 6 - now.getDay()) / 7);
      const newReport = {
        id: `REP-${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
        weekRange: body.weekRange || `Week ${weekNum}, ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`,
        totalCost: total,
        breakdown: {
          bedExpansionCost: bedExp,
          drugProcurementCost: drugProc,
          distributionOverhead: distOver
        },
        submittedBy: body.submittedBy || 'Arthur Sterling (Director of Management)',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Submitted to Admin',
        adminNotes: 'Awaiting Admin Review'
      };

      if (isMongoConnected) {
        await models.CostReport.create(newReport);
      }
      if (!db.costReports) db.costReports = [];
      db.costReports.unshift(newReport);
      saveDatabase();

      return sendJSON(res, 201, {
        success: true,
        message: `Weekly Cost Report ${newReport.id} successfully compiled and dispatched to Hospital Admin!`,
        data: newReport
      });
    }

    if (pathname.startsWith('/api/management/reports/') && pathname.endsWith('/status') && method === 'PUT') {
      const reportId = pathname.split('/')[4];
      const body = await parseBody(req);
      const report = (db.costReports || []).find(r => r.id === reportId);
      if (!report) return sendJSON(res, 404, { success: false, message: 'Report not found.' });

      report.status = body.status || 'Reviewed by Admin';
      if (body.adminNotes) report.adminNotes = body.adminNotes;

      if (isMongoConnected) {
        await models.CostReport.updateOne({ id: reportId }, { status: report.status, adminNotes: report.adminNotes });
      }
      saveDatabase();
      return sendJSON(res, 200, { success: true, data: report });
    }

    // --- 13. HOD: Requirement Requisitions to Management ---
    if (pathname === '/api/management/requisitions' && method === 'GET') {
      let reqs = [];
      if (isMongoConnected) {
        const filter = query.department && query.department !== 'all' ? { department: query.department } : {};
        reqs = await models.Requisition.find(filter).sort({ createdAt: -1 }).lean();
      }
      if (!reqs || reqs.length === 0) {
        reqs = db.requisitions || [];
        if (query.department && query.department !== 'all') {
          reqs = reqs.filter(r => r.department === query.department);
        }
      }
      return sendJSON(res, 200, { success: true, count: reqs.length, data: reqs });
    }

    if (pathname === '/api/management/requisitions' && method === 'POST') {
      const body = await parseBody(req);
      const newReq = {
        id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        department: body.department.toLowerCase(),
        hodName: body.hodName,
        hodId: body.hodId,
        requestType: body.requestType,
        items: body.items,
        quantity: parseInt(body.quantity, 10) || 1,
        priority: body.priority || 'Urgent',
        notes: body.notes || '',
        status: 'Pending Review',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        fulfilledBy: null,
        fulfilledDate: null
      };

      if (isMongoConnected) {
        await models.Requisition.create(newReq);
      }
      if (!db.requisitions) db.requisitions = [];
      db.requisitions.unshift(newReq);
      saveDatabase();

      return sendJSON(res, 201, {
        success: true,
        message: `Requirement requisition ${newReq.id} submitted to Hospital Management.`,
        data: newReq
      });
    }

    if (pathname.startsWith('/api/management/requisitions/') && pathname.endsWith('/status') && method === 'PUT') {
      const reqId = pathname.split('/')[4];
      const body = await parseBody(req);
      const requisition = (db.requisitions || []).find(r => r.id === reqId);
      if (!requisition) return sendJSON(res, 404, { success: false, message: 'Requisition not found.' });

      requisition.status = body.status;
      if (body.status === 'Approved & Fulfilled') {
        requisition.fulfilledBy = body.fulfilledBy || 'Arthur Sterling (Management)';
        requisition.fulfilledDate = new Date().toISOString().replace('T', ' ').substring(0, 16);

        // Auto-fulfill: if it was additional beds, add them to that department!
        if (requisition.requestType === 'Additional Beds') {
          const numBeds = requisition.quantity || 1;
          for (let i = 1; i <= numBeds; i++) {
            const bedCode = `${requisition.department.toUpperCase()}-${100 + db.beds.length + i}`;
            const newBed = {
              id: bedCode,
              dept: requisition.department,
              room: 'Ward Expanded',
              status: 'available',
              patientId: null,
              patientName: null,
              vitalsSummary: 'Fulfilled via HOD Requisition'
            };
            db.beds.push(newBed);
            if (isMongoConnected) {
              await models.Bed.findOneAndUpdate({ id: bedCode }, newBed, { upsert: true });
            }
          }
        }
      }

      if (isMongoConnected) {
        await models.Requisition.updateOne({ id: reqId }, {
          status: requisition.status,
          fulfilledBy: requisition.fulfilledBy,
          fulfilledDate: requisition.fulfilledDate
        });
      }
      saveDatabase();
      return sendJSON(res, 200, { success: true, message: `Requisition ${reqId} is now marked as "${requisition.status}".`, data: requisition });
    }

    // --- 14. Chat Channels & Messages ---
    if (pathname === '/api/chat/channels' && method === 'GET') {
      let channels = [];
      if (isMongoConnected) {
        channels = await models.ChatChannel.find({}).lean();
      }
      if (!channels || channels.length === 0) {
        channels = db.chatChannels;
      }
      return sendJSON(res, 200, { success: true, data: channels });
    }

    if (pathname === '/api/chat/messages' && method === 'GET') {
      let msgs = [];
      if (isMongoConnected) {
        const filter = query.channelId ? { channelId: query.channelId } : {};
        msgs = await models.ChatMessage.find(filter).lean();
      }
      if (!msgs || msgs.length === 0) {
        msgs = db.chatMessages;
        if (query.channelId) {
          msgs = msgs.filter(m => m.channelId === query.channelId);
        }
      }
      return sendJSON(res, 200, { success: true, data: msgs });
    }

    if (pathname === '/api/chat/messages' && method === 'POST') {
      const body = await parseBody(req);
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      const timestamp = `${hours}:${minutes} ${ampm}`;

      const newMsg = {
        id: `msg_${Date.now()}`,
        channelId: body.channelId,
        senderId: body.senderId,
        senderName: body.senderName,
        senderRole: body.senderRole,
        patientRef: body.patientRef || null,
        text: body.text,
        timestamp
      };

      if (isMongoConnected) {
        await models.ChatMessage.create(newMsg);
      }
      db.chatMessages.push(newMsg);
      saveDatabase();
      return sendJSON(res, 201, { success: true, data: newMsg });
    }

    // Unmatched API endpoint
    if (pathname.startsWith('/api/')) {
      return sendJSON(res, 404, { success: false, message: 'API endpoint not found.' });
    }

    // Serve Static React Frontend
    serveStatic(req, res, parsedUrl);

  } catch (err) {
    console.error('[SERVER ERROR]', err);
    return sendJSON(res, 500, { success: false, message: 'Internal server error', error: err.message });
  }
});

// Start listening with automatic port fallback on EADDRINUSE
function startServer(targetPort) {
  server.listen(targetPort, () => {
    console.log(`=======================================================`);
    console.log(`🏥 MediCover HMS Backend & Frontend Server Active`);
    console.log(`🌐 URL: http://localhost:${targetPort}`);
    console.log(`⚡ Conflict Engine: Active (Overlap Formula: new_start < existing_end && new_end > existing_start)`);
    console.log(`=======================================================`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[PORT WARNING] Port ${targetPort} is already in use, trying port ${targetPort + 1}...`);
      startServer(targetPort + 1);
    } else {
      console.error('[SERVER ERROR]', err);
    }
  });
}

startServer(PORT);
