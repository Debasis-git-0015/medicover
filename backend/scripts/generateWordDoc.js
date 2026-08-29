const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, ShadingType } = require('docx');
const fs = require('fs');
const path = require('path');

function createHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 }
  });
}

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 }
  });
}

function createHeading3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 }
  });
}

function createBodyParagraph(text) {
  return new Paragraph({
    children: [new TextRun({ text: text, size: 24, font: 'Calibri' })],
    spacing: { after: 150, line: 280 }
  });
}

function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', bold: true, size: 24, font: 'Calibri' }));
  }
  children.push(new TextRun({ text: text, size: 24, font: 'Calibri' }));
  return new Paragraph({
    children: children,
    bullet: { level: 0 },
    spacing: { after: 100 }
  });
}

function createCallout(title, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: `📌 ${title}`, bold: true, color: '0052CC', size: 24, font: 'Calibri' })],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [new TextRun({ text: text, size: 22, font: 'Calibri', italics: true })],
                spacing: { after: 50 }
              })
            ],
            shading: { fill: 'F0F7FF', type: ShadingType.CLEAR },
            margins: { top: 150, bottom: 150, left: 200, right: 200 }
          })
        ]
      })
    ]
  });
}

async function buildDocx() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // ==========================================
          // COVER / TITLE PAGE
          // ==========================================
          new Paragraph({ text: '', spacing: { before: 1000 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: '🏥 MEDICOVER.MY',
                bold: true,
                size: 56,
                color: '0052CC',
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'INTELLIGENT HOSPITAL MANAGEMENT SYSTEM (HMS)',
                bold: true,
                size: 32,
                color: '172B4D',
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Full Technical Specification, Mathematical Conflict Engine & Clinical Workflow Architecture',
                italics: true,
                size: 24,
                color: '5E6C84',
                font: 'Calibri'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 }
          }),

          createCallout(
            'SYSTEM SUMMARY & METRICS',
            'MediCover HMS provides role-tailored dashboards for Hospital Administrators, Department Heads (HOD), Clinical Physicians, Ward Nurses, Pharmacy Compounders, and Logistics Management with real-time Doctor Availability Conflict Shielding, Ward Bed Overlap Prevention, and MongoDB Atlas Cloud Synchronization.'
          ),

          new Paragraph({ text: '', spacing: { before: 1200 } }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Author / Engineering Team: ', bold: true, size: 24, font: 'Calibri' }),
              new TextRun({ text: 'MediCover Systems Engineering', size: 24, font: 'Calibri' })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Version: ', bold: true, size: 24, font: 'Calibri' }),
              new TextRun({ text: 'v2.4.0 Production Build', size: 24, font: 'Calibri' })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Technology Stack: ', bold: true, size: 24, font: 'Calibri' }),
              new TextRun({ text: 'React.js (Vite), Node.js Micro-HTTP Engine, MongoDB Atlas Cloud & Persistent JSON Engine', size: 24, font: 'Calibri' })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Date: ', bold: true, size: 24, font: 'Calibri' }),
              new TextRun({ text: 'August 2026', size: 24, font: 'Calibri' })
            ],
            spacing: { after: 400 }
          }),

          new Paragraph({ text: '', pageBreakBefore: true }),

          // ==========================================
          // TABLE OF CONTENTS & EXECUTIVE SUMMARY
          // ==========================================
          createHeading1('Table of Contents'),
          createBullet('1. Executive Summary & Problem Formulation'),
          createBullet('2. Overall System Architecture & Tech Stack'),
          createBullet('3. Role-Based Access Control (RBAC) & Permissions'),
          createBullet('4. Doctor Availability Overlap Conflict Engine'),
          createBullet('5. Nurse Ward Bed Collision & Anti-Overlap Shield'),
          createBullet('6. Hospital Management & Logistics Suite'),
          createBullet('7. HOD Scoped Console & Resource Requisition Workflow'),
          createBullet('8. Clinical Prescription & Pharmacy Dispensing Pipeline'),
          createBullet('9. Real-Time Inter-Staff Communication Hub'),
          createBullet('10. Database Schema & MongoDB Atlas Cloud Integration'),
          createBullet('11. Complete REST API Specifications'),
          createBullet('12. Production Deployment & Cloud Hosting Guide'),

          new Paragraph({ text: '', spacing: { before: 300 } }),
          createHeading1('1. Executive Summary & Problem Formulation'),
          createBodyParagraph(
            'Modern healthcare facilities encounter severe logistical and clinical bottlenecks due to fragmented communication, double-booked medical appointments, and uncoordinated resource allocations. In traditional hospital systems, physicians are frequently assigned overlapping consultation slots, leading to extended patient wait times, physician burnout, and clinical scheduling errors. Furthermore, hospital administrators lack visibility into department-level supply requisitions and real-time bed telemetry.'
          ),
          createBodyParagraph(
            'MediCover.my solves these challenges through an integrated, multi-role hospital management web platform engineered with algorithmic conflict prevention. By implementing mathematical time-interval overlap evaluations, the system guarantees 100% immunity against double-booked physician schedules and simultaneous patient bed appointments.'
          ),

          createHeading2('Key System Innovations:'),
          createBullet('Zero Double-Booking Guarantee: Exact interval logic (new_start < existing_end && new_end > existing_start) rejects scheduling collisions with HTTP 409 Conflict.', '1. Mathematical Conflict Shield:'),
          createBullet('Six dedicated dashboards designed for Administrator, HOD, Doctor, Nurse, Compounder, and Operations Management.', '2. Multi-Role Architecture:'),
          createBullet('Department Heads (HOD) only access clinical staff and beds allocated to their specific department ward.', '3. Strict Departmental Scoping:'),
          createBullet('Hospital Operations Management can allocate beds, place bulk drug purchase orders, distribute pharmaceuticals, and dispatch weekly financial reports to the Administrator.', '4. Full Operations & Logistics Suite:'),
          createBullet('Bi-directional synchronization between local in-memory persistence and high-availability MongoDB Atlas cloud clusters.', '5. Dual-Mode Database Resilience:'),

          new Paragraph({ text: '', pageBreakBefore: true }),

          // ==========================================
          // SYSTEM ARCHITECTURE
          // ==========================================
          createHeading1('2. Overall System Architecture & Tech Stack'),
          createBodyParagraph(
            'MediCover.my is structured as a decoupled Single Page Application (SPA) communicating over JSON REST API protocols with a high-performance Node.js asynchronous backend.'
          ),

          createCallout(
            'ARCHITECTURE TOPOLOGY',
            '[ Frontend Client (React 18 + Vite) ] ➔ [ HTTP / REST API ] ➔ [ Node.js Micro-Server & Conflict Engine ] ➔ [ MongoDB Atlas Cloud & Local db.json Cache ]'
          ),

          createHeading2('Technology Specifications:'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Layer', bold: true })] })], shading: { fill: 'E2E8F0', type: ShadingType.CLEAR } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Technology', bold: true })] })], shading: { fill: 'E2E8F0', type: ShadingType.CLEAR } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Role & Responsibility', bold: true })] })], shading: { fill: 'E2E8F0', type: ShadingType.CLEAR } })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Frontend' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'React 18 + Vite' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Component-based SPA, Lucide icons, responsive CSS design tokens' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Backend API' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Node.js REST Engine' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Asynchronous HTTP request router, Conflict Engine, Auth verification' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Primary Cloud DB' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'MongoDB Atlas M0' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Mongoose ODM, automated schema validation, AWS Mumbai cluster' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Local Persistence' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Persistent JSON Store' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'db.json local caching engine with zero cold-start latency' })] })
                ]
              })
            ]
          }),

          new Paragraph({ text: '', spacing: { before: 300 } }),
          createHeading1('3. Role-Based Access Control (RBAC) Matrix'),
          createBodyParagraph(
            'Security and privacy in hospital systems require strict role segregation. MediCover enforces granular permissions preventing unauthorized lateral movement across departments.'
          ),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Designation', bold: true })] })], shading: { fill: 'E2E8F0', type: ShadingType.CLEAR } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Access Scope', bold: true })] })], shading: { fill: 'E2E8F0', type: ShadingType.CLEAR } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Core Permissions', bold: true })] })], shading: { fill: 'E2E8F0', type: ShadingType.CLEAR } })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: '🛡️ Admin' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Hospital Global (All Departments)' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Create/remove departments, register personnel, inspect plain passwords, delete staff/HODs, review weekly cost reports.' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: '🏢 Management' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Hospital Operations & Logistics' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Allocate beds to departments, place bulk drug procurement purchase orders, distribute pharmaceuticals, fulfill HOD requisitions, dispatch weekly expenditure reports to Admin.' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: '🎖️ HOD' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Scoped strictly to Assigned Department' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'View and manage departmental doctors, nurses, and compounders. Submit resource and bed requisitions to Management.' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: '🩺 Doctor' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Department Clinical Console' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Review patient charts, issue digital prescriptions, book appointments protected by Doctor Conflict Engine.' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: '💉 Nurse' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Ward Station & Bed Telemetry' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Appoint beds to patients with anti-overlap collision shield, record vitals (BP, SpO2, Pulse, Temp), administer medication rounds.' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: '💊 Compounder' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Pharmacy Fulfillment Station' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Process prescription compounding queue, verify drug interactions, manage inventory quantities, trigger restock alerts.' })] })
                ]
              })
            ]
          }),

          new Paragraph({ text: '', pageBreakBefore: true }),

          // ==========================================
          // CONFLICT DETECTION ENGINE
          // ==========================================
          createHeading1('4. Doctor Availability Overlap Conflict Engine'),
          createBodyParagraph(
            'The core mathematical innovation of MediCover HMS is its Doctor Availability Conflict Engine. When an appointment booking request is submitted, the system validates the slot through a 4-tier decision tree:'
          ),

          createHeading2('Algorithmic Decision Tree:'),
          createBullet('Step 1: Check Doctor Status — Verifies that the physician is active and not on approved medical or annual leave.', '1. Physician Active State:'),
          createBullet('Step 2: Time Boundary Sanity — Validates that start_time < end_time and that appointment duration is at least 10 minutes.', '2. Boundary Validation:'),
          createBullet('Step 3: Shift Schedule Conformance — Validates that requested start and end times fall strictly within the physician\'s scheduled clinic hours (e.g. 08:00 to 16:00).', '3. Shift Conformance:'),
          createBullet('Step 4: Interval Overlap Detection — Evaluates all confirmed appointments for the physician on the target date against the mathematical overlap condition.', '4. Overlap Evaluation:'),

          createHeading2('The Mathematical Overlap Condition:'),
          createCallout(
            'MATHEMATICAL OVERLAP FORMULA',
            'Two time intervals [Start_A, End_A] and [Start_B, End_B] overlap if and only if:\n\n(new_start < existing_end) AND (new_end > existing_start)\n\nIf both inequalities evaluate to TRUE, a conflict exists and the server returns HTTP 409 Conflict.'
          ),

          createHeading3('Example Conflict Proof:'),
          createBodyParagraph(
            'Suppose Doctor DOC001 has an existing appointment: 10:00 to 10:30 (600 min to 630 min). A new booking request is made for 10:15 to 10:45 (615 min to 645 min).'
          ),
          createBullet('Condition 1: new_start (615) < existing_end (630) ➔ TRUE (615 < 630)', 'Check 1:'),
          createBullet('Condition 2: new_end (645) > existing_start (600) ➔ TRUE (645 > 600)', 'Check 2:'),
          createBullet('Conclusion: Both conditions are satisfied ➔ Conflicting overlap detected ➔ Booking rejected with HTTP 409 Conflict.', 'Result:'),

          new Paragraph({ text: '', spacing: { before: 300 } }),
          createHeading1('5. Nurse Ward Bed Collision & Anti-Overlap Shield'),
          createBodyParagraph(
            'In addition to physician scheduling, ward bed allocations are protected by an Anti-Collision Shield. A bed in a hospital ward represents a single physical resource that cannot accommodate more than one patient concurrently.'
          ),

          createHeading2('Collision Prevention Rules:'),
          createBullet('Occupied Bed Lock: If target_bed.status === "occupied" or "critical", or another patient is registered to the bed, any new appointment attempt is blocked with HTTP 409 Conflict.', 'Rule 1:'),
          createBullet('Double-Bed Prevention: If a patient already occupies Bed A and is assigned Bed B, the system automatically frees and sanitizes Bed A (transfer workflow).', 'Rule 2:'),
          createBullet('Discharge Sanitization: When a nurse vacates a bed, the patient chart is updated to discharged and the bed status transitions to "available" with sanitized telemetry ready for admission.', 'Rule 3:'),

          new Paragraph({ text: '', pageBreakBefore: true }),

          // ==========================================
          // OPERATIONS & MANAGEMENT SUITE
          // ==========================================
          createHeading1('6. Hospital Management & Operations Logistics Suite'),
          createBodyParagraph(
            'The Hospital Operations Manager (`Arthur Sterling`, Director of Operations) oversees physical hospital infrastructure, procurement budgets, and supply chain logistics.'
          ),

          createHeading2('Core Functional Modules:'),
          createBullet('Management can dynamically provision additional beds to any clinical department ward (e.g. Ophthalmology, Cardiology, Ambulance service, Neurology), expanding bed quotas in real time.', '1.1 Department Bed Allocation:'),
          createBullet('Issues formal Purchase Orders (PO) to pharmaceutical distributors with quantity, unit pricing, supplier details, and automated total expenditure calculations.', '1.2 Bulk Drug Procurement:'),
          createBullet('Transfers pharmaceutical inventory batches from central stores directly to department ward pharmacies with batch code tracking.', '1.3 Departmental Distribution:'),
          createBullet('Aggregates weekly capital and operational expenses (Bed expansion + Drug orders + Logistics overhead) into a standardized weekly report dispatched directly to the Hospital Admin console.', '1.4 Weekly Cost Reports:'),
          createBullet('Real-time inbox receiving supply and bed requests submitted by Department HODs with single-click "Approve & Fulfill" automation.', '1.5 HOD Requisitions Inbox:'),

          new Paragraph({ text: '', spacing: { before: 300 } }),
          createHeading1('7. HOD Scoped Console & Resource Requisition Workflow'),
          createBodyParagraph(
            'Department Heads (HODs) require administrative tools to supervise their assigned personnel and requisition critical resources from Hospital Operations.'
          ),

          createCallout(
            'HOD REQUISITION WORKFLOW',
            '[ HOD Submits Requisition (Beds, Drugs, Equipment) ] ➔ [ Pushed to Management Requisition Inbox ] ➔ [ Management Reviews & Clicks "Approve & Fulfill" ] ➔ [ Beds/Drugs Automatically Provisioned to Target Department ]'
          ),

          new Paragraph({ text: '', pageBreakBefore: true }),

          // ==========================================
          // CLINICAL EMR & PHARMACY PIPELINE
          // ==========================================
          createHeading1('8. Clinical Prescription & Pharmacy Dispensing Pipeline'),
          createBodyParagraph(
            'The digital prescription pipeline connects the Doctor Consultation Desk with the Compounder Pharmacy Station in real time, eliminating paper transcription errors.'
          ),

          createBullet('Physician issues a digital Rx containing multi-line medicines, dosages, dosing frequency, and administration instructions.', '1. Prescription Creation:'),
          createBullet('The prescription immediately enters the Compounder Pharmacy Queue with status "Pending".', '2. Live Queue Ingest:'),
          createBullet('The compounder initiates compounding (status: "Compounding"), verifies drug allergies and dosage thresholds.', '3. Compounding Phase:'),
          createBullet('Upon completion, the compounder marks the order "Dispensed" with verification timestamp and dispensing compounder ID.', '4. Verification & Dispensing:'),
          createBullet('Ward nurses receive real-time notification on the Ward Medication Schedule for scheduled administration.', '5. Nurse Ward Delivery:'),

          new Paragraph({ text: '', spacing: { before: 300 } }),
          createHeading1('9. Real-Time Inter-Staff Communication Hub'),
          createBodyParagraph(
            'Hospital operations require rapid clinical handoffs between on-duty personnel. The Inter-Staff Hub provides encrypted departmental and cross-functional intercom messaging channels.'
          ),

          createBullet('Dedicated channel for each department (e.g. Ophthalmology, Ambulance, Cardiology, Pharmacy).', 'Departmental Channels:'),
          createBullet('Quick clinical communication chips for rapid urgent messages (e.g. "Critical Vitals Alert", "Send Ambulance 108", "STAT Medication Request").', 'Clinical Macro Chips:'),
          createBullet('Seamless "⬅️ Back to Dashboard" navigation that preserves the active user role state and context.', 'Context Preserving UI:'),

          new Paragraph({ text: '', pageBreakBefore: true }),

          // ==========================================
          // DATABASE & API SPECIFICATION
          // ==========================================
          createHeading1('10. Database Schema & MongoDB Atlas Cloud Integration'),
          createBodyParagraph(
            'MediCover HMS utilizes MongoDB Atlas Cloud as its primary high-availability database cluster, backed by Mongoose object data modeling.'
          ),

          createHeading2('Core Database Collections:'),
          createBullet('departments: Clinical department metadata, code, icon, bed capacity, assigned HOD.', '1.'),
          createBullet('staffs: Staff profiles, user IDs, encrypted passwords, roles, shift schedules, avatar.', '2.'),
          createBullet('appointments: Booked consultations protected by the Doctor Availability Conflict Engine.', '3.'),
          createBullet('patients: Electronic Medical Records, admitting diagnosis, triage acuity, physiological vitals.', '4.'),
          createBullet('prescriptions: Digital prescriptions, multi-line drug orders, compounding statuses.', '5.'),
          createBullet('inventories: Central pharmacy drug stock quantities, packaging units, reorder baseline thresholds.', '6.'),
          createBullet('beds: Ward bed allocation matrix, room numbers, telemetry statuses, assigned patient IDs.', '7.'),
          createBullet('drugorders: Wholesale purchase orders issued by Management to pharmaceutical suppliers.', '8.'),
          createBullet('distributions: Departmental drug distribution batches and dispatch histories.', '9.'),
          createBullet('costreports: Weekly expenditure and budget reports dispatched to the Administrator.', '10.'),
          createBullet('requisitions: Resource and bed requisitions submitted by HODs to Management.', '11.'),
          createBullet('chatmessages & chatchannels: Inter-staff handoff communication logs.', '12.'),

          new Paragraph({ text: '', spacing: { before: 300 } }),
          createHeading1('11. Complete REST API Specifications'),
          createBodyParagraph(
            'All endpoints communicate over standard HTTP with JSON payloads and CORS support.'
          ),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Method & Path', bold: true })] })], shading: { fill: 'E2E8F0', type: ShadingType.CLEAR } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Description & Parameters', bold: true })] })], shading: { fill: 'E2E8F0', type: ShadingType.CLEAR } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Response Codes', bold: true })] })], shading: { fill: 'E2E8F0', type: ShadingType.CLEAR } })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'POST /api/auth/login' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Authenticate staff user credentials and role' })] }),
                  new TableCell({ children: [new Paragraph({ text: '200 OK, 401 Unauthorized, 403 Forbidden' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'GET/POST /api/staff' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Retrieve staff directory or register new personnel' })] }),
                  new TableCell({ children: [new Paragraph({ text: '200 OK, 201 Created, 400 Bad Request' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'DELETE /api/staff/:id' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Admin-only permanent removal of staff or HOD' })] }),
                  new TableCell({ children: [new Paragraph({ text: '200 OK, 404 Not Found' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'GET/POST /api/departments' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Retrieve departments or create new department' })] }),
                  new TableCell({ children: [new Paragraph({ text: '200 OK, 201 Created' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'POST /api/appointments' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Book appointment (Evaluated by Conflict Engine)' })] }),
                  new TableCell({ children: [new Paragraph({ text: '201 Created, 400 Out of shift, 409 Conflict' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'POST /api/beds/appoint' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Appoint bed to patient (Protected by Bed Overlap Shield)' })] }),
                  new TableCell({ children: [new Paragraph({ text: '200 OK, 409 Bed Collision' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'PUT /api/beds/:id/vacate' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Discharge patient and sanitize bed to available' })] }),
                  new TableCell({ children: [new Paragraph({ text: '200 OK, 404 Not Found' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'POST /api/management/beds' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Management bed allocation and department expansion' })] }),
                  new TableCell({ children: [new Paragraph({ text: '201 Created, 400 Bad Request' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'GET/POST /api/management/orders' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Bulk pharmaceutical purchase orders' })] }),
                  new TableCell({ children: [new Paragraph({ text: '200 OK, 201 Created' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'GET/POST /api/management/reports' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Compile and dispatch weekly cost reports to Admin' })] }),
                  new TableCell({ children: [new Paragraph({ text: '200 OK, 201 Created' })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'GET/POST/PUT /api/management/requisitions' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'HOD requirement requests & Management fulfillment' })] }),
                  new TableCell({ children: [new Paragraph({ text: '200 OK, 201 Created' })] })
                ]
              })
            ]
          }),

          new Paragraph({ text: '', pageBreakBefore: true }),

          // ==========================================
          // DEPLOYMENT GUIDE & FUTURE SCOPE
          // ==========================================
          createHeading1('12. Production Deployment & Cloud Hosting Guide'),
          createBodyParagraph(
            'The MediCover HMS architecture is engineered for 100% free-tier cloud deployment across leading cloud hosting providers.'
          ),

          createHeading2('Recommended Free Deployment Pipeline:'),
          createBullet('Frontend Hosting: Deploy the built React application (frontend/dist) to Vercel, Netlify, or Cloudflare Pages with zero configuration.', '1. Frontend on Vercel / Netlify:'),
          createBullet('Backend Web Service: Deploy the Node.js REST API server on Render Web Services (render.com) or Railway.app free tier.', '2. Backend on Render / Railway:'),
          createBullet('Cloud Database: Hosted on MongoDB Atlas M0 Cluster (AWS / Mumbai region) using the connection string MONGODB_URI.', '3. Database on MongoDB Atlas:'),

          createHeading2('Environment Variables Configuration (.env):'),
          createCallout(
            'PRODUCTION ENVIRONMENT VARIABLES',
            'PORT=3000\nMONGODB_URI=mongodb+srv://drixacc0015_db_user:hAT6sakH7CA0924Y@cluster0.9wdrize.mongodb.net/medicover_hms?retryWrites=true&w=majority&appName=Cluster0'
          ),

          createHeading2('Future Architectural Roadmap:'),
          createBullet('Integration with automated patient billing, copay deduction, and insurance claims clearance.', '1. Billing & Insurance Clearing:'),
          createBullet('WebRTC video consultation integration directly into the Doctor Consultation Desk.', '2. Telemedicine Video Intercom:'),
          createBullet('Automated telemetry ingest from bedside patient cardiac monitors via MQTT / WebSockets.', '3. IoT Bedside Telemetry:'),
          createBullet('AI-assisted symptom analysis and preliminary diagnosis recommendations for outpatient triage.', '4. AI Clinical Copilot:'),

          new Paragraph({ text: '', spacing: { before: 600 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: '— END OF TECHNICAL SPECIFICATION —',
                bold: true,
                size: 24,
                color: '5E6C84',
                font: 'Arial'
              })
            ],
            alignment: AlignmentType.CENTER
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, '..', '..', 'MediCover_HMS_Comprehensive_Documentation.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Generated 10-12 Page MS Word Document at: ${outPath}`);
}

buildDocx();
