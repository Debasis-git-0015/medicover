const mongoose = require('mongoose');

// 1. Department Schema
const DepartmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  head: { type: String, default: 'To Be Appointed' },
  icon: { type: String, default: '🏥' },
  beds: { type: Number, default: 10 }
}, { timestamps: true });

// 2. Staff Schema
const StaffSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  altId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'hod', 'doctor', 'nurse', 'compounder', 'management'], required: true },
  department: { type: String, required: true },
  designation: { type: String, default: '' },
  phone: { type: String, default: '' },
  shift: { type: String, default: 'General (09:00 - 18:00)' },
  status: { type: String, enum: ['active', 'on-leave'], default: 'active' },
  avatar: { type: String, default: 'ST' },
  joined: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true });

// 3. Appointment Schema
const AppointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  department: { type: String, required: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  type: { type: String, default: 'Consultation' },
  status: { type: String, default: 'Confirmed' },
  notes: { type: String, default: '' }
}, { timestamps: true });

// 4. Patient Schema
const PatientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, default: 30 },
  gender: { type: String, default: 'Other' },
  department: { type: String, required: true },
  doctor: { type: String },
  nurse: { type: String },
  bed: { type: String },
  admissionDate: { type: String },
  triage: { type: String, enum: ['Emergency', 'Urgent', 'Routine'], default: 'Routine' },
  diagnosis: { type: String, default: '' },
  symptoms: { type: String, default: '' },
  vitals: {
    bp: { type: String, default: '120/80' },
    pulse: { type: String, default: '72 bpm' },
    spo2: { type: String, default: '98%' },
    temp: { type: String, default: '98.6 °F' }
  },
  allergies: { type: String, default: 'None' },
  status: { type: String, default: 'Admitted' }
}, { timestamps: true });

// 5. Prescription Schema
const PrescriptionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  department: { type: String, required: true },
  doctorName: { type: String, required: true },
  doctorId: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toLocaleString() },
  medicines: [
    {
      name: { type: String, required: true },
      dosage: { type: String, required: true },
      frequency: { type: String, default: 'Twice daily' },
      duration: { type: String, default: '7 days' },
      notes: { type: String, default: '' }
    }
  ],
  instructions: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Compounding', 'Dispensed'], default: 'Pending' },
  dispensedBy: { type: String, default: null },
  dispensedTime: { type: String, default: null }
}, { timestamps: true });

// 6. Pharmacy Inventory Schema
const InventorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, default: 'General' },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'Units' },
  minThreshold: { type: Number, default: 10 },
  location: { type: String, default: 'Shelf A' },
  warning: { type: String, default: null }
}, { timestamps: true });

// 7. Bed Schema
const BedSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  dept: { type: String, required: true },
  room: { type: String, required: true },
  status: { type: String, enum: ['available', 'occupied', 'critical'], default: 'available' },
  patientId: { type: String, default: null },
  patientName: { type: String, default: null },
  vitalsSummary: { type: String, default: 'Ready for Admission' }
}, { timestamps: true });

// 8. Management: Bulk Drug Order Schema
const DrugOrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  drugName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  supplier: { type: String, required: true },
  orderedBy: { type: String, default: 'Arthur Sterling (Management)' },
  orderDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  status: { type: String, enum: ['Pending Approval', 'Ordered', 'Delivered', 'Cancelled'], default: 'Ordered' }
}, { timestamps: true });

// 9. Management: Departmental Drug Distribution Schema
const DistributionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  drugName: { type: String, required: true },
  targetDepartment: { type: String, required: true },
  quantity: { type: Number, required: true },
  batchNumber: { type: String, required: true },
  dispatchedBy: { type: String, default: 'Arthur Sterling (Management)' },
  timestamp: { type: String, default: () => new Date().toISOString().replace('T', ' ').substring(0, 16) },
  status: { type: String, enum: ['Dispatched', 'Received', 'In Transit'], default: 'Dispatched' }
}, { timestamps: true });

// 10. Management: Weekly Cost Report Schema
const CostReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  weekRange: { type: String, required: true },
  totalCost: { type: Number, required: true },
  breakdown: {
    bedExpansionCost: { type: Number, default: 0 },
    drugProcurementCost: { type: Number, default: 0 },
    distributionOverhead: { type: Number, default: 0 }
  },
  submittedBy: { type: String, default: 'Arthur Sterling (Management)' },
  timestamp: { type: String, default: () => new Date().toISOString().replace('T', ' ').substring(0, 16) },
  status: { type: String, enum: ['Submitted to Admin', 'Reviewed by Admin', 'Approved'], default: 'Submitted to Admin' },
  adminNotes: { type: String, default: 'Pending Admin review' }
}, { timestamps: true });

// 11. HOD: Requirement Requisition Schema
const RequisitionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  hodName: { type: String, required: true },
  hodId: { type: String, required: true },
  requestType: { type: String, enum: ['Additional Beds', 'Urgent Drug Supplies', 'Surgical Equipment', 'Staffing / Other'], required: true },
  items: { type: String, required: true },
  quantity: { type: Number, required: true },
  priority: { type: String, enum: ['Routine', 'Urgent', 'Critical Emergency'], default: 'Urgent' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['Pending Review', 'Approved & Fulfilled', 'Rejected'], default: 'Pending Review' },
  timestamp: { type: String, default: () => new Date().toISOString().replace('T', ' ').substring(0, 16) },
  fulfilledBy: { type: String, default: null },
  fulfilledDate: { type: String, default: null }
}, { timestamps: true });

// 12. Chat Channel Schema
const ChatChannelSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, default: 'channel' },
  icon: { type: String, default: '💬' },
  desc: { type: String, default: '' }
}, { timestamps: true });

// 13. Chat Message Schema
const ChatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  patientRef: { type: String, default: null },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { timestamps: true });

module.exports = {
  Department: mongoose.models.Department || mongoose.model('Department', DepartmentSchema),
  Staff: mongoose.models.Staff || mongoose.model('Staff', StaffSchema),
  Appointment: mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema),
  Patient: mongoose.models.Patient || mongoose.model('Patient', PatientSchema),
  Prescription: mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema),
  Inventory: mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema),
  Bed: mongoose.models.Bed || mongoose.model('Bed', BedSchema),
  DrugOrder: mongoose.models.DrugOrder || mongoose.model('DrugOrder', DrugOrderSchema),
  Distribution: mongoose.models.Distribution || mongoose.model('Distribution', DistributionSchema),
  CostReport: mongoose.models.CostReport || mongoose.model('CostReport', CostReportSchema),
  Requisition: mongoose.models.Requisition || mongoose.model('Requisition', RequisitionSchema),
  ChatChannel: mongoose.models.ChatChannel || mongoose.model('ChatChannel', ChatChannelSchema),
  ChatMessage: mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema)
};
