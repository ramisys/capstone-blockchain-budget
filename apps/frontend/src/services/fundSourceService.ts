import apiClient from '../api/apiClient';

export const fundSourceApi = {
  // Get all fund sources with filtering, pagination, and sorting
  getAllFundSources: (params) => {
    return apiClient.get('/fund-sources', { params });
  },

  // Get fund source by ID
  getFundSourceById: (id) => {
    return apiClient.get(`/fund-sources/${id}`);
  },

  // Create a new fund source
  createFundSource: (data) => {
    return apiClient.post('/fund-sources', data);
  },

  // Update fund source by ID
  updateFundSource: (id, data) => {
    return apiClient.put(`/fund-sources/${id}`, data);
  },

  // Delete fund source by ID
  deleteFundSource: (id) => {
    return apiClient.delete(`/fund-sources/${id}`);
  }
};