import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { AllocationDetailsDialog } from '../AllocationDetailsDialog';
import * as useAllocationsModule from '../../../hooks/useAllocations';
import { ROLES } from '../../../constants/roles';
import type { Allocation, ApprovalRecord } from '../../../types/allocation';

const makeAllocation = (overrides: Partial<Allocation> = {}): Allocation => ({
  id: 'alloc-1',
  allocationCode: 'ALC-2026-0001',
  fiscalYearId: 'fy-2026',
  departmentId: 'dept-1',
  fundSourceId: 'fund-1',
  categoryId: 'cat-1',
  programId: 'prog-1',
  allocatedAmount: 250000,
  description: 'Test allocation',
  status: 'Draft',
  createdBy: 'user-1',
  createdAt: '2026-01-15T08:00:00.000Z',
  updatedAt: '2026-01-15T08:00:00.000Z',
  deletedAt: null,
  submittedAt: null,
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: null,
  fiscalYear: { id: 'fy-2026', code: 'FY-2026', name: 'Fiscal Year 2026' },
  department: { id: 'dept-1', code: 'ENG', name: 'Engineering' },
  fundSource: { id: 'fund-1', code: 'GEN', name: 'General Fund' },
  category: { id: 'cat-1', code: 'OPEX', name: 'Operating Expenses' },
  program: { id: 'prog-1', code: 'INFRA', name: 'Infrastructure' },
  creator: { id: 'user-1', fullName: 'Jose Rizal', email: 'jose@university.edu', role: 'BudgetOfficer' },
  ...overrides,
});

const mockHistory: ApprovalRecord[] = [
  {
    id: 'apr-2',
    allocationId: 'alloc-1',
    action: 'Rejected',
    comment: 'Amount exceeds the departmental ceiling.',
    actorId: 'user-2',
    createdAt: '2026-01-20T10:30:00.000Z',
    actor: { id: 'user-2', fullName: 'Treasurer One', email: 'treasurer@university.edu', role: ROLES.TREASURER },
  },
  {
    id: 'apr-1',
    allocationId: 'alloc-1',
    action: 'Submitted',
    comment: null,
    actorId: 'user-1',
    createdAt: '2026-01-18T09:00:00.000Z',
    actor: { id: 'user-1', fullName: 'Jose Rizal', email: 'jose@university.edu', role: ROLES.BUDGET_OFFICER },
  },
];

function mockMutationHook(name: string, fn: (id: string) => Promise<unknown>) {
  vi.spyOn(useAllocationsModule, name as any).mockReturnValue({
    mutateAsync: fn,
    isPending: false,
  } as any);
}

function mockHistoryQuery(records: ApprovalRecord[] | null = mockHistory) {
  vi.spyOn(useAllocationsModule, 'useAllocationApprovalHistory').mockReturnValue({
    data: records,
    isLoading: false,
    isError: false,
  } as any);
}

function setup({
  allocation = makeAllocation(),
  role = '',
  currentUserId = 'user-9',
  onClose = vi.fn(),
} = {}) {
  return renderWithProviders(
    <AllocationDetailsDialog
      isOpen={true}
      onClose={onClose}
      allocation={allocation}
      role={role}
      currentUserId={currentUserId}
    />
  );
}

