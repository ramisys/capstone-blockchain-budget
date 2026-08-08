import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import {
  DashboardSection,
  DashboardStateBoundary,
} from '../components/dashboard/DashboardSection';
import { FinancialStatCard } from '../components/dashboard/FinancialStatCard';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { FinancialActivityTimeline } from '../components/dashboard/FinancialActivityTimeline';
import {
  useDashboardCharts,
  useDashboardNotifications,
  useDashboardStats,
} from '../hooks/useDashboard';
import { useBlockchainStatus } from '../hooks/useBlockchain';
import { useRemainingBudget } from '../hooks/useAllocations';
import { useFiscalYears } from '../hooks/useFiscalYears';
import { formatCurrency, formatDateTime, formatNumber } from '../utils/format';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Banknote, Bell, Landmark, PieChart as PieChartIcon, PiggyBank } from 'lucide-react';
import type { ReactNode } from 'react';
import type { DashboardNotificationType, DashboardStats } from '../types/dashboard';

/** Master-data page size used to populate the fiscal-year scope selector. */
const FISCAL_YEAR_OPTIONS_LIMIT = 100;

const COLORS = [
  '#2563EB', // Administrator
  '#10B981', // Budget Officer
  '#F59E0B', // Treasurer
  '#EF4444', // Auditor
];

interface StatCardConfig {
  key: keyof DashboardStats;
  label: string;
  caption: string;
  valueClassName: string;
}

const USER_STAT_CARDS: StatCardConfig[] = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    caption: 'Total registered users',
    valueClassName: 'text-slate-900',
  },
  {
    key: 'activeUsers',
    label: 'Active Users',
    caption: 'Currently active',
    valueClassName: 'text-[var(--color-success)]',
  },
  {
    key: 'inactiveUsers',
    label: 'Inactive Users',
    caption: 'Inactive or suspended',
    valueClassName: 'text-[var(--color-error)]',
  },
];

const SETUP_STAT_CARDS: StatCardConfig[] = [
  {
    key: 'fiscalYears',
    label: 'Fiscal Years',
    caption: 'Configure fiscal periods',
    valueClassName: 'text-blue-600',
  },
  {
    key: 'fundSources',
    label: 'Fund Sources',
    caption: 'Track funding sources',
    valueClassName: 'text-green-600',
  },
  {
    key: 'departments',
    label: 'Departments',
    caption: 'Manage organizational units',
    valueClassName: 'text-yellow-600',
  },
  {
    key: 'budgetCategories',
    label: 'Budget Categories',
    caption: 'Categorize budget allocations',
    valueClassName: 'text-purple-600',
  },
  {
    key: 'budgetPrograms',
    label: 'Budget Programs',
    caption: 'Define budget programs',
    valueClassName: 'text-indigo-600',
  },
];

const NOTIFICATION_ACCENTS: Record<DashboardNotificationType, string> = {
  success: 'bg-green-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

const notificationAccent = (type: DashboardNotificationType): string =>
  NOTIFICATION_ACCENTS[type] ?? 'bg-gray-500';

interface StatCardProps {
  label: string;
  children: ReactNode;
}

/** Card shell shared by the real stat cards and their loading placeholders. */
function StatCardShell({ label, children }: StatCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <h6 className="mb-0 text-sm font-semibold text-slate-500">{label}</h6>
      </CardHeader>
      <CardBody className="text-center">{children}</CardBody>
    </Card>
  );
}

function StatCard({
  label,
  value,
  caption,
  valueClassName,
}: {
  label: string;
  value: string;
  caption: string;
  valueClassName: string;
}) {
  return (
    <StatCardShell label={label}>
      <h2 className={`text-3xl font-bold mb-2 ${valueClassName}`}>{value}</h2>
      <p className="text-sm text-slate-500">{caption}</p>
    </StatCardShell>
  );
}

function StatCardSkeletons({ cards }: { cards: StatCardConfig[] }) {
  return (
    <>
      {cards.map((card) => (
        <StatCardShell key={card.key} label={card.label}>
          <Spinner size="sm" className="mx-auto my-4 block" />
        </StatCardShell>
      ))}
    </>
  );
}

