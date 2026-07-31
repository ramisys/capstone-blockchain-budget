import apiClient from './axios';

export const fiscalYearApi = {
  // Get all fiscal years with filtering, pagination, and sorting
  getAllFiscalYears: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add filter parameters
    if (params.code) queryParams.append('code', params.code);
    if (params.description) queryParams.append('description', params.description);
    if (params.status) queryParams.append('status', params.status);
    if (params.isActive !== undefined && params.isActive !== null) queryParams.append('isActive', params.isActive);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    // Add pagination parameters
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    // Add sorting parameters
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    return apiClient.get(`/fiscal-years?${queryParams.toString()}`);
  },

  // Get fiscal year by ID
  getFiscalYearById: (id) => apiClient.get(`/fiscal-years/${id}`),

  // Create a new fiscal year
  createFiscalYear: (data) => apiClient.post('/fiscal-years', data),

  // Update fiscal year by ID
  updateFiscalYear: (id, data) => apiClient.put(`/fiscal-years/${id}`, data),

  // Delete fiscal year by ID
  deleteFiscalYear: (id) => apiClient.delete(`/fiscal-years/${id}`),

  // Set fiscal year as active
  setActiveFiscalYear: (id) => apiClient.put(`/fiscal-years/${id}/active`),
};