import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor, fireEvent } from '../../../test/test-utils';
import { BlockchainLedger } from '../BlockchainLedger';
import type { BlockchainStatus, LedgerHistoryEntry } from '../../../types/blockchain';

const {
  statusHook,
  historyHook,
  transactionDetailHook,
  verificationHook,
  verifyMutationHook,
  retryHook,
  retryMutateAsync,
  verifyMutateAsync,
  authHook,
} = vi.hoisted(() => ({
  statusHook: vi.fn(),
  historyHook: vi.fn(),
  transactionDetailHook: vi.fn(),
  verificationHook: vi.fn(),
  verifyMutationHook: vi.fn(),
  retryHook: vi.fn(),
  retryMutateAsync: vi.fn(),
  verifyMutateAsync: vi.fn(),
  authHook: vi.fn(),
}));

vi.mock('../../../hooks/useBlockchain', () => ({
  useBlockchainStatus: statusHook,
  useBlockchainHistory: historyHook,
  useBlockchainTransactionDetail: transactionDetailHook,
  useAllocationBlockchainVerification: verificationHook,
  useVerifyAllocation: verifyMutationHook,
  useRetryBlockchainRecord: retryHook,
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: authHook,
}));

const mockStatus: BlockchainStatus = {
  connected: true,
  network: 'hardhat',
  chainId: 31337,
  latestBlock: 42,
  lastSync: '2026-08-04T08:00:00.000Z',
  contractAddress: '0x1234567890abcdef',
  onChainCount: 3,
  message: 'Blockchain ledger is connected.',
  recordCount: 3,
  confirmedCount: 2,
  pendingCount: 1,
  failedCount: 0,
};

const mockHistory: LedgerHistoryEntry[] = [
  {
    id: 'rec-1',
    recordType: 'Allocation',
    code: 'ALC-2026-0001',
    hash: '0xabc',
    txHash: '0xdeadbeef1234567890',
    blockNumber: 42,
    network: 'hardhat',
    status: 'Confirmed',
    confirmedAt: '2026-08-04T08:00:00.000Z',
    createdAt: '2026-08-04T08:00:00.000Z',
    updatedAt: '2026-08-04T08:00:00.000Z',
    allocationId: 'alloc-1',
    ref: {
      id: 'alloc-1',
      allocationCode: 'ALC-2026-0001',
      allocatedAmount: 50000,
      status: 'Approved',
    },
  },
  {
    id: 'rec-2',
    recordType: 'Allocation',
    code: 'ALC-2026-0002',
    hash: '0xdef',
    txHash: null,
    blockNumber: null,
    network: 'hardhat',
    status: 'Pending',
    confirmedAt: null,
    createdAt: '2026-08-04T09:00:00.000Z',
    updatedAt: '2026-08-04T09:00:00.000Z',
    allocationId: 'alloc-2',
    ref: {
      id: 'alloc-2',
      allocationCode: 'ALC-2026-0002',
      status: 'Pending',
    },
  },
  {
    id: 'audit-1',
    recordType: 'Audit',
    code: 'AUD-2026-0042',
    hash: '0xabc123',
    txHash: '0xfeedbeef1234567890',
    blockNumber: 43,
    network: 'hardhat',
    status: 'Confirmed',
    confirmedAt: '2026-08-04T10:00:00.000Z',
    createdAt: '2026-08-04T10:00:00.000Z',
    updatedAt: '2026-08-04T10:00:00.000Z',
    ref: {
      id: 'audit-1',
      action: 'ALLOCATION_APPROVED',
      result: 'Success',
      actorEmail: 'admin@university.edu',
      actorRole: 'Administrator',
      resourceType: 'BudgetAllocation',
      resourceCode: 'ALC-2026-0001',
    },
  },
];

const mockPagination = { page: 1, limit: 10, total: 3, totalPages: 1 };

const mockVerification = {
  verified: true,
  integrityOk: true,
  onChain: { exists: true, anchoredBy: '0xowner', anchoredAt: 1700000000, blockNumber: 42 },
  record: mockHistory[0],
  message: 'Allocation verified on the blockchain ledger.',
};

function defaultMocks() {
  statusHook.mockReturnValue({ data: mockStatus, isLoading: false, error: null });
  historyHook.mockReturnValue({
    data: { transactions: mockHistory, pagination: mockPagination },
    isLoading: false,
    isError: false,
    error: null,
  });
  transactionDetailHook.mockImplementation((id: string | undefined) => {
    const entry = mockHistory.find((item) => item.id === id) ?? mockHistory[0];
    return { data: entry, isLoading: false, isError: false, error: null };
  });
  verificationHook.mockReturnValue({
    data: mockVerification,
    isLoading: false,
    isError: false,
    error: null,
  });
  verifyMutationHook.mockReturnValue({ mutateAsync: verifyMutateAsync, isPending: false });
  retryHook.mockReturnValue({ mutateAsync: retryMutateAsync, isPending: false });
  authHook.mockReturnValue({
    user: { id: 'admin-1', role: 'Administrator', fullName: 'Admin User' },
    isAuthenticated: true,
    loading: false,
    initializing: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: () => true,
  });
}

