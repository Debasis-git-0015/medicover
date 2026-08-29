const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const {
  Department,
  Staff,
  Appointment,
  Patient,
  Prescription,
  Inventory,
  Bed,
  DrugOrder,
  Distribution,
  CostReport,
  Requisition,
  ChatChannel,
  ChatMessage
} = require('../models');

async function seedData() {
  console.log('⏳ Connecting to MongoDB Atlas...');
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB Atlas.');
    process.exit(1);
  }

  const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'db.json'), 'utf8');
  const dbData = JSON.parse(raw);

  console.log('🔄 Migrating records to MongoDB Atlas...');

  try {
    // 1. Departments
    if (dbData.departments && dbData.departments.length > 0) {
      await Department.deleteMany({});
      await Department.insertMany(dbData.departments);
      console.log(`✅ Migrated ${dbData.departments.length} Departments`);
    }

    // 2. Staff
    if (dbData.staff && dbData.staff.length > 0) {
      await Staff.deleteMany({});
      await Staff.insertMany(dbData.staff);
      console.log(`✅ Migrated ${dbData.staff.length} Staff Members & HODs (including Management)`);
    }

    // 3. Appointments
    if (dbData.appointments && dbData.appointments.length > 0) {
      await Appointment.deleteMany({});
      await Appointment.insertMany(dbData.appointments);
      console.log(`✅ Migrated ${dbData.appointments.length} Appointments`);
    }

    // 4. Patients
    if (dbData.patients && dbData.patients.length > 0) {
      await Patient.deleteMany({});
      await Patient.insertMany(dbData.patients);
      console.log(`✅ Migrated ${dbData.patients.length} Patient Records`);
    }

    // 5. Prescriptions
    if (dbData.prescriptions && dbData.prescriptions.length > 0) {
      await Prescription.deleteMany({});
      await Prescription.insertMany(dbData.prescriptions);
      console.log(`✅ Migrated ${dbData.prescriptions.length} Prescriptions`);
    }

    // 6. Inventory
    if (dbData.pharmacyInventory && dbData.pharmacyInventory.length > 0) {
      await Inventory.deleteMany({});
      await Inventory.insertMany(dbData.pharmacyInventory);
      console.log(`✅ Migrated ${dbData.pharmacyInventory.length} Pharmacy Inventory Items`);
    }

    // 7. Beds
    if (dbData.beds && dbData.beds.length > 0) {
      await Bed.deleteMany({});
      await Bed.insertMany(dbData.beds);
      console.log(`✅ Migrated ${dbData.beds.length} Ward Beds`);
    }

    // 8. Management Drug Orders
    if (dbData.drugOrders && dbData.drugOrders.length > 0) {
      await DrugOrder.deleteMany({});
      await DrugOrder.insertMany(dbData.drugOrders);
      console.log(`✅ Migrated ${dbData.drugOrders.length} Bulk Drug Orders`);
    }

    // 9. Management Distributions
    if (dbData.distributions && dbData.distributions.length > 0) {
      await Distribution.deleteMany({});
      await Distribution.insertMany(dbData.distributions);
      console.log(`✅ Migrated ${dbData.distributions.length} Departmental Drug Distributions`);
    }

    // 10. Management Weekly Cost Reports
    if (dbData.costReports && dbData.costReports.length > 0) {
      await CostReport.deleteMany({});
      await CostReport.insertMany(dbData.costReports);
      console.log(`✅ Migrated ${dbData.costReports.length} Weekly Cost Reports`);
    }

    // 11. HOD Requisitions
    if (dbData.requisitions && dbData.requisitions.length > 0) {
      await Requisition.deleteMany({});
      await Requisition.insertMany(dbData.requisitions);
      console.log(`✅ Migrated ${dbData.requisitions.length} HOD Requisitions`);
    }

    // 12. Chat Channels & Messages
    if (dbData.chatChannels && dbData.chatChannels.length > 0) {
      await ChatChannel.deleteMany({});
      await ChatChannel.insertMany(dbData.chatChannels);
      console.log(`✅ Migrated ${dbData.chatChannels.length} Chat Channels`);
    }

    if (dbData.chatMessages && dbData.chatMessages.length > 0) {
      await ChatMessage.deleteMany({});
      await ChatMessage.insertMany(dbData.chatMessages);
      console.log(`✅ Migrated ${dbData.chatMessages.length} Chat Messages`);
    }

    console.log('=======================================================');
    console.log('🎉 ALL DATA INCLUDING MANAGEMENT COLLECTIONS SYNCED TO ATLAS!');
    console.log('=======================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  }
}

seedData();
