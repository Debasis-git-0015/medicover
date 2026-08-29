/* ==========================================================================
   MEDICOVER HMS - REST API CLIENT
   ========================================================================== */

const API_BASE = '/api';

export const API = {
  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}: Request failed`);
        error.status = response.status;
        error.code = data.code;
        error.conflictDetails = data.conflictDetails;
        throw error;
      }

      return data;
    } catch (err) {
      console.warn(`[API ERROR] ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth
  async login(userId, password, role, department = null) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password, role, department })
    });
  },

  // Departments (Admin Add & Global List)
  async getDepartments() {
    return this.request('/departments');
  },

  async addDepartment(deptData) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(deptData)
    });
  },

  // Staff (Admin Add, Toggle & Remove Staff / HOD)
  async getStaff(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/staff${query ? '?' + query : ''}`);
  },

  async addStaff(staffData) {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData)
    });
  },

  async toggleStaffStatus(staffId) {
    return this.request(`/staff/${staffId}/status`, {
      method: 'PUT'
    });
  },

  async deleteStaff(staffId) {
    return this.request(`/staff/${staffId}`, {
      method: 'DELETE'
    });
  },

  // Appointments & Conflict Resolution
  async getAppointments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/appointments${query ? '?' + query : ''}`);
  },

  async bookAppointment(appointmentData) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
  },

  // Patients
  async getPatients(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/patients${query ? '?' + query : ''}`);
  },

  async updatePatientVitals(patientId, vitals) {
    return this.request(`/patients/${patientId}/vitals`, {
      method: 'PUT',
      body: JSON.stringify({ vitals })
    });
  },

  // Prescriptions
  async getPrescriptions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/prescriptions${query ? '?' + query : ''}`);
  },

  async createPrescription(rxData) {
    return this.request('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(rxData)
    });
  },

  async updatePrescriptionStatus(rxId, status, dispensedBy = null) {
    return this.request(`/prescriptions/${rxId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, dispensedBy })
    });
  },

  // Pharmacy Inventory
  async getInventory() {
    return this.request('/inventory');
  },

  async updateStock(itemId, amount) {
    return this.request(`/inventory/${itemId}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ amount })
    });
  },

  // Ward Beds
  async getBeds(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/beds${query ? '?' + query : ''}`);
  },

  async appointBed(appointmentData) {
    return this.request('/beds/appoint', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
  },

  async vacateBed(bedId) {
    return this.request(`/beds/${bedId}/vacate`, {
      method: 'PUT'
    });
  },

  async updateBed(bedId, updateData) {
    return this.request(`/beds/${bedId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  // --- Management Operations (Beds, Drug Orders, Distribution, Weekly Reports) ---
  async addManagementBeds(bedData) {
    return this.request('/management/beds', {
      method: 'POST',
      body: JSON.stringify(bedData)
    });
  },

  async getDrugOrders() {
    return this.request('/management/orders');
  },

  async createDrugOrder(orderData) {
    return this.request('/management/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  async getDistributions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/management/distributions${query ? '?' + query : ''}`);
  },

  async createDistribution(distData) {
    return this.request('/management/distributions', {
      method: 'POST',
      body: JSON.stringify(distData)
    });
  },

  async getCostReports() {
    return this.request('/management/reports');
  },

  async createCostReport(reportData) {
    return this.request('/management/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  },

  async updateCostReportStatus(reportId, statusData) {
    return this.request(`/management/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    });
  },

  // --- HOD & Management Requisitions ---
  async getRequisitions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/management/requisitions${query ? '?' + query : ''}`);
  },

  async createRequisition(reqData) {
    return this.request('/management/requisitions', {
      method: 'POST',
      body: JSON.stringify(reqData)
    });
  },

  async updateRequisitionStatus(reqId, statusData) {
    return this.request(`/management/requisitions/${reqId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    });
  },

  // Chat
  async getChatChannels() {
    return this.request('/chat/channels');
  },

  async getChatMessages(channelId = null) {
    return this.request(`/chat/messages${channelId ? '?channelId=' + channelId : ''}`);
  },

  async sendChatMessage(msgData) {
    return this.request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify(msgData)
    });
  }
};