describe('BlockchainLedger page integration suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
  });

  it('renders the ledger header, status cards, connection badge, and unified history rows', () => {
    renderWithProviders(<BlockchainLedger />);

    expect(screen.getByRole('heading', { name: 'Blockchain Ledger' })).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();

    expect(screen.getByText('Confirmed Records')).toBeInTheDocument();
    expect(screen.getByText('Pending Anchors')).toBeInTheDocument();
    expect(screen.getByText('Failed Anchors')).toBeInTheDocument();
    expect(screen.getByText('Latest Block')).toBeInTheDocument();

    expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument();
    expect(screen.getByText('ALC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('ALC-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('AUD-2026-0042')).toBeInTheDocument();
    expect(screen.getAllByText('Allocation').length).toBeGreaterThan(0);
    expect(screen.getByText('Audit Event')).toBeInTheDocument();
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
  });

  it('shows the disconnected badge when the ledger is unreachable', () => {
    statusHook.mockReturnValue({
      data: { ...mockStatus, connected: false },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<BlockchainLedger />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('reports a history load error instead of the table', () => {
    historyHook.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load blockchain ledger history'),
    });

    renderWithProviders(<BlockchainLedger />);

    expect(screen.getByText('Failed to load blockchain ledger history')).toBeInTheDocument();
    expect(screen.queryByText('ALC-2026-0001')).not.toBeInTheDocument();
  });

  it('re-anchors a Pending allocation through the row menu and mutation hook', async () => {
    retryMutateAsync.mockResolvedValue({});

    renderWithProviders(<BlockchainLedger />);

    fireEvent.pointerDown(screen.getAllByLabelText('More actions')[0]);
    const retryItem = await screen.findByText('Retry Anchor');
    fireEvent.click(retryItem);

    await waitFor(() => expect(retryMutateAsync).toHaveBeenCalledWith('alloc-2'));
  });

  it('opens the verification dialog with allocation details when Verify is clicked', async () => {
    renderWithProviders(<BlockchainLedger />);

    fireEvent.click(screen.getAllByRole('button', { name: /Verify/ })[0]);

    expect((await screen.findAllByText('Blockchain Verification')).length).toBeGreaterThan(0);
    expect(screen.getByText('Integrity check for allocation ALC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Verified on the ledger')).toBeInTheDocument();
  });

  it('opens the transaction detail drawer for a non-allocation entry', async () => {
    renderWithProviders(<BlockchainLedger />);

    const detailsButtons = screen.getAllByRole('button', { name: /Details/ });
    fireEvent.click(detailsButtons[2]);

    expect(await screen.findByText('Transaction Details')).toBeInTheDocument();
    expect(transactionDetailHook).toHaveBeenCalledWith('audit-1', 'Audit');
    expect(screen.getByText('Audit Event · AUD-2026-0042')).toBeInTheDocument();
    expect(screen.getByText('ALLOCATION_APPROVED')).toBeInTheDocument();
  });

  it('wires the status filter into the history query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BlockchainLedger />);

    const selects = screen.getAllByRole('combobox');
    await user.click(selects[1]);
    const pendingOption = await screen.findByRole('option', { name: 'Pending' });
    await user.click(pendingOption);

    await waitFor(() => {
      expect(historyHook).toHaveBeenCalledWith({
        search: undefined,
        status: 'Pending',
        recordType: undefined,
        page: 1,
        limit: 10,
        sortBy: 'newest',
        sortOrder: 'desc',
      });
    });
  });

  it('wires the record type filter into the history query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BlockchainLedger />);

    const selects = screen.getAllByRole('combobox');
    await user.click(selects[0]);
    const auditOption = await screen.findByRole('option', { name: 'Audit Event' });
    await user.click(auditOption);

    await waitFor(() => {
      expect(historyHook).toHaveBeenCalledWith({
        search: undefined,
        status: undefined,
        recordType: 'Audit',
        page: 1,
        limit: 10,
        sortBy: 'newest',
        sortOrder: 'desc',
      });
    });
  });

  it('wires the debounced search box into the history query', async () => {
    renderWithProviders(<BlockchainLedger />);

    fireEvent.change(screen.getByPlaceholderText('Search by code, title, or resource...'), {
      target: { value: 'ALC-2026' },
    });

    await waitFor(() => {
      expect(historyHook).toHaveBeenCalledWith({
        search: 'ALC-2026',
        status: undefined,
        recordType: undefined,
        page: 1,
        limit: 10,
        sortBy: 'newest',
        sortOrder: 'desc',
      });
    });
  });
});
