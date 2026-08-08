import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import {
  DashboardSection,
  DashboardStateBoundary,
} from '../components/dashboard/DashboardSection';
import { FinancialStatCard } from '../components/dashboard/FinancialStatCard';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ActionRequiredPanel } from '../components/dashboard/ActionRequiredPanel';
import { AllocationBreakdownChart } from '../components/dashboard/AllocationBreakdownChart';
import { NotificationPanel } from '../components/dashboard/NotificationPanel';
import { BlockchainStatusStrip } from '../components/dashboard/BlockchainStatusStrip';
import { AdminStatsSection } from '../components/dashboard/AdminStatsSection';
import { FinancialActivityTimeline } from '../components/dashboard/FinancialActivityTimeline';
import { BudgetSummary } from '../components/allocations/BudgetSummary';
import {
  useDashboardCharts,
  useDashboardNotifications,
  useDashboardStats,
} from '../hooks/useDashboard';
import { useBlockchainStatus } from '../hooks/useBlockchain';
import {
  useAllocationBreakdown,
  useAllocationStatistics,
  useRemainingBudget,
} from '../hooks/useAllocations';
import { useFiscalYears } from '../hooks/useFiscalYears';
import { formatCurrency } from '../utils/format';
import { Banknote, Landmark, PieChart as PieChartIcon, PiggyBank } from 'lucide-react';

/** Master-data page size used to populate the fiscal-year scope selector. */
const FISCAL_YEAR_OPTIONS_LIMIT = 100;

