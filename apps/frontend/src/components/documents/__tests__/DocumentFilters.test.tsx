import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderWithProviders, screen, fireEvent } from '../../../test/test-utils';
import { DocumentFilters } from '../DocumentFilters';
import { DOCUMENT_TYPE, DOCUMENT_TYPE_LABELS } from '../../../constants/documentType';
import { DOCUMENT_STATUS } from '../../../constants/documentStatus';
import { BLOCKCHAIN_RECORD_STATUS } from '../../../constants/blockchainStatus';

const mockFiscalYears = [
  { id: 'fy-2026', code: 'FY-2026' },
  { id: 'fy-2025', code: 'FY-2025' },
];

const mockDepartments = [
  { id: 'dept-1', code: 'ENG', name: 'Engineering' },
  { id: 'dept-2', code: 'MKT', name: 'Marketing' },
];

const mockAllocations = [
  { id: 'alloc-1', allocationCode: 'ALC-2026-0001' },
  { id: 'alloc-2', allocationCode: 'ALC-2026-0002' },
];

const mockUploaders = [
  { id: 'user-1', fullName: 'Admin User' },
  { id: 'user-2', fullName: 'Budget Officer' },
];

function selectOption(trigger: HTMLElement, optionText: string | RegExp) {
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  const option = screen.getByRole('option', { name: optionText });
  fireEvent.click(option);
}

describe('DocumentFilters component suite', () => {
  const defaultProps = {
    filters: {},
    onChange: vi.fn(),
    onReset: vi.fn(),
    hasActiveFilters: false,
    fiscalYears: mockFiscalYears,
    departments: mockDepartments,
    allocations: mockAllocations,
    uploaders: mockUploaders,
    loading: false,
  };

  it('renders all filter selects and a reset button', () => {
    renderWithProviders(<DocumentFilters {...defaultProps} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Document Type')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Blockchain Status')).toBeInTheDocument();
    expect(screen.getByText('Fiscal Year')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Allocation')).toBeInTheDocument();
    expect(screen.getByText('Uploader')).toBeInTheDocument();
    expect(screen.getByLabelText('From Date')).toBeInTheDocument();
    expect(screen.getByLabelText('To Date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Filters/ })).toBeInTheDocument();
  });

  it('shows the Active badge when filters are applied', () => {
    renderWithProviders(
      <DocumentFilters {...defaultProps} filters={{ status: DOCUMENT_STATUS.ACTIVE }} hasActiveFilters />
    );
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('calls onReset when the reset button is clicked', () => {
    const onReset = vi.fn();
    renderWithProviders(
      <DocumentFilters {...defaultProps} hasActiveFilters onReset={onReset} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Reset Filters/ }));
    expect(onReset).toHaveBeenCalled();
  });

  it('selects a document type filter', () => {
    const onChange = vi.fn();
    renderWithProviders(<DocumentFilters {...defaultProps} onChange={onChange} />);

    selectOption(screen.getAllByRole('combobox')[0], DOCUMENT_TYPE_LABELS[DOCUMENT_TYPE.PURCHASE_REQUEST]);

    expect(onChange).toHaveBeenCalledWith('documentType', DOCUMENT_TYPE.PURCHASE_REQUEST);
  });

  it('selects a status filter', () => {
    const onChange = vi.fn();
    renderWithProviders(<DocumentFilters {...defaultProps} onChange={onChange} />);

    selectOption(screen.getAllByRole('combobox')[1], DOCUMENT_STATUS.ACTIVE);

    expect(onChange).toHaveBeenCalledWith('status', DOCUMENT_STATUS.ACTIVE);
  });

  it('selects a blockchain status filter', () => {
    const onChange = vi.fn();
    renderWithProviders(<DocumentFilters {...defaultProps} onChange={onChange} />);

    selectOption(screen.getAllByRole('combobox')[2], BLOCKCHAIN_RECORD_STATUS.CONFIRMED);

    expect(onChange).toHaveBeenCalledWith('blockchainStatus', BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
  });

  it('selects a fiscal year filter from the provided options', () => {
    const onChange = vi.fn();
    renderWithProviders(<DocumentFilters {...defaultProps} onChange={onChange} />);

    selectOption(screen.getAllByRole('combobox')[3], /FY-2026/);

    expect(onChange).toHaveBeenCalledWith('fiscalYearId', 'fy-2026');
  });

  it('selects a department filter', () => {
    const onChange = vi.fn();
    renderWithProviders(<DocumentFilters {...defaultProps} onChange={onChange} />);

    selectOption(screen.getAllByRole('combobox')[4], /ENG — Engineering/);

    expect(onChange).toHaveBeenCalledWith('departmentId', 'dept-1');
  });

  it('selects an allocation filter', () => {
    const onChange = vi.fn();
    renderWithProviders(<DocumentFilters {...defaultProps} onChange={onChange} />);

    selectOption(screen.getAllByRole('combobox')[5], /ALC-2026-0002/);

    expect(onChange).toHaveBeenCalledWith('allocationId', 'alloc-2');
  });

  it('selects an uploader filter', () => {
    const onChange = vi.fn();
    renderWithProviders(<DocumentFilters {...defaultProps} onChange={onChange} />);

    selectOption(screen.getAllByRole('combobox')[6], 'Budget Officer');

    expect(onChange).toHaveBeenCalledWith('uploadedBy', 'user-2');
  });

  it('hides the uploader filter when no uploader options are available', () => {
    renderWithProviders(<DocumentFilters {...defaultProps} uploaders={[]} />);

    expect(screen.queryByText('Uploader')).not.toBeInTheDocument();
  });

  it('sets the from-date filter', () => {
    const onChange = vi.fn();
    renderWithProviders(<DocumentFilters {...defaultProps} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-01-01' } });

    expect(onChange).toHaveBeenCalledWith('dateFrom', '2026-01-01');
  });

  it('clears the to-date filter when emptied', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <DocumentFilters {...defaultProps} filters={{ dateTo: '2026-12-31' }} onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith('dateTo', undefined);
  });
});
