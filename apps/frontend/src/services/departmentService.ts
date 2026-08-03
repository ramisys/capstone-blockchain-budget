import apiClient from '../api/apiClient';

export const departmentApi = {
  // Get all departments with filtering, pagination, and sorting
  getAllDepartments: (params) => {
    return apiClient.get('/departments', { params });
  },

  // Get department by ID
  getDepartmentById: (id) => {
    return apiClient.get(`/departments/${id}`);
  },

  // Get department by code
  getDepartmentByCode: (code) => {
    return apiClient.get(`/departments/code/${code}`);
  },

  // Get department by name
  getDepartmentByName: (name) => {
    return apiClient.get(`/departments/name/${name}`);
  },

  // Create a new department
  createDepartment: (data) => {
    return apiClient.post('/departments', data);
  },

  // Update department by ID
  updateDepartment: (id, data) => {
    return apiClient.put(`/departments/${id}`, data);
  },

  // Delete department by ID
  deleteDepartment: (id) => {
    return apiClient.delete(`/departments/${id}`);
  }
};