export function Dashboard() {
  const queryClient = useQueryClient();

  // `undefined` until the fiscal years load, then defaulted to the active year.
  const [fiscalYearId, setFiscalYearId] = useState<string | undefined>(undefined);
  const [fiscalYearTouched, setFiscalYearTouched] = useState(false);

  const fiscalYearsQuery = useFiscalYears(
    {},
    { page: 1, limit: FISCAL_YEAR_OPTIONS_LIMIT }
  );
  const fiscalYears = fiscalYearsQuery.data?.fiscalYears ?? [];

  // Default the scope to the active fiscal year the first time it is known.
  // Once the user picks a scope explicitly, their choice wins.
  const activeFiscalYearId = fiscalYears.find((year) => year.isActive)?.id;
  const effectiveFiscalYearId = fiscalYearTouched ? fiscalYearId : activeFiscalYearId;

  const statsQuery = useDashboardStats();
  const chartsQuery = useDashboardCharts();
  const notificationsQuery = useDashboardNotifications();
  const blockchainQuery = useBlockchainStatus();
  // Deferred until the fiscal years resolve, otherwise the unscoped summary
  // would render first and be replaced the moment the active year is known.
  const budgetQuery = useRemainingBudget(
    effectiveFiscalYearId ? { fiscalYearId: effectiveFiscalYearId } : {},
    !fiscalYearsQuery.isLoading
  );
  const allocationStatsQuery = useAllocationStatistics(
    effectiveFiscalYearId,
    !fiscalYearsQuery.isLoading
  );
  const departmentBreakdownQuery = useAllocationBreakdown(
    'department',
    effectiveFiscalYearId,
    !fiscalYearsQuery.isLoading
  );
  const categoryBreakdownQuery = useAllocationBreakdown(
    'category',
    effectiveFiscalYearId,
    !fiscalYearsQuery.isLoading
  );

  const notifications = notificationsQuery.data ?? [];
  const blockchainStatus = blockchainQuery.data;
  const budget = budgetQuery.data;

  const totalBudget = budget?.totalBudget ?? 0;
  const totalAllocated = budget?.totalAllocated ?? 0;

  // While the fiscal years are still loading the budget query is deliberately
  // disabled, which React Query reports as "not loading" — keep the cards in
  // their skeleton state across both steps instead of flashing zero.
  const budgetLoading = fiscalYearsQuery.isLoading || budgetQuery.isLoading;
  const allocationStatsLoading =
    fiscalYearsQuery.isLoading || allocationStatsQuery.isLoading;

  // Utilization is only meaningful against a non-zero ceiling; with no budget
  // set, an em dash is honest where "0.0%" would not be.
  const utilizationLabel =
    totalBudget > 0
      ? `${Math.min(100, Math.max(0, (totalAllocated / totalBudget) * 100)).toFixed(1)}%`
      : '—';

  const scopeLabel = effectiveFiscalYearId
    ? fiscalYears.find((year) => year.id === effectiveFiscalYearId)?.code ??
      'Selected fiscal year'
    : 'All fiscal years';

  const lastUpdatedAt = useMemo(() => {
    const timestamps = [
      statsQuery.dataUpdatedAt,
      chartsQuery.dataUpdatedAt,
      notificationsQuery.dataUpdatedAt,
      blockchainQuery.dataUpdatedAt,
      budgetQuery.dataUpdatedAt,
      allocationStatsQuery.dataUpdatedAt,
      departmentBreakdownQuery.dataUpdatedAt,
      categoryBreakdownQuery.dataUpdatedAt,
    ].filter((value) => value > 0);
    return timestamps.length > 0 ? Math.max(...timestamps) : undefined;
  }, [
    statsQuery.dataUpdatedAt,
    chartsQuery.dataUpdatedAt,
    notificationsQuery.dataUpdatedAt,
    blockchainQuery.dataUpdatedAt,
    budgetQuery.dataUpdatedAt,
    allocationStatsQuery.dataUpdatedAt,
    departmentBreakdownQuery.dataUpdatedAt,
    categoryBreakdownQuery.dataUpdatedAt,
  ]);

  const isRefreshing =
    statsQuery.isFetching ||
    chartsQuery.isFetching ||
    notificationsQuery.isFetching ||
    blockchainQuery.isFetching ||
    budgetQuery.isFetching ||
    allocationStatsQuery.isFetching ||
    departmentBreakdownQuery.isFetching ||
    categoryBreakdownQuery.isFetching;

  // Marks every cached query stale; React Query refetches the ones mounted on
  // this page, including the timeline, which owns its own filter state.
  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const handleFiscalYearChange = (next: string | undefined) => {
    setFiscalYearTouched(true);
    setFiscalYearId(next);
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader
        fiscalYears={fiscalYears}
        selectedFiscalYearId={effectiveFiscalYearId}
        onFiscalYearChange={handleFiscalYearChange}
        fiscalYearsLoading={fiscalYearsQuery.isLoading}
        lastUpdatedAt={lastUpdatedAt}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Financial overview. Every figure comes from
          GET /allocations/remaining-budget, scoped by the header's fiscal year. */}
      <DashboardSection title="Financial Overview" titleId="dashboard-financial-overview">
        <DashboardStateBoundary
          isError={budgetQuery.isError}
          error={budgetQuery.error}
          onRetry={() => budgetQuery.refetch()}
          errorFallbackMessage="Failed to load the budget summary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <FinancialStatCard
              title="Total Budget"
              value={formatCurrency(totalBudget)}
              subtitle={scopeLabel}
              icon={Landmark}
              iconClassName="bg-[var(--color-primary-bg)] text-[var(--color-primary)]"
              loading={budgetLoading}
            />
            <FinancialStatCard
              title="Total Allocated"
              value={formatCurrency(totalAllocated)}
              subtitle="Approved allocations only"
              icon={Banknote}
              iconClassName="bg-[var(--color-secondary-bg)] text-[var(--color-secondary)]"
              loading={budgetLoading}
            />
            <FinancialStatCard
              title="Remaining Budget"
              value={formatCurrency(budget?.remainingBudget ?? 0)}
              subtitle="Available to allocate"
              icon={PiggyBank}
              iconClassName="bg-[var(--color-success-bg)] text-[var(--color-success)]"
              loading={budgetLoading}
            />
            <FinancialStatCard
              title="Utilization Rate"
              value={utilizationLabel}
              subtitle={
                totalBudget > 0 ? 'Allocated of total budget' : 'No budget ceiling set'
              }
              icon={PieChartIcon}
              iconClassName="bg-[var(--color-warning-bg)] text-[var(--color-warning)]"
              loading={budgetLoading}
            />
          </div>
        </DashboardStateBoundary>
      </DashboardSection>

      {/* Budget utilization alongside the work queues. The utilization card is
          fed by /allocations/remaining-budget and the queues by
          /allocations/statistics, so each keeps its own error boundary. */}
      <DashboardSection>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <DashboardStateBoundary
              isError={budgetQuery.isError}
              error={budgetQuery.error}
              onRetry={() => budgetQuery.refetch()}
              errorFallbackMessage="Failed to load the budget summary"
            >
              <BudgetSummary
                data={budget}
                loading={budgetLoading}
                subtitle={`Budget utilization · ${scopeLabel}`}
                segmented
                footnote="Allocated counts approved allocations only. Drafts and allocations pending approval do not commit budget."
              />
            </DashboardStateBoundary>
          </div>

          <DashboardStateBoundary
            isError={allocationStatsQuery.isError}
            error={allocationStatsQuery.error}
            onRetry={() => allocationStatsQuery.refetch()}
            errorFallbackMessage="Failed to load the allocation queues"
          >
            <ActionRequiredPanel
              statistics={allocationStatsQuery.data}
              blockchain={blockchainStatus}
              loading={allocationStatsLoading}
              scopeLabel={scopeLabel}
            />
          </DashboardStateBoundary>
        </div>
      </DashboardSection>

      {/* Financial analytics. Each chart has its own query and boundary so one
          failing dimension does not blank the other. */}
      <DashboardSection title="Financial Analytics" titleId="dashboard-financial-analytics">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardStateBoundary
            isError={departmentBreakdownQuery.isError}
            error={departmentBreakdownQuery.error}
            onRetry={() => departmentBreakdownQuery.refetch()}
            errorFallbackMessage="Failed to load the department breakdown"
          >
            <AllocationBreakdownChart
              title="Allocation by Department"
              description={`Approved allocations · ${scopeLabel}`}
              entries={departmentBreakdownQuery.data?.breakdown}
              loading={fiscalYearsQuery.isLoading || departmentBreakdownQuery.isLoading}
            />
          </DashboardStateBoundary>

          <DashboardStateBoundary
            isError={categoryBreakdownQuery.isError}
            error={categoryBreakdownQuery.error}
            onRetry={() => categoryBreakdownQuery.refetch()}
            errorFallbackMessage="Failed to load the category breakdown"
          >
            <AllocationBreakdownChart
              title="Allocation by Budget Category"
              description={`Approved allocations · ${scopeLabel}`}
              entries={categoryBreakdownQuery.data?.breakdown}
              loading={fiscalYearsQuery.isLoading || categoryBreakdownQuery.isLoading}
            />
          </DashboardStateBoundary>
        </div>
      </DashboardSection>

      {/* Financial Activity Timeline and Notifications */}
      <DashboardSection>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {/* Eight rows keeps the card a sane height now that the inner
                scroll container is gone; the paginator reaches the rest. */}
            <FinancialActivityTimeline limit={8} />
          </div>

          <Card className="h-full">
            <CardHeader className="pb-4">
              <h6 className="mb-0 text-sm font-semibold text-slate-500">
                Notifications
              </h6>
            </CardHeader>
            <CardBody className="p-4">
              <DashboardStateBoundary
                isLoading={notificationsQuery.isLoading}
                isError={notificationsQuery.isError}
                error={notificationsQuery.error}
                onRetry={() => notificationsQuery.refetch()}
                errorFallbackMessage="Failed to fetch notifications"
              >
                <NotificationPanel notifications={notifications} />
              </DashboardStateBoundary>
            </CardBody>
          </Card>
        </div>
      </DashboardSection>

      {/* System integrity: one compact strip, with the detail on the ledger page. */}
      <DashboardSection title="System Integrity" titleId="dashboard-system-integrity">
        <DashboardStateBoundary
          isError={blockchainQuery.isError}
          error={blockchainQuery.error}
          onRetry={() => blockchainQuery.refetch()}
          errorFallbackMessage="Failed to fetch blockchain status"
        >
          <BlockchainStatusStrip
            status={blockchainStatus}
            loading={blockchainQuery.isLoading}
          />
        </DashboardStateBoundary>
      </DashboardSection>

      {/* Administrative statistics sit last: lowest business importance, and
          collapsed by default for everyone except Administrators. */}
      <DashboardSection className="mb-0">
        <AdminStatsSection />
      </DashboardSection>
    </div>
  );
}
