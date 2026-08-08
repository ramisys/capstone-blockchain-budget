import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderWithProviders, screen, createTestAuthValue } from '../../../test/test-utils';
import { NotificationPanel } from '../NotificationPanel';
import { NOTIFICATION_KEY } from '../../../constants/notifications';
import { ROLES } from '../../../constants/roles';
import type { DashboardNotification } from '../../../types/dashboard';

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

const inactiveUsers: DashboardNotification = {
  key: NOTIFICATION_KEY.INACTIVE_USERS,
  title: 'Inactive Users',
  message: '2 user accounts are currently inactive.',
  type: 'warning',
  count: 2,
};

const pendingApprovals: DashboardNotification = {
  key: NOTIFICATION_KEY.PENDING_APPROVALS,
  title: 'Pending Approvals',
  message: '3 budget allocations require approval.',
  type: 'info',
  count: 3,
};

const failedAnchors: DashboardNotification = {
  key: NOTIFICATION_KEY.LEDGER_ANCHORS_FAILED,
  title: 'Ledger Anchors Failed',
  message: '1 blockchain record failed to anchor and can be retried.',
  type: 'error',
  count: 1,
};

describe('NotificationPanel', () => {
  it('shows an empty state rather than an unearned all-clear', () => {
    renderWithProviders(<NotificationPanel notifications={[]} />, {
      authValue: authFor(ROLES.ADMINISTRATOR),
    });

    expect(screen.getByText('Nothing to report')).toBeInTheDocument();
    expect(screen.queryByText(/operating normally/i)).not.toBeInTheDocument();
  });

  it('links a notification to where it can be acted on', () => {
    renderWithProviders(
      <NotificationPanel notifications={[pendingApprovals, failedAnchors]} />,
      { authValue: authFor(ROLES.TREASURER) }
    );

    expect(screen.getByText('Pending Approvals').closest('a')).toHaveAttribute(
      'href',
      '/budget-allocation/allocations?status=PendingApproval'
    );
    expect(screen.getByText('Ledger Anchors Failed').closest('a')).toHaveAttribute(
      'href',
      '/budget-allocation/blockchain'
    );
  });

  it('does not link a role into a route it cannot open', () => {
    renderWithProviders(<NotificationPanel notifications={[inactiveUsers]} />, {
      authValue: authFor(ROLES.BUDGET_OFFICER),
    });

    // /users is Administrator-only, so the row stays informational.
    expect(screen.getByText('Inactive Users')).toBeInTheDocument();
    expect(screen.getByText('Inactive Users').closest('a')).toBeNull();
  });

  it('links the same notification for an Administrator', () => {
    renderWithProviders(<NotificationPanel notifications={[inactiveUsers]} />, {
      authValue: authFor(ROLES.ADMINISTRATOR),
    });

    expect(screen.getByText('Inactive Users').closest('a')).toHaveAttribute(
      'href',
      '/users'
    );
  });

  it('names each severity in text, so it is not carried by colour alone', () => {
    renderWithProviders(
      <NotificationPanel
        notifications={[failedAnchors, inactiveUsers, pendingApprovals]}
      />,
      { authValue: authFor(ROLES.ADMINISTRATOR) }
    );

    expect(screen.getByText('Error:')).toBeInTheDocument();
    expect(screen.getByText('Warning:')).toBeInTheDocument();
    expect(screen.getByText('Information:')).toBeInTheDocument();
  });

  it('renders an unknown notification key as plain informational text', () => {
    renderWithProviders(
      <NotificationPanel
        notifications={[
          { key: 'SOMETHING_NEW', title: 'Something New', message: 'Details.', type: 'info' },
        ]}
      />,
      { authValue: authFor(ROLES.ADMINISTRATOR) }
    );

    expect(screen.getByText('Something New')).toBeInTheDocument();
    expect(screen.getByText('Something New').closest('a')).toBeNull();
  });
});
