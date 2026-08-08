import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, createTestAuthValue } from '../../../test/test-utils';
import { AdminStatsSection } from '../AdminStatsSection';
import { ROLES } from '../../../constants/roles';

const statsHook = vi.hoisted(() => vi.fn());
const chartsHook = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useDashboard', () => ({
  useDashboardStats: statsHook,
  useDashboardCharts: chartsHook,
}));

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

const stats = {
  totalUsers: 12,
  activeUsers: 10,
  inactiveUsers: 2,
  administrators: 1,
  treasurers: 2,
  budgetOfficers: 6,
  auditors: 3,
  fiscalYears: 3,
  fundSources: 5,
  departments: 8,
  budgetCategories: 6,
  budgetPrograms: 11,
};

beforeEach(() => {
  vi.clearAllMocks();
  statsHook.mockReturnValue({
    data: stats,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
  chartsHook.mockReturnValue({
    data: {
      usersByRole: [
        { role: 'Administrator', count: 1 },
        { role: 'Budget Officer', count: 6 },
      ],
      usersByStatus: [{ status: 'Active', count: 10 }],
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('AdminStatsSection', () => {
  it('is expanded by default for an Administrator', () => {
    renderWithProviders(<AdminStatsSection />, {
      authValue: authFor(ROLES.ADMINISTRATOR),
    });

    expect(
      screen.getByRole('button', { name: /System Administration/i })
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('is collapsed but still present for other roles', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminStatsSection />, {
      authValue: authFor(ROLES.TREASURER),
    });

    const toggle = screen.getByRole('button', { name: /System Administration/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Total Users')).not.toBeInTheDocument();

    // Collapsed, not removed: the figures stay reachable.
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('keeps every count reachable and links master data to its management page', () => {
    renderWithProviders(<AdminStatsSection />, {
      authValue: authFor(ROLES.ADMINISTRATOR),
    });

    for (const label of [
      'Total Users',
      'Active Users',
      'Inactive Users',
      'Fiscal Years',
      'Fund Sources',
      'Departments',
      'Budget Categories',
      'Budget Programs',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    expect(screen.getByText('Fiscal Years').closest('a')).toHaveAttribute(
      'href',
      '/budget-allocation/fiscal-years'
    );
    expect(screen.getByText('Total Users').closest('a')).toHaveAttribute(
      'href',
      '/users'
    );
  });

  it('does not link user counts for a role that cannot open /users', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminStatsSection />, {
      authValue: authFor(ROLES.BUDGET_OFFICER),
    });

    await user.click(screen.getByRole('button', { name: /System Administration/i }));

    expect(screen.getByText('Total Users').closest('a')).toBeNull();
    // Master data has no role guard, so those links remain.
    expect(screen.getByText('Departments').closest('a')).toHaveAttribute(
      'href',
      '/budget-allocation/departments'
    );
  });

  it('does not render a users-by-status chart', () => {
    renderWithProviders(<AdminStatsSection />, {
      authValue: authFor(ROLES.ADMINISTRATOR),
    });

    expect(screen.getByText('Users by Role')).toBeInTheDocument();
    expect(screen.queryByText('Users by Status')).not.toBeInTheDocument();
  });
});
