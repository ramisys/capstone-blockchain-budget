import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { BlockchainRecordTable } from '../BlockchainRecordTable';
import type { LedgerHistoryEntry } from '../../../types/blockchain';
import type { PaginationInfo } from '../../../types/allocation';

const records: LedgerHistoryEntry[] = [
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
    ref: { id: 'alloc-1', allocationCode: 'ALC-2026-0001' },
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
    ref: { id: 'alloc-2', allocationCode: 'ALC-2026-0002' },
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
    ref: { id: 'audit-1', action: 'ALLOCATION_APPROVED' },
  },
];

const pagination: PaginationInfo = { page: 1, limit: 10, total: 3, totalPages: 1 };

const baseProps = {
  pagination,
  canRetry: false,
  isRetrying: false,
  onViewDetails: () => undefined,
  onVerify: () => undefined,
  onRetry: () => undefined,
  onPageChange: () => undefined,
};

describe('BlockchainRecordTable', () => {
  it('renders unified ledger entries with record type badges and reference codes', () => {
    render(<BlockchainRecordTable records={records} {...baseProps} />);

    expect(screen.getByText('ALC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('ALC-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('AUD-2026-0042')).toBeInTheDocument();
    expect(screen.getAllByText('Allocation').length).toBeGreaterThan(0);
    expect(screen.getByText('Audit Event')).toBeInTheDocument();
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders a friendly empty state when there are no records', () => {
    render(
      <BlockchainRecordTable
        records={[]}
        {...baseProps}
        pagination={{ page: 1, limit: 10, total: 0, totalPages: 0 }}
      />
    );

    expect(screen.getByText('No ledger entries found')).toBeInTheDocument();
  });

  it('opens the detail view when the Details button is clicked', () => {
    const onViewDetails = vi.fn();
    render(<BlockchainRecordTable records={records} {...baseProps} onViewDetails={onViewDetails} />);

    const detailsButtons = screen.getAllByRole('button', { name: /Details/ });
    fireEvent.click(detailsButtons[2]);

    expect(onViewDetails).toHaveBeenCalledWith(records[2]);
  });

  it('opens verification when the Verify button is clicked on an allocation entry', () => {
    const onVerify = vi.fn();
    render(<BlockchainRecordTable records={records} {...baseProps} onVerify={onVerify} />);

    const verifyButtons = screen.getAllByRole('button', { name: /Verify/ });
    expect(verifyButtons).toHaveLength(2);
    fireEvent.click(verifyButtons[0]);

    expect(onVerify).toHaveBeenCalledWith(records[0]);
  });

  it('does not offer Verify or Retry for non-allocation entries', async () => {
    render(<BlockchainRecordTable records={[records[2]]} {...baseProps} canRetry />);

    expect(screen.queryByRole('button', { name: /Verify/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry Anchor/ })).not.toBeInTheDocument();
  });

  it('offers Retry Anchor from the row menu for eligible roles on pending allocations', async () => {
    const onRetry = vi.fn();
    render(<BlockchainRecordTable records={records} {...baseProps} canRetry onRetry={onRetry} />);

    fireEvent.pointerDown(screen.getAllByLabelText('More actions')[0]);
    const retryItem = await screen.findByText('Retry Anchor');
    expect(retryItem).toBeInTheDocument();
    fireEvent.click(retryItem);

    expect(onRetry).toHaveBeenCalledWith(records[1]);
  });

  it('does not offer Retry Anchor when the actor lacks retry permission', async () => {
    render(<BlockchainRecordTable records={records} {...baseProps} />);

    expect(screen.queryByLabelText('More actions')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Retry Anchor')).not.toBeInTheDocument());
  });
});
