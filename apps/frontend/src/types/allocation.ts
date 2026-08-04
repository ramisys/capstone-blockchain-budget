/**
 * Type definitions for the Budget Allocation module.
 *
 * Shapes mirror the backend `BudgetAllocation` model and the serialized API
 * responses returned by the allocation controllers.
 */

export type AllocationStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'Archived';

export interface AllocationReference {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status?: string;
  startDate?: string;
  endDate?: string;
  budgetAmount?: number;
  isActive?: boolean;
}

export interface AllocationCreator {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export type AllocationApprovalAction = 'Submitted' | 'Approved' | 'Rejected' | 'Returned';

export interface ApprovalActor {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface ApprovalRecord {
  id: string;
  allocationId: string;
  action: AllocationApprovalAction;
  comment: string | null;
  actorId: string;
  createdAt: string;
  actor: ApprovalActor;
}

export interface Allocation {
  id: string;
  allocationCode: string;
  fiscalYearId: string;
  departmentId: string;
  fundSourceId: string;
  categoryId: string;
  programId: string;
  allocatedAmount: number;
  description?: string | null;
  status: AllocationStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  fiscalYear: AllocationReference;
  department: AllocationReference;
  fundSource: AllocationReference;
  category: AllocationReference;
  program: AllocationReference;
  creator: AllocationCreator;
}

export interface AllocationFormData {
  fiscalYearId: string;
  departmentId: string;
  fundSourceId: string;
  categoryId: string;
  programId: string;
  allocatedAmount: number;
  description?: string;
}

export interface AllocationUpdateData {
  departmentId?: string;
  fundSourceId?: string;
  categoryId?: string;
  programId?: string;
  allocatedAmount?: number;
  description?: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Minimal option shape consumed by selects. Maps from the backend master-data
 * records (fiscal years, departments, fund sources, categories, programs).
 * Fiscal years only expose `code`, so `name` is optional.
 */
export interface MasterDataOption {
  id: string;
  code: string;
  name?: string;
}

export interface AllocationsResponse {
  allocations: Allocation[];
  pagination: PaginationInfo;
}

export interface AllocationStatistics {
  totalAllocations: number;
  totalAllocatedAmount: number;
  remainingBudget: number;
  draftCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalAllocated: number;
  remainingBudget: number;
}

export interface AllocationListParams {
  page?: number;
  limit?: number;
  search?: string;
  fiscalYearId?: string;
  departmentId?: string;
  fundSourceId?: string;
  categoryId?: string;
  programId?: string;
  status?: AllocationStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
