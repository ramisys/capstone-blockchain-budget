import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { AllocationTable } from '../AllocationTable';
import { ROLES } from '../../../constants/roles';
import type { Allocation, PaginationInfo } from '../../../types/allocation';

const mockAllocations: Allocation[] = [
  {
    id: 'alloc-1',
    allocationCode: 'ALC-2026-0001',
    fiscalYearId: 'fy-2026',
    departmentId: 'dept-1',
    fundSourceId: 'fund-1',
    categoryId: 'cat-1',
    programId: 'prog-1',
    allocatedAmount: 150000,
    description: 'Engineering Q1 Budget',
    status: 'Draft',
    createdBy: 'user-1',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
    fiscalYear: { id: 'fy-2026', code: 'FY-2026', name: 'Fiscal Year 2026' },
    department: { id: 'dept-1', code: 'ENG', name: 'Engineering' },
    fundSource: { id: 'fund-1', code: 'GEN', name: 'General Fund' },
    category: { id: 'cat-1', code: 'OPEX', name: 'Operating Expenses' },
    program: { id: 'prog-1', code: 'INFRA', name: 'Infrastructure' },
    creator: { id: 'user-1', fullName: 'Admin User', email: 'admin@example.com', role: 'Administrator' },
  },
  {
    id: 'alloc-2',
    allocationCode: 'ALC-2026-0002',
    fiscalYearId: 'fy-2026',
    departmentId: 'dept-2',
    fundSourceId: 'fund-2',
    categoryId: 'cat-2',
    programId: 'prog-2',
    allocatedAmount: 300000,
    description: 'Marketing Q1 Campaign',
    status: 'Approved',
    createdBy: 'user-2',
    createdAt: '2026-01-16T09:00:00.000Z',
    updatedAt: '2026-01-16T09:00:00.000Z',
    fiscalYear: { id: 'fy-2026', code: 'FY-2026', name: 'Fiscal Year 2026' },
    department: { id: 'dept-2', code: 'MKT', name: 'Marketing' },
    fundSource: { id: 'fund-2', code: 'SPEC', name: 'Special Fund' },
    category: { id: 'cat-2', code: 'CAPEX', name: 'Capital Outlay' },
    program: { id: 'prog-2', code: 'PROMO', name: 'Promotion' },
    creator: { id: 'user-2', fullName: 'Budget User', email: 'budget@example.com', role: 'BudgetOfficer' },
  },
];

const mockPagination: PaginationInfo = {
  page: 1,
  limit: 10,
  total: 2,
  totalPages: 1,
};

function openRowDropdown(trigger: Element) {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.click(trigger);
}

describe('AllocationTable component suite', () => {
  const defaultProps = {
    allocations: mockAllocations,
    loading: false,
    pagination: mockPagination,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    onSort: vi.fn(),
    page: 1,
    pageSize: 10,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    role: ROLES.ADMINISTRATOR,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders table headers and column labels accurately', () => {
    renderWithProviders(<AllocationTable {...defaultProps} />);

    expect(screen.getByText('Allocation Code')).toBeInTheDocument();
    expect(screen.getByText('Fiscal Year')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Fund Source')).toBeInTheDocument();
    expect(screen.getByText('Budget Category')).toBeInTheDocument();
    expect(screen.getByText('Program')).toBeInTheDocument();
    expect(screen.getByText('Allocated Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created Date')).toBeInTheDocument();
  });

  it('renders allocation rows and data values correctly', () => {
    renderWithProviders(<AllocationTable {...defaultProps} />);

    expect(screen.getByText('ALC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('ALC-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders empty state when no allocations are present', () => {
    renderWithProviders(
      <AllocationTable
        {...defaultProps}
        allocations={[]}
        pagination={{ page: 1, limit: 10, total: 0, totalPages: 0 }}
      />
    );

    expect(screen.getByText(/no allocations found/i)).toBeInTheDocument();
  });

  it('renders skeleton placeholders when loading is true', () => {
    const { container } = renderWithProviders(
      <AllocationTable {...defaultProps} loading={true} />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('calls onSort when a sortable column header is clicked', () => {
    const onSortMock = vi.fn();
    renderWithProviders(<AllocationTable {...defaultProps} onSort={onSortMock} />);

    const codeHeader = screen.getByText('Allocation Code');
    fireEvent.click(codeHeader);

    expect(onSortMock).toHaveBeenCalledWith('allocationCode');
  });

  it('calls onView when View Details menu item is clicked', async () => {
    const onViewMock = vi.fn();
    renderWithProviders(<AllocationTable {...defaultProps} onView={onViewMock} />);

    const trigger = screen.getByRole('button', { name: 'Actions for ALC-2026-0001' });
    openRowDropdown(trigger);

    const viewItem = await screen.findByText('View Details');
    fireEvent.click(viewItem);

    expect(onViewMock).toHaveBeenCalledWith(mockAllocations[0]);
  });

  it('allows Administrator to edit Draft allocation and archive non-archived allocation', async () => {
    const onEditMock = vi.fn();
    const onDeleteMock = vi.fn();

    renderWithProviders(
      <AllocationTable
        {...defaultProps}
        role={ROLES.ADMINISTRATOR}
        onEdit={onEditMock}
        onDelete={onDeleteMock}
      />
    );

    const trigger1 = screen.getByRole('button', { name: 'Actions for ALC-2026-0001' });

    // Open dropdown for row 0 (Draft)
    openRowDropdown(trigger1);

    const editItem = await screen.findByText('Edit Allocation');
    fireEvent.click(editItem);
    expect(onEditMock).toHaveBeenCalledWith(mockAllocations[0]);

    // Open dropdown for row 0 again and click Archive
    openRowDropdown(trigger1);
    const archiveItem = await screen.findByText('Archive');
    fireEvent.click(archiveItem);
    expect(onDeleteMock).toHaveBeenCalledWith(mockAllocations[0]);
  });

  it('allows Budget Officer to edit and delete only Draft allocations', async () => {
    const onEditMock = vi.fn();
    const onDeleteMock = vi.fn();

    renderWithProviders(
      <AllocationTable
        {...defaultProps}
        role={ROLES.BUDGET_OFFICER}
        onEdit={onEditMock}
        onDelete={onDeleteMock}
      />
    );

    const trigger2 = screen.getByRole('button', { name: 'Actions for ALC-2026-0002' });

    // For row 1 (Approved), Budget Officer should only see View Details, not Edit or Delete
    openRowDropdown(trigger2);

    expect(await screen.findByText('View Details')).toBeInTheDocument();
    expect(screen.queryByText('Edit Allocation')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('prevents non-privileged viewer from seeing Edit or Archive action items', async () => {
    renderWithProviders(
      <AllocationTable
        {...defaultProps}
        role={ROLES.AUDITOR}
      />
    );

    const trigger1 = screen.getByRole('button', { name: 'Actions for ALC-2026-0001' });

    // Open dropdown for row 0
    openRowDropdown(trigger1);

    expect(await screen.findByText('View Details')).toBeInTheDocument();
    expect(screen.queryByText('Edit Allocation')).not.toBeInTheDocument();
    expect(screen.queryByText('Archive')).not.toBeInTheDocument();
  });

  it('handles pagination controls and page change callbacks', () => {
    const onPageChangeMock = vi.fn();
    const multiPagePagination: PaginationInfo = {
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    };

    renderWithProviders(
      <AllocationTable
        {...defaultProps}
        pagination={multiPagePagination}
        onPageChange={onPageChangeMock}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextButton);

    expect(onPageChangeMock).toHaveBeenCalledWith(2);
  });
});
