import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderWithProviders, screen, fireEvent } from '../../../test/test-utils';
import { DocumentTable } from '../DocumentTable';
import { ROLES } from '../../../constants/roles';
import type { ManagedDocument, PaginationInfo } from '../../../types/document';

const mockDocument = (overrides: Partial<ManagedDocument> = {}): ManagedDocument => ({
  id: 'doc-1',
  documentCode: 'DOC-2026-0001',
  title: 'Purchase Request - Laptops',
  description: null,
  documentType: 'PurchaseRequest',
  status: 'Active',
  uploadedBy: 'user-1',
  createdAt: '2026-01-15T08:00:00.000Z',
  updatedAt: '2026-01-15T08:00:00.000Z',
  fiscalYear: { id: 'fy-2026', code: 'FY-2026' },
  department: { id: 'dept-1', code: 'ENG', name: 'Engineering' },
  allocation: { id: 'alloc-1', allocationCode: 'ALC-2026-0001', status: 'Approved' },
  uploader: { id: 'user-1', fullName: 'Admin User', email: 'admin@example.com', role: 'Administrator' },
  currentVersion: {
    id: 'ver-1',
    documentId: 'doc-1',
    versionNumber: 1,
    originalFileName: 'pr-laptops.pdf',
    storageKey: 'doc-1/1/pr-laptops.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 102400,
    fileExtension: 'pdf',
    sha256Hash: 'abc123',
    blockchainStatus: 'Confirmed',
    txHash: '0xdeadbeef',
    txExplorerUrl: null,
    blockNumber: 42,
    network: 'hardhat',
    confirmedAt: '2026-01-15T08:00:00.000Z',
    replaceReason: null,
    uploadedBy: 'user-1',
    uploadedAt: '2026-01-15T08:00:00.000Z',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  _count: { versions: 1 },
  ...overrides,
});

const mockPagination: PaginationInfo = {
  page: 1,
  limit: 10,
  total: 1,
  totalPages: 1,
};

function openRowDropdown(trigger: Element) {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.click(trigger);
}

describe('DocumentTable component suite', () => {
  const defaultProps = {
    documents: [mockDocument()],
    loading: false,
    pagination: mockPagination,
    sortBy: 'newest',
    sortOrder: 'desc' as const,
    onSort: vi.fn(),
    page: 1,
    pageSize: 10,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    role: ROLES.ADMINISTRATOR,
    currentUserId: 'user-1',
    onView: vi.fn(),
    onDownload: vi.fn(),
    onArchive: vi.fn(),
  };

  it('renders document rows with code, title, and badges', () => {
    renderWithProviders(<DocumentTable {...defaultProps} />);

    expect(screen.getByText('DOC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Purchase Request - Laptops')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('calls onView when the document code link is clicked', () => {
    const onView = vi.fn();
    renderWithProviders(<DocumentTable {...defaultProps} onView={onView} />);

    fireEvent.click(screen.getByText('DOC-2026-0001'));
    expect(onView).toHaveBeenCalledWith(defaultProps.documents[0]);
  });

  it('shows a loading skeleton when loading', () => {
    renderWithProviders(<DocumentTable {...defaultProps} loading documents={[]} />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows an empty state when no documents match', () => {
    renderWithProviders(<DocumentTable {...defaultProps} documents={[]} />);
    expect(screen.getByText('No documents found')).toBeInTheDocument();
  });

  it('opens the row dropdown and triggers download', () => {
    const onDownload = vi.fn();
    renderWithProviders(<DocumentTable {...defaultProps} onDownload={onDownload} />);

    openRowDropdown(screen.getByRole('button', { name: /Actions for DOC-2026-0001/ }));
    fireEvent.click(screen.getByText('Download'));
    expect(onDownload).toHaveBeenCalledWith(defaultProps.documents[0]);
  });

  it('renders Archive in the dropdown for the Administrator', () => {
    renderWithProviders(<DocumentTable {...defaultProps} />);

    openRowDropdown(screen.getByRole('button', { name: /Actions for DOC-2026-0001/ }));
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('hides Archive for an Auditor on someone else upload', () => {
    const otherDoc = mockDocument({ uploadedBy: 'user-999' });
    renderWithProviders(
      <DocumentTable {...defaultProps} documents={[otherDoc]} role={ROLES.AUDITOR} currentUserId="user-1" />
    );

    openRowDropdown(screen.getByRole('button', { name: /Actions for DOC-2026-0001/ }));
    expect(screen.queryByText('Archive')).not.toBeInTheDocument();
  });

  it('hides Archive for a Budget Officer on someone else upload', () => {
    const otherDoc = mockDocument({ uploadedBy: 'user-999' });
    renderWithProviders(
      <DocumentTable {...defaultProps} documents={[otherDoc]} role={ROLES.BUDGET_OFFICER} currentUserId="user-1" />
    );

    openRowDropdown(screen.getByRole('button', { name: /Actions for DOC-2026-0001/ }));
    expect(screen.queryByText('Archive')).not.toBeInTheDocument();
  });

  it('hides Archive for already archived documents', () => {
    const archivedDoc = mockDocument({ status: 'Archived' });
    renderWithProviders(<DocumentTable {...defaultProps} documents={[archivedDoc]} />);

    openRowDropdown(screen.getByRole('button', { name: /Actions for DOC-2026-0001/ }));
    expect(screen.queryByText('Archive')).not.toBeInTheDocument();
  });
});
