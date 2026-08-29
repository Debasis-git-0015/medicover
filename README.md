# 🏥 MediCover.my — Intelligent Hospital Management System (HMS)

> A modern, multi-role hospital management web platform engineered with **Mathematical Doctor Availability Conflict Detection**, **Anti-Collision Bed Overlap Shielding**, and real-time **MongoDB Atlas Cloud Synchronization**.

---

## 🌟 Key Features

### 1. 🛡️ Role-Based Access Control (RBAC)
- **Admin Portal**: Global hospital directory, password inspection, department creation & staff removal.
- **Management Desk (Operations & Logistics)**:
  - 🛏️ 1.1 Department Bed Allocation & Ward Expansion.
  - 📦 1.2 Bulk Pharmaceutical Purchase Orders.
  - 🚚 1.3 Departmental Drug Distribution.
  - 📊 1.4 Weekly Cost Reports dispatched to Hospital Admin.
- **HOD Portal**: Strictly scoped to assigned department (Ophthalmology, Cardiology, Ambulance, Neurology, etc.) with a **"📋 Request to Management"** resource requisition portal.
- **Doctor Consultation Desk**: Electronic Medical Records (EMR), digital Rx builder, and Appointment Conflict Sandbox.
- **Nurse Ward Station**: Live ward bed matrix, bed appointment with collision shield, vitals recording (`BP`, `SpO2`, `Pulse`, `Temp`), and medication rounds.
- **Compounder Pharmacy Station**: Digital prescription queue fulfillment (`Pending` ➔ `Compounding` ➔ `Dispensed`) & drug inventory stock threshold alerts.
- **Inter-Staff Intercom Hub**: Multi-channel clinical handoff discussion with context-preserving return navigation.

---

## ⚡ Mathematical Conflict Engines

### 1. 🩺 Doctor Availability Overlap Condition
Two appointments overlap if and only if:
$$\text{new\_start} < \text{existing\_end} \quad \text{AND} \quad \text{new\_end} > \text{existing\_start}$$
If both conditions are true, the booking is rejected with **`HTTP 409 Conflict`**.

### 2. 🛏️ Ward Bed Overlap & Collision Prevention Shield
- If a bed is already marked as `occupied` or `critical`, or assigned to an active patient, any new assignment attempt is blocked with **`HTTP 409 Conflict`** (`BED_OVERLAP_CONFLICT`).
- Prevents two patients from ever occupying the same physical ward bed simultaneously.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Lucide UI Icons, Custom Medical Blue & White Design System.
- **Backend**: Node.js Asynchronous Micro-Server REST API.
- **Database**: Dual-Mode Persistence (**MongoDB Atlas Cloud** + Local `db.json` Cache).

---

## 🚀 Quickstart & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Debasis-git-0015/medicover.git
cd medicover
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in `backend/`:
```env
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string
```

### 4. Run Locally
```bash
# In backend terminal:
cd backend
npm run dev

# In frontend terminal:
cd frontend
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 📑 Documentation
Comprehensive 12-page technical documentation is available in [`MediCover_HMS_Comprehensive_Documentation.docx`](./MediCover_HMS_Comprehensive_Documentation.docx).

---

## 📄 License
This project is licensed under the ISC License.
