import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderWithProviders, screen } from '../../../test/test-utils';
import { BlockchainStatusStrip } from '../BlockchainStatusStrip';
import type { BlockchainStatus } from '../../../types/blockchain';

const base: BlockchainStatus = {
  connected: true,
  network: 'sepolia',
  chainId: 11155111,
  latestBlock: 123456,
  lastSync: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
  explorerUrl: 'https://sepolia.etherscan.io',
  contractExplorerUrl: 'https://sepolia.etherscan.io/address/0x1234',
  onChainCount: 4,
  message: '',
  recordCount: 6,
  confirmedCount: 4,
  pendingCount: 1,
  failedCount: 1,
};

describe('BlockchainStatusStrip', () => {
  it('reports the last anchor when records exist', () => {
    renderWithProviders(<BlockchainStatusStrip status={base} />);

    expect(screen.getByText(/Last anchor/i)).toBeInTheDocument();
    expect(screen.queryByText(/Never/i)).not.toBeInTheDocument();
  });

  it('says nothing is anchored yet rather than "Never" when connected with no records', () => {
    renderWithProviders(
      <BlockchainStatusStrip
        status={{ ...base, recordCount: 0, confirmedCount: 0, pendingCount: 0, failedCount: 0, lastSync: null }}
      />
    );

    expect(screen.getByText('No records anchored yet.')).toBeInTheDocument();
    // The contradiction this component exists to fix.
    expect(screen.queryByText(/Never/i)).not.toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it("surfaces the API's own explanation when not connected", () => {
    renderWithProviders(
      <BlockchainStatusStrip
        status={{
          ...base,
          connected: false,
          network: null,
          latestBlock: null,
          contractAddress: null,
          message: 'Blockchain integration is not yet configured.',
        }}
      />
    );

    expect(
      screen.getByText('Blockchain integration is not yet configured.')
    ).toBeInTheDocument();
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    // Technical fields are omitted entirely rather than shown as em dashes.
    expect(screen.queryByText('Latest block')).not.toBeInTheDocument();
    expect(screen.queryByText('Contract')).not.toBeInTheDocument();
  });

  it('surfaces the record counts the old card discarded', () => {
    renderWithProviders(<BlockchainStatusStrip status={base} />);

    expect(screen.getByText('Anchored records')).toBeInTheDocument();
    expect(screen.getByText('1 pending')).toBeInTheDocument();
    expect(screen.getByText('1 failed')).toBeInTheDocument();
  });

  it('hides pending and failed chips when both are zero', () => {
    renderWithProviders(
      <BlockchainStatusStrip status={{ ...base, pendingCount: 0, failedCount: 0 }} />
    );

    expect(screen.queryByText(/pending$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/failed$/)).not.toBeInTheDocument();
  });

  it('truncates the contract address but keeps the full value reachable', () => {
    renderWithProviders(<BlockchainStatusStrip status={base} />);

    const copyButton = screen.getByRole('button', {
      name: `Copy contract address ${base.contractAddress}`,
    });
    expect(copyButton).toHaveAttribute('title', base.contractAddress);
    expect(screen.getByText('0x1234…5678')).toBeInTheDocument();
    // The untruncated address is never laid out, which is what overflowed at 360px.
    expect(screen.queryByText(base.contractAddress!)).not.toBeInTheDocument();
  });

  it('links to the ledger page and the block explorer', () => {
    renderWithProviders(<BlockchainStatusStrip status={base} />);

    expect(screen.getByText('View ledger →').closest('a')).toHaveAttribute(
      'href',
      '/budget-allocation/blockchain'
    );
    expect(
      screen.getByRole('link', { name: 'View contract in block explorer' })
    ).toHaveAttribute('href', base.contractExplorerUrl!);
  });
});
