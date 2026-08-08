import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderWithProviders, screen } from '../../../test/test-utils';
import { createTestAuthValue } from '../../../test/test-utils';
import { ActionRequiredPanel } from '../ActionRequiredPanel';
import { ROLES } from '../../../constants/roles';
import type { AllocationStatistics } from '../../../types/allocation';
import type { BlockchainStatus } from '../../../types/blockchain';

function authFor(role: string) {
  return createTestAuthValue({
    user: {
      id: 'user-1',
      fullName: 'Test User',
      email: 'test@university.edu',
      role,
      status: 'Active',
    },
    isAuthenticated: true,
    hasRole: (...roles: string[]) => roles.includes(role),
  });
}

const statistics: AllocationStatistics = {
  totalAllocations: 10,
  totalAllocatedAmount: 500000,
  remainingBudget: 250000,
  draftCount: 2,
  pendingApprovalCount: 3,
  approvedCount: 4,
  rejectedCount: 1,
};

const blockchain = {
  connected: true,
  network: 'sepolia',
  chainId: 11155111,
  latestBlock: 123456,
  lastSync: '2026-08-06T08:00:00.000Z',
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
  onChainCount: 5,
  message: '',
  recordCount: 6,
  confirmedCount: 4,
  pendingCount: 1,
  failedCount: 1,
} as BlockchainStatus;

function renderPanel(role: string, overrides: Partial<AllocationStatistics> = {}) {
  return renderWithProviders(
    <ActionRequiredPanel
      statistics={{ ...statistics, ...overrides }}
      blockchain={blockchain}
      scopeLabel="FY-2026"
    />,
    { authValue: authFor(role) }
  );
}

describe('ActionRequiredPanel', () => {
  it('shows approval work only to roles that can decide', () => {
    renderPanel(ROLES.ADMINISTRATOR);
    expect(screen.getByText('Pending approval')).toBeInTheDocument();

    renderPanel(ROLES.TREASURER);
    expect(screen.getAllByText('Pending approval').length).toBe(2);
  });

  it('hides approval work from roles that cannot decide', () => {
    renderPanel(ROLES.BUDGET_OFFICER);
    expect(screen.queryByText('Pending approval')).not.toBeInTheDocument();

    renderPanel(ROLES.AUDITOR);
    expect(screen.queryByText('Pending approval')).not.toBeInTheDocument();
  });

  it('shows authoring work only to roles that can revise allocations', () => {
    renderPanel(ROLES.BUDGET_OFFICER);
    expect(screen.getByText('Draft allocations')).toBeInTheDocument();
    expect(screen.getByText('Rejected allocations')).toBeInTheDocument();
  });

  it('hides authoring work from reviewers and auditors', () => {
    renderPanel(ROLES.TREASURER);
    expect(screen.queryByText('Draft allocations')).not.toBeInTheDocument();

    renderPanel(ROLES.AUDITOR);
    expect(screen.queryByText('Rejected allocations')).not.toBeInTheDocument();
  });

  it('shows the ledger row to every role, since the ledger is read-only', () => {
    for (const role of [
      ROLES.ADMINISTRATOR,
      ROLES.TREASURER,
      ROLES.BUDGET_OFFICER,
      ROLES.AUDITOR,
    ]) {
      const { unmount } = renderPanel(role);
      expect(screen.getByText('Ledger records to review')).toBeInTheDocument();
      unmount();
    }
  });

  it('links each row into a pre-filtered list', () => {
    renderPanel(ROLES.ADMINISTRATOR);

    expect(screen.getByText('Pending approval').closest('a')).toHaveAttribute(
      'href',
      '/budget-allocation/allocations?status=PendingApproval'
    );
    expect(screen.getByText('Draft allocations').closest('a')).toHaveAttribute(
      'href',
      '/budget-allocation/allocations?status=Draft'
    );
    expect(screen.getByText('Ledger records to review').closest('a')).toHaveAttribute(
      'href',
      '/budget-allocation/blockchain'
    );
  });

  it('hides rows whose count is zero rather than padding with zeroes', () => {
    renderPanel(ROLES.ADMINISTRATOR, { draftCount: 0, rejectedCount: 0 });

    expect(screen.getByText('Pending approval')).toBeInTheDocument();
    expect(screen.queryByText('Draft allocations')).not.toBeInTheDocument();
    expect(screen.queryByText('Rejected allocations')).not.toBeInTheDocument();
  });

  it('shows an all-clear state when nothing is actionable', () => {
    renderWithProviders(
      <ActionRequiredPanel
        statistics={{
          ...statistics,
          draftCount: 0,
          pendingApprovalCount: 0,
          rejectedCount: 0,
        }}
        blockchain={{ ...blockchain, pendingCount: 0, failedCount: 0 }}
        scopeLabel="FY-2026"
      />,
      { authValue: authFor(ROLES.ADMINISTRATOR) }
    );

    expect(screen.getByText('Nothing needs your attention')).toBeInTheDocument();
  });

  it('omits the ledger row entirely when ledger status is unavailable', () => {
    renderWithProviders(
      <ActionRequiredPanel statistics={statistics} scopeLabel="FY-2026" />,
      { authValue: authFor(ROLES.ADMINISTRATOR) }
    );

    expect(screen.queryByText('Ledger records to review')).not.toBeInTheDocument();
    // The allocation queues still render, so one failing source does not
    // blank the panel.
    expect(screen.getByText('Pending approval')).toBeInTheDocument();
  });
});
