import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { BlockchainRecordTable } from '../BlockchainRecordTable';
import type { BlockchainRecord } from '../../../types/blockchain';
import type { PaginationInfo } from '../../../types/allocation';

const records: BlockchainRecord[] = [
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

const pagination: PaginationInfo = { page: 1, limit: 10, total: 2, totalPages: 1 };

describe('BlockchainRecordTable', () => {
  it('renders records with allocation codes and status badges', () => {
    render(
      <BlockchainRecordTable
        records={records}
        pagination={pagination}
        canRetry={false}
        isRetrying={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
        onPageChange={() => undefined}
      />
    );

    expect(screen.getByText('ALC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('ALC-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders a friendly empty state when there are no records', () => {
    render(
      <BlockchainRecordTable
        records={[]}
        pagination={{ page: 1, limit: 10, total: 0, totalPages: 0 }}
        canRetry={false}
        isRetrying={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
        onPageChange={() => undefined}
      />
    );

    expect(screen.getByText('No blockchain records found')).toBeInTheDocument();
  });

  it('opens verification when the Verify button is clicked', () => {
    const onVerify = vi.fn();
    render(
      <BlockchainRecordTable
        records={records}
        pagination={pagination}
        canRetry={false}
        isRetrying={false}
        onVerify={onVerify}
        onRetry={() => undefined}
        onPageChange={() => undefined}
      />
    );

    const verifyButtons = screen.getAllByRole('button', { name: /Verify/ });
    fireEvent.click(verifyButtons[0]);

    expect(onVerify).toHaveBeenCalledWith(records[0]);
  });

  it('offers Retry Anchor from the row menu for eligible roles on pending records', async () => {
    const onRetry = vi.fn();
    render(
      <BlockchainRecordTable
        records={records}
        pagination={pagination}
        canRetry
        isRetrying={false}
        onVerify={() => undefined}
        onRetry={onRetry}
        onPageChange={() => undefined}
      />
    );

    fireEvent.pointerDown(screen.getAllByLabelText('More actions')[1]);
    const retryItem = await screen.findByText('Retry Anchor');
    expect(retryItem).toBeInTheDocument();
    fireEvent.click(retryItem);

    expect(onRetry).toHaveBeenCalledWith(records[1]);
  });

  it('does not offer Retry Anchor when the actor lacks retry permission', async () => {
    render(
      <BlockchainRecordTable
        records={records}
        pagination={pagination}
        canRetry={false}
        isRetrying={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
        onPageChange={() => undefined}
      />
    );

    fireEvent.pointerDown(screen.getAllByLabelText('More actions')[0]);
    await waitFor(() => expect(screen.queryByText('Retry Anchor')).not.toBeInTheDocument());
  });
});