describe('AllocationDetailsDialog approval workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistoryQuery(null);
    mockMutationHook('useSubmitAllocation', vi.fn().mockResolvedValue({}));
    mockMutationHook('useApproveAllocation', vi.fn().mockResolvedValue({}));
    mockMutationHook('useReturnAllocation', vi.fn().mockResolvedValue({}));
    vi.spyOn(useAllocationsModule, 'useRejectAllocation').mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);
  });

  it('shows Submit for Approval for a Draft allocation to a Budget Officer', () => {
    setup({ allocation: makeAllocation({ status: 'Draft' }), role: ROLES.BUDGET_OFFICER });

    expect(screen.getByRole('button', { name: /Submit for Approval/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reject/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Return to Draft/ })).not.toBeInTheDocument();
  });

  it('shows no workflow actions for an Auditor viewing a Draft', () => {
    setup({ allocation: makeAllocation({ status: 'Draft' }), role: ROLES.AUDITOR });

    expect(screen.queryByRole('button', { name: /Submit for Approval/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve/ })).not.toBeInTheDocument();
  });

  it('shows Approve/Reject/Return for a Treasurer reviewing someone else’s PendingApproval', () => {
    setup({
      allocation: makeAllocation({ status: 'PendingApproval', createdBy: 'user-1' }),
      role: ROLES.TREASURER,
      currentUserId: 'user-2',
    });

    expect(screen.getByRole('button', { name: /Approve/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Draft/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submit for Approval/ })).not.toBeInTheDocument();
  });

  it('hides review actions when the approver is also the creator (self-review blocked)', () => {
    setup({
      allocation: makeAllocation({ status: 'PendingApproval', createdBy: 'user-1' }),
      role: ROLES.TREASURER,
      currentUserId: 'user-1',
    });

    expect(screen.queryByRole('button', { name: /Approve/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reject/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Return to Draft/ })).not.toBeInTheDocument();
  });

  it('shows Return to Draft for the creator of a Rejected allocation', () => {
    setup({
      allocation: makeAllocation({ status: 'Rejected', createdBy: 'user-1' }),
      role: ROLES.BUDGET_OFFICER,
      currentUserId: 'user-1',
    });

    expect(screen.getByRole('button', { name: /Return to Draft/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submit for Approval/ })).not.toBeInTheDocument();
  });

  it('shows no workflow actions for a non-creator Auditor on a Rejected allocation', () => {
    setup({
      allocation: makeAllocation({ status: 'Rejected', createdBy: 'user-1' }),
      role: ROLES.AUDITOR,
      currentUserId: 'user-2',
    });

    expect(screen.queryByRole('button', { name: /Return to Draft/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve/ })).not.toBeInTheDocument();
  });

  it('submits the allocation and closes the dialog', async () => {
    const submit = vi.fn().mockResolvedValue({});
    mockMutationHook('useSubmitAllocation', submit);
    const onClose = vi.fn();

    setup({
      allocation: makeAllocation({ status: 'Draft' }),
      role: ROLES.BUDGET_OFFICER,
      currentUserId: 'user-1',
      onClose,
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit for Approval/ }));

    await waitFor(() => {
      expect(submit).toHaveBeenCalledWith('alloc-1');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('rejects an allocation with a reason through the reject dialog', async () => {
    const reject = vi.fn().mockResolvedValue({});
    vi.spyOn(useAllocationsModule, 'useRejectAllocation').mockReturnValue({
      mutateAsync: reject,
      isPending: false,
    } as any);
    const onClose = vi.fn();

    setup({
      allocation: makeAllocation({ status: 'PendingApproval', createdBy: 'user-1' }),
      role: ROLES.ADMINISTRATOR,
      currentUserId: 'user-2',
      onClose,
    });

    fireEvent.click(screen.getByRole('button', { name: /Reject/ }));

    const reasonInput = await screen.findByLabelText(/rejection reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Amount exceeds ceiling' } });

    fireEvent.click(screen.getByRole('button', { name: /Reject Allocation/ }));

    await waitFor(() => {
      expect(reject).toHaveBeenCalledWith({ id: 'alloc-1', reason: 'Amount exceeds ceiling' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('requires a rejection reason before rejecting', async () => {
    const reject = vi.fn();
    vi.spyOn(useAllocationsModule, 'useRejectAllocation').mockReturnValue({
      mutateAsync: reject,
      isPending: false,
    } as any);

    setup({
      allocation: makeAllocation({ status: 'PendingApproval', createdBy: 'user-1' }),
      role: ROLES.ADMINISTRATOR,
      currentUserId: 'user-2',
    });

    fireEvent.click(screen.getByRole('button', { name: /Reject/ }));

    fireEvent.click(await screen.findByRole('button', { name: /Reject Allocation/ }));

    await waitFor(() => {
      expect(screen.getByText('A rejection reason is required')).toBeInTheDocument();
      expect(reject).not.toHaveBeenCalled();
    });
  });

  it('renders the approval history timeline for a non-Draft allocation', () => {
    mockHistoryQuery(mockHistory);

    setup({
      allocation: makeAllocation({ status: 'PendingApproval', createdBy: 'user-1' }),
      role: ROLES.TREASURER,
      currentUserId: 'user-2',
    });

    expect(screen.getByText('Approval History')).toBeInTheDocument();
    expect(screen.getByText('Treasurer One')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Amount exceeds the departmental ceiling.')).toBeInTheDocument();
    expect(screen.getAllByText('Jose Rizal').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('shows an empty approval history state for a Draft allocation', () => {
    mockHistoryQuery(null);

    setup({ allocation: makeAllocation({ status: 'Draft' }), role: ROLES.BUDGET_OFFICER });

    expect(
      screen.getByText('No approval activity recorded for this allocation yet.')
    ).toBeInTheDocument();
  });
});
