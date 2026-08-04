import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import {
  BlockchainVerificationContent,
  BlockchainVerificationCard,
} from '../BlockchainVerificationCard';
import { ROLES } from '../../../constants/roles';
import type { BlockchainVerification, BlockchainRecord } from '../../../types/blockchain';

vi.mock('../../../hooks/useBlockchain', () => ({
  useAllocationBlockchainVerification: vi.fn(),
  useVerifyAllocation: vi.fn(),
  useRetryBlockchainRecord: vi.fn(),
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import {
  useAllocationBlockchainVerification,
  useVerifyAllocation,
  useRetryBlockchainRecord,
} from '../../../hooks/useBlockchain';
import { useAuth } from '../../../hooks/useAuth';

const mockRecord: BlockchainRecord = {
  id: 'rec-1',
  allocationId: 'alloc-1',
  allocationCode: 'ALC-2026-0001',
  contentHash: '0xabc123',
  txHash: '0xdeadbeef',
  blockNumber: 42,
  network: 'hardhat',
  status: 'Confirmed',
  confirmedAt: '2026-08-04T08:00:00.000Z',
  createdBy: 'user-1',
  createdAt: '2026-08-04T08:00:00.000Z',
  updatedAt: '2026-08-04T08:00:00.000Z',
};

const mockVerification: BlockchainVerification = {
  verified: true,
  integrityOk: true,
  onChain: null,
  record: mockRecord,
  message: 'Allocation verified on the blockchain ledger.',
};

describe('BlockchainVerificationContent', () => {
  it('renders loading skeletons while fetching', () => {
    render(
      <BlockchainVerificationContent
        verification={undefined}
        isLoading
        isError={false}
        isVerifying={false}
        isRetrying={false}
        canRetry={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
      />
    );
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows an error message when the query fails', () => {
    render(
      <BlockchainVerificationContent
        verification={undefined}
        isLoading={false}
        isError
        errorMessage="Ledger unavailable"
        isVerifying={false}
        isRetrying={false}
        canRetry={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
      />
    );
    expect(screen.getByText('Ledger unavailable')).toBeInTheDocument();
  });

  it('renders the verified record details and integrity result', () => {
    render(
      <BlockchainVerificationContent
        verification={mockVerification}
        isLoading={false}
        isError={false}
        isVerifying={false}
        isRetrying={false}
        canRetry={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
      />
    );

    expect(screen.getByText('Verified on the ledger')).toBeInTheDocument();
    expect(screen.getByText('0xabc123')).toBeInTheDocument();
    expect(screen.getByText('0xdeadbeef')).toBeInTheDocument();
    expect(screen.getByText('Hash matches stored record')).toBeInTheDocument();
  });

  it('shows the not-anchored state when no record exists', () => {
    render(
      <BlockchainVerificationContent
        verification={{
          verified: false,
          integrityOk: null,
          onChain: null,
          record: null,
          message: 'No blockchain record exists for this allocation.',
        }}
        isLoading={false}
        isError={false}
        isVerifying={false}
        isRetrying={false}
        canRetry={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
      />
    );

    expect(screen.getByText('Not verified')).toBeInTheDocument();
    expect(
      screen.getByText(/No blockchain record exists for this allocation yet/)
    ).toBeInTheDocument();
  });
});

describe('BlockchainVerificationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAllocationBlockchainVerification).mockReturnValue({
      data: mockVerification,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    vi.mocked(useVerifyAllocation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);
    vi.mocked(useRetryBlockchainRecord).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);
    vi.mocked(useAuth).mockReturnValue({
      hasRole: vi.fn(() => true),
    } as any);
  });

  it('runs verify when the Verify Now button is clicked', async () => {
    const verify = vi.fn().mockResolvedValue({});
    vi.mocked(useVerifyAllocation).mockReturnValue({
      mutateAsync: verify,
      isPending: false,
    } as any);

    render(<BlockchainVerificationCard allocationId="alloc-1" allocationCode="ALC-2026-0001" />);

    fireEvent.click(screen.getByRole('button', { name: /Verify Now/ }));

    await waitFor(() => expect(verify).toHaveBeenCalledWith('alloc-1'));
  });

  it('shows a Retry Anchor button for retry-allowed roles on a pending record', () => {
    vi.mocked(useAllocationBlockchainVerification).mockReturnValue({
      data: { ...mockVerification, record: { ...mockRecord, status: 'Pending' } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(useAuth).mockReturnValue({
      hasRole: vi.fn((...roles: string[]) =>
        roles.includes(ROLES.ADMINISTRATOR) || roles.includes(ROLES.TREASURER)
      ),
    } as any);

    render(<BlockchainVerificationCard allocationId="alloc-1" allocationCode="ALC-2026-0001" />);

    expect(screen.getByRole('button', { name: /Retry Anchor/ })).toBeInTheDocument();
  });

  it('hides Retry Anchor for an Auditor (not in retry roles)', () => {
    vi.mocked(useAllocationBlockchainVerification).mockReturnValue({
      data: { ...mockVerification, record: { ...mockRecord, status: 'Failed' } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(useAuth).mockReturnValue({
      hasRole: vi.fn(() => false),
    } as any);

    render(<BlockchainVerificationCard allocationId="alloc-1" allocationCode="ALC-2026-0001" />);

    expect(screen.queryByRole('button', { name: /Retry Anchor/ })).not.toBeInTheDocument();
  });

  it('re-anchors via the Retry Anchor button', async () => {
    const retry = vi.fn().mockResolvedValue({});
    vi.mocked(useAllocationBlockchainVerification).mockReturnValue({
      data: { ...mockVerification, record: { ...mockRecord, status: 'Pending' } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    vi.mocked(useRetryBlockchainRecord).mockReturnValue({
      mutateAsync: retry,
      isPending: false,
    } as any);

    render(<BlockchainVerificationCard allocationId="alloc-1" allocationCode="ALC-2026-0001" />);

    fireEvent.click(screen.getByRole('button', { name: /Retry Anchor/ }));

    await waitFor(() => expect(retry).toHaveBeenCalledWith('alloc-1'));
  });
});
