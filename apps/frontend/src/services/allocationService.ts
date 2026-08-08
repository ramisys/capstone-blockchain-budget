import type { AxiosResponse } from 'axios';
import apiClient from '../api/apiClient';
import type {
  Allocation,
  AllocationBreakdown,
  AllocationBreakdownDimension,
  AllocationFormData,
  AllocationListParams,
  AllocationStatistics,
  AllocationUpdateData,
  AllocationsResponse,
  ApprovalRecord,
  BudgetSummary,
} from '../types/allocation';

interface ApiEnvelope<T> {
  data: T;
}

export const allocationApi = {
  // Get all allocations with filtering, pagination, and sorting
  getAllocations(params: AllocationListParams): Promise<AxiosResponse<ApiEnvelope<AllocationsResponse>>> {
    return apiClient.get('/allocations', { params });
  },

  // Get allocation by ID
  getAllocationById(id: string): Promise<AxiosResponse<ApiEnvelope<{ allocation: Allocation }>>> {
    return apiClient.get(`/allocations/${id}`);
  },

  // Create a new budget allocation
  createAllocation(data: AllocationFormData): Promise<AxiosResponse> {
    return apiClient.post('/allocations', data);
  },

  // Update allocation by ID (only Draft allocations are editable)
  updateAllocation(id: string, data: AllocationUpdateData): Promise<AxiosResponse> {
    return apiClient.put(`/allocations/${id}`, data);
  },

  // Soft-delete (archive) an allocation
  deleteAllocation(id: string): Promise<AxiosResponse> {
    return apiClient.delete(`/allocations/${id}`);
  },

  // Get allocation dashboard statistics
  getAllocationStatistics(params: Partial<AllocationListParams>): Promise<AxiosResponse<ApiEnvelope<{ statistics: AllocationStatistics }>>> {
    return apiClient.get('/allocations/statistics', { params });
  },

  // Get total budget, allocated, and remaining budget summary
  getRemainingBudget(params: Partial<AllocationListParams>): Promise<AxiosResponse<ApiEnvelope<{ budget: BudgetSummary }>>> {
    return apiClient.get('/allocations/remaining-budget', { params });
  },

  // Get approved allocation amounts grouped by department or budget category
  getAllocationBreakdown(params: {
    dimension: AllocationBreakdownDimension;
    fiscalYearId?: string;
  }): Promise<AxiosResponse<ApiEnvelope<{ breakdown: AllocationBreakdown }>>> {
    return apiClient.get('/allocations/breakdown', { params });
  },

  // Submit a Draft allocation for approval
  submitForApproval(id: string): Promise<AxiosResponse<ApiEnvelope<{ allocation: Allocation }>>> {
    return apiClient.post(`/allocations/${id}/submit`);
  },

  // Approve a PendingApproval allocation
  approveAllocation(id: string): Promise<AxiosResponse<ApiEnvelope<{ allocation: Allocation }>>> {
    return apiClient.post(`/allocations/${id}/approve`);
  },

  // Reject a PendingApproval allocation with a reason
  rejectAllocation(id: string, reason: string): Promise<AxiosResponse<ApiEnvelope<{ allocation: Allocation }>>> {
    return apiClient.post(`/allocations/${id}/reject`, { reason });
  },

  // Return an allocation to Draft for revision
  returnAllocation(id: string, comment?: string): Promise<AxiosResponse<ApiEnvelope<{ allocation: Allocation }>>> {
    return apiClient.post(`/allocations/${id}/return`, { comment });
  },

  // Get the recorded approval history for an allocation
  getApprovalHistory(id: string): Promise<AxiosResponse<ApiEnvelope<{ approvals: ApprovalRecord[] }>>> {
    return apiClient.get(`/allocations/${id}/approvals`);
  },
};
