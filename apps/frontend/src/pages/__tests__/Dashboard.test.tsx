import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderWithProviders, screen, createTestAuthValue } from '../../test/test-utils';
import { Dashboard } from '../Dashboard';
import { ROLES } from '../../constants/roles';

const fiscalYearsHook = vi.hoisted(() => vi.fn());
const statsHook = vi.hoisted(() => vi.fn());
const chartsHook = vi.hoisted(() => vi.fn());
const notificationsHook = vi.hoisted(() => vi.fn());
const blockchainHook = vi.hoisted(() => vi.fn());
const remainingBudgetHook = vi.hoisted(() => vi.fn());
const allocationStatsHook = vi.hoisted(() => vi.fn());
const breakdownHook = vi.hoisted(() => vi.fn());
const timelineHook = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/useFiscalYears', () => ({ useFiscalYears: fiscalYearsHook }));
vi.mock('../../hooks/useDashboard', () => ({
  useDashboardStats: statsHook,
  useDashboardCharts: chartsHook,
  useDashboardNotifications: notificationsHook,
}));
vi.mock('../../hooks/useBlockchain', () => ({ useBlockchainStatus: blockchainHook }));
vi.mock('../../hooks/useAllocations', () => ({
  useRemainingBudget: remainingBudgetHook,
  useAllocationStatistics: allocationStatsHook,
  useAllocationBreakdown: breakdownHook,
}));
vi.mock('../../hooks/useFinancialTimeline', () => ({
  useFinancialTimeline: timelineHook,
}));

function settled(data: unknown) {
  return {
    data,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    dataUpdatedAt: 1754640000000,
    refetch: vi.fn(),
  };
}

const BUDGET = { totalBudget: 5000000, totalAllocated: 2000000, remainingBudget: 3000000 };

function adminAuth() {
  return createTestAuthValue({
    user: {
      id: 'user-1',
      fullName: 'Ada Reyes',
      email: 'ada@university.edu',
      role: ROLES.ADMINISTRATOR,
      status: 'Active',
    },
    isAuthenticated: true,
    hasRole: (...roles: string[]) => roles.includes(ROLES.ADMINISTRATOR),
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  fiscalYearsHook.mockReturnValue(
    settled({
      fiscalYears: [
        { id: 'fy-2026', code: 'FY-2026', isActive: true },
        { id: 'fy-2025', code: 'FY-2025', isActive: false },
      ],
      pagination: { total: 2, page: 1, limit: 100, totalPages: 1 },
    })
  );
  statsHook.mockReturnValue(
    settled({
      totalUsers: 12,
      activeUsers: 10,
      inactiveUsers: 2,
      administrators: 1,
      treasurers: 2,
      budgetOfficers: 6,
      auditors: 3,
      fiscalYears: 2,
      fundSources: 5,
      departments: 8,
      budgetCategories: 6,
      budgetPrograms: 11,
    })
  );
  chartsHook.mockReturnValue(
    settled({ usersByRole: [{ role: 'Administrator', count: 1 }], usersByStatus: [] })
  );
  notificationsHook.mockReturnValue(settled([]));
  blockchainHook.mockReturnValue(
    settled({
      connected: true,
      network: 'sepolia',
      chainId: 11155111,
      latestBlock: 123456,
      lastSync: null,
      contractAddress: null,
      onChainCount: 0,
      message: '',
      recordCount: 0,
      confirmedCount: 0,
      pendingCount: 0,
      failedCount: 0,
    })
  );
  remainingBudgetHook.mockReturnValue(settled(BUDGET));
  allocationStatsHook.mockReturnValue(
    settled({
      totalAllocations: 9,
      totalAllocatedAmount: 2000000,
      remainingBudget: 3000000,
      draftCount: 0,
      pendingApprovalCount: 3,
      approvedCount: 6,
      rejectedCount: 0,
    })
  );
  breakdownHook.mockReturnValue(
    settled({ dimension: 'department', totalAmount: 2000000, breakdown: [] })
  );
  timelineHook.mockReturnValue({
    data: { timeline: [], pagination: { page: 1, limit: 8, total: 0, totalPages: 0 } },
    isLoading: false,
    isError: false,
    error: null,
  });
});

describe('Dashboard page', () => {
  it('leads with a single h1 and the signed-in user', () => {
    renderWithProviders(<Dashboard />, { authValue: adminAuth() });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Dashboard');
    expect(screen.getByText(/Welcome back, Ada Reyes/)).toBeInTheDocument();
  });

  it('puts financial information above administrative statistics', () => {
    renderWithProviders(<Dashboard />, { authValue: adminAuth() });

    const financial = screen.getByText('Financial Overview');
    const admin = screen.getByText('System Administration');

    // Node.DOCUMENT_POSITION_FOLLOWING === 4
    expect(financial.compareDocumentPosition(admin) & 4).toBeTruthy();
  });

  it('renders every currency figure from the API response', () => {
    renderWithProviders(<Dashboard />, { authValue: adminAuth() });

    // Total budget, total allocated, remaining — each appears in the KPI row.
    expect(screen.getAllByText('₱5,000,000.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₱2,000,000.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₱3,000,000.00').length).toBeGreaterThan(0);
    // 2,000,000 of 5,000,000
    expect(screen.getAllByText('40.0%').length).toBeGreaterThan(0);
  });

  it('derives the figures from the response rather than hardcoding them', () => {
    remainingBudgetHook.mockReturnValue(
      settled({ totalBudget: 800, totalAllocated: 200, remainingBudget: 600 })
    );

    renderWithProviders(<Dashboard />, { authValue: adminAuth() });

    expect(screen.getAllByText('₱800.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('25.0%').length).toBeGreaterThan(0);
    expect(screen.queryByText('₱5,000,000.00')).not.toBeInTheDocument();
  });

  it('shows the real pending-approval count, never a hardcoded zero', () => {
    renderWithProviders(<Dashboard />, { authValue: adminAuth() });

    const row = screen.getByText('Pending approval').closest('a');
    expect(row).toHaveTextContent('3');
    expect(row).toHaveAttribute(
      'href',
      '/budget-allocation/allocations?status=PendingApproval'
    );
  });

  it('shows an em dash for utilization when no budget ceiling is set', () => {
    remainingBudgetHook.mockReturnValue(
      settled({ totalBudget: 0, totalAllocated: 0, remainingBudget: 0 })
    );

    renderWithProviders(<Dashboard />, { authValue: adminAuth() });

    // Stated identically by the KPI card and the utilization card.
    expect(screen.getAllByText('No budget ceiling set').length).toBeGreaterThan(1);
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
  });

  it('surfaces one error with a retry when a section fails', () => {
    remainingBudgetHook.mockReturnValue({
      ...settled(undefined),
      isError: true,
      error: { response: { data: { message: 'Budget service unavailable' } } },
    });

    renderWithProviders(<Dashboard />, { authValue: adminAuth() });

    expect(screen.getAllByText('Budget service unavailable')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1);
  });

  it('scopes the financial queries to the active fiscal year', () => {
    renderWithProviders(<Dashboard />, { authValue: adminAuth() });

    expect(remainingBudgetHook).toHaveBeenCalledWith({ fiscalYearId: 'fy-2026' }, true);
    expect(allocationStatsHook).toHaveBeenCalledWith('fy-2026', true);
  });

  it('renders no nested scroll container', () => {
    const { container } = renderWithProviders(<Dashboard />, { authValue: adminAuth() });

    expect(container.querySelectorAll('.overflow-y-auto')).toHaveLength(0);
  });
});