/** Card shell used by both chart cards, so the loading state keeps the layout. */
function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <h6 className="mb-0 text-sm font-semibold text-slate-500">{title}</h6>
      </CardHeader>
      <CardBody className="p-0">{children}</CardBody>
    </Card>
  );
}

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

  const stats = statsQuery.data;
  const chartsData = chartsQuery.data;
  const notifications = notificationsQuery.data ?? [];
  const blockchainStatus = blockchainQuery.data;
  const budget = budgetQuery.data;

  const usersByRole = chartsData?.usersByRole ?? [];
  const usersByStatus = chartsData?.usersByStatus ?? [];

  const statValue = (key: keyof DashboardStats): string =>
    formatNumber(stats?.[key] ?? 0);

  const totalBudget = budget?.totalBudget ?? 0;
  const totalAllocated = budget?.totalAllocated ?? 0;

  // While the fiscal years are still loading the budget query is deliberately
  // disabled, which React Query reports as "not loading" — keep the cards in
  // their skeleton state across both steps instead of flashing zero.
  const budgetLoading = fiscalYearsQuery.isLoading || budgetQuery.isLoading;

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
    ].filter((value) => value > 0);
    return timestamps.length > 0 ? Math.max(...timestamps) : undefined;
  }, [
    statsQuery.dataUpdatedAt,
    chartsQuery.dataUpdatedAt,
    notificationsQuery.dataUpdatedAt,
    blockchainQuery.dataUpdatedAt,
    budgetQuery.dataUpdatedAt,
  ]);

  const isRefreshing =
    statsQuery.isFetching ||
    chartsQuery.isFetching ||
    notificationsQuery.isFetching ||
    blockchainQuery.isFetching ||
    budgetQuery.isFetching;

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

      {/* User statistics and budget allocation setup counts. Both grids are fed
          by the same /dashboard/stats request, so they share one boundary and a
          failure surfaces once rather than in every card. */}
      <DashboardSection>
        <DashboardStateBoundary
          isLoading={statsQuery.isLoading}
          isError={statsQuery.isError}
          error={statsQuery.error}
          onRetry={() => statsQuery.refetch()}
          errorFallbackMessage="Failed to fetch stats"
          loadingFallback={
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCardSkeletons cards={USER_STAT_CARDS} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Budget Allocation Setup
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCardSkeletons cards={SETUP_STAT_CARDS} />
                </div>
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {USER_STAT_CARDS.map((card) => (
                <StatCard
                  key={card.key}
                  label={card.label}
                  value={statValue(card.key)}
                  caption={card.caption}
                  valueClassName={card.valueClassName}
                />
              ))}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Budget Allocation Setup
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {SETUP_STAT_CARDS.map((card) => (
                  <StatCard
                    key={card.key}
                    label={card.label}
                    value={statValue(card.key)}
                    caption={card.caption}
                    valueClassName={card.valueClassName}
                  />
                ))}
              </div>
            </div>
          </div>
        </DashboardStateBoundary>
      </DashboardSection>

      {/* Charts */}
      <DashboardSection>
        <DashboardStateBoundary
          isLoading={chartsQuery.isLoading}
          isError={chartsQuery.isError}
          error={chartsQuery.error}
          onRetry={() => chartsQuery.refetch()}
          errorFallbackMessage="Failed to fetch charts data"
          loadingFallback={
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartCard title="Users by Role">
                <Spinner size="sm" className="mx-auto my-4 block" />
              </ChartCard>
              <ChartCard title="Users by Status">
                <Spinner size="sm" className="mx-auto my-4 block" />
              </ChartCard>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Users by Role - Pie Chart */}
            <ChartCard title="Users by Role">
              {usersByRole.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usersByRole}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      label={({ cx, cy, midAngle, outerRadius, role, value }: any) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 20;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#374151"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            fontSize={13}
                          >
                            {`${role}: ${value}`}
                          </text>
                        );
                      }}
                      labelLine={false}
                    >
                      {usersByRole.map((entry, index) => (
                        <Cell key={entry.role} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>

                    <Tooltip formatter={(value, name) => [`${value} users`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-4">No data available</p>
              )}
            </ChartCard>

            {/* Users by Status - Bar Chart */}
            <ChartCard title="Users by Status">
              {usersByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usersByStatus}>
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="count" fill="#4361ee" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-4">No data available</p>
              )}
            </ChartCard>
          </div>
        </DashboardStateBoundary>
      </DashboardSection>

      {/* Financial Activity Timeline and Notifications */}
      <DashboardSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <FinancialActivityTimeline />
          </div>

          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <h6 className="mb-0 text-sm font-semibold text-slate-500">
                  Notifications
                </h6>
                <a href="#" className="text-sm text-slate-500 no-underline">
                  View All
                </a>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <DashboardStateBoundary
                isLoading={notificationsQuery.isLoading}
                isError={notificationsQuery.isError}
                error={notificationsQuery.error}
                onRetry={() => notificationsQuery.refetch()}
                errorFallbackMessage="Failed to fetch notifications"
                isEmpty={notifications.length === 0}
                emptyMessage="No notifications"
              >
                <div className="notification-list">
                  {notifications.map((notification, index) => (
                    <div key={index} className="flex items-start mb-3">
                      <div className="shrink-0 mr-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${notificationAccent(
                            notification.type
                          )}`}
                        >
                          <Bell className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="grow min-w-0">
                        <div className="font-medium text-slate-900">
                          {notification.title}
                        </div>
                        <div className="text-sm text-slate-500 line-clamp-2">
                          {notification.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardStateBoundary>
            </CardBody>
          </Card>
        </div>
      </DashboardSection>

      {/* Blockchain Status */}
      <Card className="h-full">
        <CardHeader className="pb-4">
          <h6 className="mb-0 text-sm font-semibold text-slate-500">Blockchain Status</h6>
        </CardHeader>
        <CardBody className="text-center">
          <DashboardStateBoundary
            isLoading={blockchainQuery.isLoading}
            isError={blockchainQuery.isError}
            error={blockchainQuery.error}
            onRetry={() => blockchainQuery.refetch()}
            errorFallbackMessage="Failed to fetch blockchain status"
          >
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              {blockchainStatus?.connected ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Badge variant="danger">Disconnected</Badge>
              )}
              <Badge variant="secondary">
                Network: {blockchainStatus?.network ?? 'Unknown'}
              </Badge>
            </div>
            <div className="mb-2">
              <span className="text-xs text-slate-500">
                Latest Block:{' '}
                {blockchainStatus?.latestBlock != null
                  ? formatNumber(blockchainStatus.latestBlock)
                  : '—'}
              </span>
            </div>
            <div className="mb-2">
              <span className="text-xs text-slate-500">
                Last Sync:{' '}
                {blockchainStatus?.lastSync
                  ? formatDateTime(blockchainStatus.lastSync)
                  : 'Never'}
              </span>
            </div>
            <div className="mb-2">
              <span className="text-xs text-slate-500">
                Smart Contract: {blockchainStatus?.contractAddress ?? '—'}
              </span>
            </div>
          </DashboardStateBoundary>
        </CardBody>
      </Card>
    </div>
  );
}
