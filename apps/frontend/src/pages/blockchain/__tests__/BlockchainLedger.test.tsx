import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor, fireEvent } from '../../../test/test-utils';
import { BlockchainLedger } from '../BlockchainLedger';
import type { BlockchainStatus, BlockchainRecord } from '../../../types/blockchain';

const {
  statusHook,
  transactionsHook,
  verificationHook,
  verifyMutationHook,
  retryHook,
  retryMutateAsync,
  verifyMutateAsync,
  authHook,
} = vi.hoisted(() => ({
  statusHook: vi.fn(),
  transactionsHook: vi.fn(),
  verificationHook: vi.fn(),
  verifyMutationHook: vi.fn(),
  retryHook: vi.fn(),
  retryMutateAsync: vi.fn(),
  verifyMutateAsync: vi.fn(),
  authHook: vi.fn(),
}));

vi.mock('../../../hooks/useBlockchain', () => ({
  useBlockchainStatus: statusHook,
  useBlockchainTransactions: transactionsHook,
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

const mockTransactions: BlockchainRecord[] = [
  {
    id: 'rec-1',
    allocationId: 'alloc-1',
    allocationCode: 'ALC-2026-0001',
    contentHash: '0xabc',
    txHash: '0xdeadbeef1234567890',
    blockNumber: 42,
    network: 'hardhat',
    status: 'Confirmed',
    confirmedAt: '2026-08-04T08:00:00.000Z',
    createdBy: 'user-1',
    createdAt: '2026-08-04T08:00:00.000Z',
    updatedAt: '2026-08-04T08:00:00.000Z',
  },
  {
    id: 'rec-2',
    allocationId: 'alloc-2',
    allocationCode: 'ALC-2026-0002',
    contentHash: '0xdef',
    txHash: null,
    blockNumber: null,
    network: 'hardhat',
    status: 'Pending',
    confirmedAt: null,
    createdBy: 'user-2',
    createdAt: '2026-08-04T09:00:00.000Z',
    updatedAt: '2026-08-04T09:00:00.000Z',
  },
];

const mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

const mockVerification = {
  verified: true,
  integrityOk: true,
  onChain: { exists: true, anchoredBy: '0xowner', anchoredAt: 1700000000, blockNumber: 42 },
  record: mockTransactions[0],
  message: 'Allocation verified on the blockchain ledger.',
};

function defaultMocks() {
  statusHook.mockReturnValue({ data: mockStatus, isLoading: false, error: null });
  transactionsHook.mockReturnValue({
    data: { transactions: mockTransactions, pagination: mockPagination },
    isLoading: false,
    isError: false,
    error: null,
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

  it('renders the ledger header, status cards, connection badge, and transaction rows', () => {
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

  it('reports a transactions load error instead of the table', () => {
    transactionsHook.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load blockchain transactions'),
    });

    renderWithProviders(<BlockchainLedger />);

    expect(screen.getByText('Failed to load blockchain transactions')).toBeInTheDocument();
    expect(screen.queryByText('ALC-2026-0001')).not.toBeInTheDocument();
  });

  it('re-anchors a Pending record through the row menu and mutation hook', async () => {
    retryMutateAsync.mockResolvedValue({});

    renderWithProviders(<BlockchainLedger />);

    fireEvent.pointerDown(screen.getAllByLabelText('More actions')[1]);
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

  it('wires the status filter into the transactions query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BlockchainLedger />);

    await user.click(screen.getByRole('combobox'));
    const pendingOption = await screen.findByRole('option', { name: 'Pending' });
    await user.click(pendingOption);

    await waitFor(() => {
      expect(transactionsHook).toHaveBeenCalledWith(
        { search: undefined, status: 'Pending' },
        { page: 1, limit: 10 },
        { sortBy: 'newest', sortOrder: 'desc' }
      );
    });
  });

  it('wires the debounced search box into the transactions query', async () => {
    renderWithProviders(<BlockchainLedger />);

    fireEvent.change(screen.getByPlaceholderText('Search by allocation code...'), {
      target: { value: 'ALC-2026' },
    });

    await waitFor(() => {
      expect(transactionsHook).toHaveBeenCalledWith(
        { search: 'ALC-2026', status: undefined },
        { page: 1, limit: 10 },
        { sortBy: 'newest', sortOrder: 'desc' }
      );
    });
  });
});
