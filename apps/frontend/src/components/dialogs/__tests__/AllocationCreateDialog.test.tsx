import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { AllocationCreateDialog } from '../AllocationCreateDialog';
import * as useAllocationsModule from '../../../hooks/useAllocations';
import * as useAllocationOptionsModule from '../../../hooks/useAllocationOptions';

const mockFiscalYears = [
  { id: 'fy-2026', code: 'FY-2026', name: 'Fiscal Year 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'Active' as const, isClosed: false },
];
const mockDepartments = [
  { id: 'dept-1', code: 'ENG', name: 'Engineering', description: 'Engineering Dept' },
];
const mockFundSources = [
  { id: 'fund-1', code: 'GEN', name: 'General Fund', description: 'General Fund' },
];
const mockCategories = [
  { id: 'cat-1', code: 'OPEX', name: 'Operating Expenses', description: 'Operating Expenses' },
];
const mockPrograms = [
  { id: 'prog-1', code: 'INFRA', name: 'Infrastructure Development', description: 'Infrastructure' },
];

function selectOption(trigger: HTMLElement, optionText: string | RegExp) {
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  const option = screen.getByRole('option', { name: optionText });
  fireEvent.click(option);
}

describe('AllocationCreateDialog component suite', () => {
  const mockCreateAllocation = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useAllocationOptionsModule, 'useAllocationOptions').mockReturnValue({
      fiscalYears: mockFiscalYears as any,
      departments: mockDepartments as any,
      fundSources: mockFundSources as any,
      categories: mockCategories as any,
      programs: mockPrograms as any,
      isLoading: false,
      isError: false,
    });

    vi.spyOn(useAllocationsModule, 'useCreateAllocation').mockReturnValue({
      mutateAsync: mockCreateAllocation,
      isPending: false,
    } as any);
  });

  it('does not render dialog content when isOpen is false', () => {
    renderWithProviders(<AllocationCreateDialog isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Create Budget Allocation')).not.toBeInTheDocument();
  });

  it('renders all form headers, fields, and action buttons when isOpen is true', () => {
    renderWithProviders(<AllocationCreateDialog isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Create Budget Allocation')).toBeInTheDocument();
    expect(
      screen.getByText(/allocate budget to a department under a fiscal year/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Fiscal Year')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Fund Source')).toBeInTheDocument();
    expect(screen.getByText('Budget Category')).toBeInTheDocument();
    expect(screen.getByText('Program / PPA')).toBeInTheDocument();
    expect(screen.getByLabelText(/allocated amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Allocation' })).toBeInTheDocument();
  });

  it('triggers validation errors when submitting an empty form', async () => {
    renderWithProviders(<AllocationCreateDialog isOpen={true} onClose={mockOnClose} />);

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Fiscal year is required')).toBeInTheDocument();
      expect(screen.getByText('Department is required')).toBeInTheDocument();
      expect(screen.getByText('Fund source is required')).toBeInTheDocument();
      expect(screen.getByText('Budget category is required')).toBeInTheDocument();
      expect(screen.getByText('Program is required')).toBeInTheDocument();
    });

    expect(mockCreateAllocation).not.toHaveBeenCalled();
  });

  it('updates currency helper preview dynamically as user types amount', () => {
    renderWithProviders(<AllocationCreateDialog isOpen={true} onClose={mockOnClose} />);

    const amountInput = screen.getByLabelText(/allocated amount/i);
    fireEvent.change(amountInput, { target: { value: '1500000' } });

    expect(screen.getByText(/equivalent to ₱1,500,000.00/i)).toBeInTheDocument();
  });

  it('submits form with valid data and calls createAllocation mutation', async () => {
    mockCreateAllocation.mockResolvedValueOnce({ id: 'alloc-new', allocationCode: 'ALC-2026-0003' });

    renderWithProviders(<AllocationCreateDialog isOpen={true} onClose={mockOnClose} />);

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(5);

    // Select options for all 5 dropdowns
    selectOption(selects[0], /FY-2026/i);
    selectOption(selects[1], /ENG/i);
    selectOption(selects[2], /GEN/i);
    selectOption(selects[3], /OPEX/i);
    selectOption(selects[4], /INFRA/i);

    // Fill in amount & description
    const amountInput = screen.getByLabelText(/allocated amount/i);
    fireEvent.change(amountInput, { target: { value: '250000' } });

    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(descInput, { target: { value: 'Annual IT upgrades' } });

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockCreateAllocation).toHaveBeenCalledWith({
        fiscalYearId: 'fy-2026',
        departmentId: 'dept-1',
        fundSourceId: 'fund-1',
        categoryId: 'cat-1',
        programId: 'prog-1',
        allocatedAmount: 250000,
        description: 'Annual IT upgrades',
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays error toast when mutation fails', async () => {
    mockCreateAllocation.mockRejectedValueOnce({
      response: { data: { message: 'Allocation with these parameters already exists' } },
    });

    renderWithProviders(<AllocationCreateDialog isOpen={true} onClose={mockOnClose} />);

    const selects = screen.getAllByRole('combobox');

    // Fill required fields
    selectOption(selects[0], /FY-2026/i);
    selectOption(selects[1], /ENG/i);
    selectOption(selects[2], /GEN/i);
    selectOption(selects[3], /OPEX/i);
    selectOption(selects[4], /INFRA/i);

    const amountInput = screen.getByLabelText(/allocated amount/i);
    fireEvent.change(amountInput, { target: { value: '50000' } });

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText('Allocation with these parameters already exists')
      ).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel button or close X is clicked', () => {
    renderWithProviders(<AllocationCreateDialog isOpen={true} onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    const closeIconButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeIconButton);
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
