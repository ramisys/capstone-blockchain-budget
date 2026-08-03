import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderWithProviders, screen, waitFor } from '../../../test/test-utils';
import { AllocationList } from '../AllocationList';
import * as useAllocationsModule from '../../../hooks/useAllocations';
import * as useAllocationOptionsModule from '../../../hooks/useAllocationOptions';
import * as useAuthModule from '../../../hooks/useAuth';
import type { Allocation } from '../../../types/allocation';

const mockAllocation: Allocation = {
  id: 'alloc-1',
  allocationCode: 'ALC-2026-0001',
  fiscalYearId: 'fy-2026',
  departmentId: 'dept-1',
  fundSourceId: 'fund-1',
  categoryId: 'cat-1',
  programId: 'prog-1',
  allocatedAmount: 500000,
  status: 'Draft',
  description: 'IT Infrastructure upgrades',
  createdBy: 'user-1',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
  fiscalYear: { id: 'fy-2026', code: 'FY-2026', name: 'Fiscal Year 2026' } as any,
  department: { id: 'dept-1', code: 'ENG', name: 'Engineering' } as any,
  fundSource: { id: 'fund-1', code: 'GEN', name: 'General Fund' } as any,
  category: { id: 'cat-1', code: 'OPEX', name: 'Operating Expenses' } as any,
  program: { id: 'prog-1', code: 'INFRA', name: 'Infrastructure Development' } as any,
  creator: { id: 'user-1', fullName: 'John Doe', email: 'john@example.com', role: 'Administrator' },
};

describe('AllocationList deep-linking and integration suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: { id: 'admin-1', role: 'Administrator', fullName: 'Admin User' } as any,
      isAuthenticated: true,
      loading: false,
      initializing: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn().mockReturnValue(true),
    });

    vi.spyOn(useAllocationOptionsModule, 'useAllocationOptions').mockReturnValue({
      fiscalYears: [{ id: 'fy-2026', code: 'FY-2026', name: 'Fiscal Year 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'Active', isClosed: false }] as any,
      departments: [{ id: 'dept-1', code: 'ENG', name: 'Engineering', description: 'Engineering Dept' }] as any,
      fundSources: [{ id: 'fund-1', code: 'GEN', name: 'General Fund', description: 'General Fund' }] as any,
      categories: [{ id: 'cat-1', code: 'OPEX', name: 'Operating Expenses', description: 'Operating Expenses' }] as any,
      programs: [{ id: 'prog-1', code: 'INFRA', name: 'Infrastructure Development', description: 'Infrastructure' }] as any,
      isLoading: false,
      isError: false,
    });

    vi.spyOn(useAllocationsModule, 'useAllocations').mockReturnValue({
      data: {
        allocations: [mockAllocation],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(useAllocationsModule, 'useAllocationById').mockImplementation((id) => {
      if (id === 'alloc-1') {
        return {
          data: mockAllocation,
          isLoading: false,
          isError: false,
        } as any;
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
      } as any;
    });

    vi.spyOn(useAllocationsModule, 'useCreateAllocation').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(useAllocationsModule, 'useUpdateAllocation').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(useAllocationsModule, 'useDeleteAllocation').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
  });

  it('renders allocation list page with header, actions, and table', () => {
    renderWithProviders(<AllocationList />, {
      routerInitialEntries: ['/budget-allocation/allocations'],
    });

    expect(screen.getByText('Budget Allocations')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new allocation/i })).toBeInTheDocument();
    expect(screen.getByText('ALC-2026-0001')).toBeInTheDocument();
  });

  it('automatically opens details dialog when navigating with ?view=<id>', async () => {
    renderWithProviders(<AllocationList />, {
      routerInitialEntries: ['/budget-allocation/allocations?view=alloc-1'],
    });

    await waitFor(() => {
      expect(screen.getByText('Allocation Details')).toBeInTheDocument();
      expect(screen.getAllByText('ALC-2026-0001').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('IT Infrastructure upgrades')).toBeInTheDocument();
    });
  });

  it('automatically opens edit dialog when navigating with ?edit=<id>', async () => {
    renderWithProviders(<AllocationList />, {
      routerInitialEntries: ['/budget-allocation/allocations?edit=alloc-1'],
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Budget Allocation')).toBeInTheDocument();
      expect(screen.getAllByText('ALC-2026-0001').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('automatically opens details dialog when passed via react-router location state', async () => {
    renderWithProviders(<AllocationList />, {
      routerInitialEntries: [
        {
          pathname: '/budget-allocation/allocations',
          state: { viewId: 'alloc-1', allocation: mockAllocation },
        } as any,
      ],
    });

    await waitFor(() => {
      expect(screen.getByText('Allocation Details')).toBeInTheDocument();
      expect(screen.getAllByText('ALC-2026-0001').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('automatically opens create dialog when navigating with ?create=true', async () => {
    renderWithProviders(<AllocationList />, {
      routerInitialEntries: ['/budget-allocation/allocations?create=true'],
    });

    await waitFor(() => {
      expect(screen.getByText('Create Budget Allocation')).toBeInTheDocument();
    });
  });
});
