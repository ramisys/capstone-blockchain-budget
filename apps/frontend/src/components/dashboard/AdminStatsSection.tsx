import { useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { DashboardStateBoundary } from './DashboardSection';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardCharts, useDashboardStats } from '../../hooks/useDashboard';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { formatNumber } from '../../utils/format';
import type { DashboardStats } from '../../types/dashboard';

const PANEL_ID = 'dashboard-admin-stats-panel';

/**
 * Role colours keyed by the *display* label the API sends (dashboardService
 * formats the enum through `formatRole`). Keying by name rather than array
 * position means a role with zero users — which is simply absent from the
 * response — no longer shifts every other role's colour.
 *
 * Values mirror the design tokens; Recharts writes `fill` as an SVG
 * presentation attribute, which does not resolve CSS custom properties.
 * Auditor uses --color-warning rather than --color-accent, whose gold is too
 * light to hold 3:1 against white.
 */
const ROLE_COLORS: Record<string, string> = {
  [ROLE_LABELS[ROLES.ADMINISTRATOR]]: '#1B3A5C',
  [ROLE_LABELS[ROLES.TREASURER]]: '#2E6B8A',
  [ROLE_LABELS[ROLES.BUDGET_OFFICER]]: '#2C5282',
  [ROLE_LABELS[ROLES.AUDITOR]]: '#C99200',
};

const FALLBACK_ROLE_COLOR = '#8B93A0';

interface StatItem {
  key: keyof DashboardStats;
  label: string;
  to?: string;
  /** Roles allowed to follow `to`. Empty means everyone; omitted means no link. */
  roles?: string[];
}

const USER_STATS: StatItem[] = [
  { key: 'totalUsers', label: 'Total Users', to: '/users', roles: [ROLES.ADMINISTRATOR] },
  { key: 'activeUsers', label: 'Active Users', to: '/users', roles: [ROLES.ADMINISTRATOR] },
  { key: 'inactiveUsers', label: 'Inactive Users', to: '/users', roles: [ROLES.ADMINISTRATOR] },
];

const MASTER_DATA_STATS: StatItem[] = [
  { key: 'fiscalYears', label: 'Fiscal Years', to: '/budget-allocation/fiscal-years', roles: [] },
  { key: 'fundSources', label: 'Fund Sources', to: '/budget-allocation/fund-sources', roles: [] },
  { key: 'departments', label: 'Departments', to: '/budget-allocation/departments', roles: [] },
  {
    key: 'budgetCategories',
    label: 'Budget Categories',
    to: '/budget-allocation/budget-categories',
    roles: [],
  },
  {
    key: 'budgetPrograms',
    label: 'Budget Programs',
    to: '/budget-allocation/budget-programs',
    roles: [],
  },
];

function StatTile({
  label,
  value,
  to,
}: {
  label: string;
  value: string;
  to?: string;
}) {
  const body = (
    <>
      <span className="block text-xs font-medium text-slate-500 truncate">{label}</span>
      <span className="block text-lg font-bold text-slate-900 tabular-nums">{value}</span>
    </>
  );

  const shell =
    'rounded-xl border border-slate-100 bg-slate-50/80 p-3 min-w-0 block';

  if (!to) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <Link
      to={to}
      className={`${shell} transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30`}
    >
      {body}
    </Link>
  );
}

function StatGrid({
  items,
  stats,
  canFollow,
}: {
  items: StatItem[];
  stats?: DashboardStats;
  canFollow: (item: StatItem) => boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item) => (
        <StatTile
          key={item.key}
          label={item.label}
          value={formatNumber(stats?.[item.key] ?? 0)}
          to={canFollow(item) ? item.to : undefined}
        />
      ))}
    </div>
  );
}

/**
 * System administration: user counts, master-data counts, and the user-by-role
 * distribution.
 *
 * Collapsed by default for everyone except Administrators — these figures
 * matter to whoever manages the system, and sit below the financial content
 * for everyone else rather than being removed from their reach.
 */
export function AdminStatsSection() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(ROLES.ADMINISTRATOR);
  const [open, setOpen] = useState(isAdmin);
  const reducedMotion = usePrefersReducedMotion();

  const statsQuery = useDashboardStats();
  const chartsQuery = useDashboardCharts();

  const stats = statsQuery.data;
  const usersByRole = chartsQuery.data?.usersByRole ?? [];

  const canFollow = (item: StatItem) =>
    Boolean(item.to) && (item.roles?.length === 0 || hasRole(...(item.roles ?? [])));

  const chartHeight = Math.max(160, usersByRole.length * 38 + 32);

  return (
    <Card className="h-full">
      <CardHeader className="p-0">
        {/* Disclosure pattern: the heading wraps the control rather than
            containing one, since <button> takes phrasing content only. */}
        <h2 className="m-0">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls={PANEL_ID}
            className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 rounded-2xl"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                System Administration
              </span>
              <span className="block text-xs font-normal text-slate-500 mt-0.5">
                User accounts, master data, and role distribution
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </h2>
      </CardHeader>

      {open && (
        <CardBody id={PANEL_ID} className="p-6 space-y-6">
          <DashboardStateBoundary
            isLoading={statsQuery.isLoading}
            isError={statsQuery.isError}
            error={statsQuery.error}
            onRetry={() => statsQuery.refetch()}
            errorFallbackMessage="Failed to fetch stats"
            loadingFallback={
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((tile) => (
                  <Skeleton key={tile} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  User Accounts
                </h3>
                <StatGrid items={USER_STATS} stats={stats} canFollow={canFollow} />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Budget Allocation Setup
                </h3>
                <StatGrid items={MASTER_DATA_STATS} stats={stats} canFollow={canFollow} />
              </div>
            </div>
          </DashboardStateBoundary>

          <DashboardStateBoundary
            isLoading={chartsQuery.isLoading}
            isError={chartsQuery.isError}
            error={chartsQuery.error}
            onRetry={() => chartsQuery.refetch()}
            errorFallbackMessage="Failed to fetch charts data"
            loadingFallback={<Skeleton className="h-40 w-full rounded-xl" />}
          >
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Users by Role
              </h3>
              {usersByRole.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No data available</p>
              ) : (
                <>
                  <div
                    role="img"
                    aria-label={`Users by role: ${usersByRole
                      .map((entry) => `${entry.role} ${entry.count}`)
                      .join(', ')}`}
                  >
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart
                        data={usersByRole}
                        layout="vertical"
                        margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                      >
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: '#5E6674' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="role"
                          width={110}
                          tick={{ fontSize: 11, fill: '#5E6674' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(27, 58, 92, 0.06)' }}
                          formatter={(value: number) => [
                            `${formatNumber(value)} user${value === 1 ? '' : 's'}`,
                            'Users',
                          ]}
                        />
                        <Bar
                          dataKey="count"
                          barSize={18}
                          radius={[0, 4, 4, 0]}
                          isAnimationActive={!reducedMotion}
                        >
                          {usersByRole.map((entry) => (
                            <Cell
                              key={entry.role}
                              fill={ROLE_COLORS[entry.role] ?? FALLBACK_ROLE_COLOR}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <table className="sr-only">
                    <caption>Users by role</caption>
                    <thead>
                      <tr>
                        <th scope="col">Role</th>
                        <th scope="col">Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersByRole.map((entry) => (
                        <tr key={entry.role}>
                          <th scope="row">{entry.role}</th>
                          <td>{entry.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </DashboardStateBoundary>
        </CardBody>
      )}
    </Card>
  );
}

export default AdminStatsSection;
