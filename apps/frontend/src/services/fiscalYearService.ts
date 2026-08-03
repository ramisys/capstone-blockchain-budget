import apiClient from '../api/apiClient';

export const fiscalYearApi = {
  // Get all fiscal years with filtering, pagination, and sorting
  getAllFiscalYears: (params) => {
    return apiClient.get('/fiscal-years', { params });
  },

  // Get fiscal year by ID
  getFiscalYearById: (id) => {
    return apiClient.get(`/fiscal-years/${id}`);
  },

  // Create a new fiscal year
  createFiscalYear: (data) => {
    return apiClient.post('/fiscal-years', data);
  },

  // Update fiscal year by ID
  updateFiscalYear: (id, data) => {
    return apiClient.put(`/fiscal-years/${id}`, data);
  },

  // Delete fiscal year by ID
  deleteFiscalYear: (id) => {
    return apiClient.delete(`/fiscal-years/${id}`);
  },

  // Set fiscal year as active
  setActiveFiscalYear: (id) => {
    return apiClient.patch(`/fiscal-years/${id}/activate`);
  }
};