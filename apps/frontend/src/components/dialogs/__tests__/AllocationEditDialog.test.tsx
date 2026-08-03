import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { AllocationEditDialog } from '../AllocationEditDialog';
import * as useAllocationsModule from '../../../hooks/useAllocations';
import * as useAllocationOptionsModule from '../../../hooks/useAllocationOptions';
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
  description: 'Initial budget description',
  createdBy: 'user-1',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
  fiscalYear: { id: 'fy-2026', code: 'FY-2026', name: 'Fiscal Year 2026' } as any,
  department: { id: 'dept-1', code: 'ENG', name: 'Engineering' } as any,
  fundSource: { id: 'fund-1', code: 'GEN', name: 'General Fund' } as any,
  category: { id: 'cat-1', code: 'OPEX', name: 'Operating Expenses' } as any,
  program: { id: 'prog-1', code: 'INFRA', name: 'Infrastructure Development' } as any,
  creator: { id: 'user-1', fullName: 'Admin User', email: 'admin@example.com', role: 'Administrator' },
};

describe('AllocationEditDialog', () => {
  const mockUpdate = vi.fn().mockResolvedValue({ id: 'alloc-1' });
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useAllocationOptionsModule, 'useAllocationOptions').mockReturnValue({
      fiscalYears: [{ id: 'fy-2026', code: 'FY-2026', name: 'Fiscal Year 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'Active', isClosed: false }] as any,
      departments: [{ id: 'dept-1', code: 'ENG', name: 'Engineering', description: 'Engineering Dept' }] as any,
      fundSources: [{ id: 'fund-1', code: 'GEN', name: 'General Fund', description: 'General Fund' }] as any,
      categories: [{ id: 'cat-1', code: 'OPEX', name: 'Operating Expenses', description: 'Operating Expenses' }] as any,
      programs: [{ id: 'prog-1', code: 'INFRA', name: 'Infrastructure Development', description: 'Infrastructure' }] as any,
      isLoading: false,
      isError: false,
    });

    vi.spyOn(useAllocationsModule, 'useUpdateAllocation').mockReturnValue({
      mutateAsync: mockUpdate,
      isPending: false,
    } as any);
  });

  it('renders correctly when open with populated allocation data', () => {
    renderWithProviders(
      <AllocationEditDialog
        isOpen={true}
        onClose={mockOnClose}
        allocation={mockAllocation}
      />
    );

    expect(screen.getByText('Edit Budget Allocation')).toBeInTheDocument();
    expect(screen.getByText('ALC-2026-0001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Initial budget description')).toBeInTheDocument();
  });

  it('submits updated values successfully', async () => {
    renderWithProviders(
      <AllocationEditDialog
        isOpen={true}
        onClose={mockOnClose}
        allocation={mockAllocation}
      />
    );

    const amountInput = screen.getByLabelText(/allocated amount/i);
    fireEvent.change(amountInput, { target: { value: '750000' } });

    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        id: 'alloc-1',
        data: expect.objectContaining({
          departmentId: 'dept-1',
          fundSourceId: 'fund-1',
          categoryId: 'cat-1',
          programId: 'prog-1',
          allocatedAmount: 750000,
        }),
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
