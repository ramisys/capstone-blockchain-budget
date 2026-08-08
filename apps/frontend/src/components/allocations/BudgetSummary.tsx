import React from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { formatCurrency } from '../../utils/format';
import type { BudgetSummary as BudgetSummaryData } from '../../types/allocation';

interface BudgetSummaryProps {
  data?: BudgetSummaryData;
  loading?: boolean;
  /** Overrides the default "across fiscal years" caption with the real scope. */
  subtitle?: string;
  /**
   * Renders the utilization bar as two labelled segments (allocated vs
   * remaining) instead of a single fill. Off by default so existing callers
   * keep their current appearance.
   */
  segmented?: boolean;
  /** Optional clarifying note rendered under the bar. */
  footnote?: string;
}

/**
 * Reusable budget summary showing total budget, total allocated, and remaining
 * budget with a utilization progress bar.
 */
const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  data,
  loading = false,
  subtitle = 'Budget utilization across fiscal years',
  segmented = false,
  footnote,
}) => {
  const totalBudget = data?.totalBudget ?? 0;
  const totalAllocated = data?.totalAllocated ?? 0;
  const remainingBudget = data?.remainingBudget ?? 0;

  const utilization =
    totalBudget > 0 ? Math.min(100, Math.max(0, (totalAllocated / totalBudget) * 100)) : 0;

  const progressColor =
    utilization >= 90
      ? 'bg-red-500'
      : utilization >= 70
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  const statCard = (label: string, value: string) => (
    <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );

  return (
    <Card className="p-6 sm:p-7 h-full border-slate-200/80">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Budget Summary</h3>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {!loading && (
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            {utilization.toFixed(1)}% Utilized
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {loading ? (
          [1, 2, 3].map((item) => (
            <div key={item} className="rounded-xl bg-slate-50/80 border border-slate-100 p-4 space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-6 w-28 rounded" />
            </div>
          ))
        ) : (
          <>
            {statCard('Total Budget', formatCurrency(totalBudget))}
            {statCard('Approved Allocations', formatCurrency(totalAllocated))}
            {statCard('Remaining Budget', formatCurrency(remainingBudget))}
          </>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
          <span>Budget Utilization</span>
          {loading ? <Skeleton className="h-3 w-12 rounded" /> : <span>{utilization.toFixed(1)}%</span>}
        </div>
        <div
          className={`${segmented ? 'h-4' : 'h-3'} w-full bg-slate-100 rounded-full overflow-hidden`}
        >
          {loading ? (
            <div className="h-full w-full bg-slate-100" />
          ) : (
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${utilization}%` }}
              role="progressbar"
              aria-valuenow={Math.round(utilization)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Budget utilization"
            />
          )}
        </div>

        {segmented && !loading ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span
                className={`h-2 w-2 rounded-full ${progressColor}`}
                aria-hidden="true"
              />
              Allocated {formatCurrency(totalAllocated)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-200" aria-hidden="true" />
              Remaining {formatCurrency(remainingBudget)}
            </span>
            <span className="text-slate-500">
              of {formatCurrency(totalBudget)} total
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>{formatCurrency(totalAllocated)} approved</span>
            <span>{formatCurrency(totalBudget)} total budget</span>
          </div>
        )}

        {footnote && (
          <p className="mt-3 text-xs text-slate-500">{footnote}</p>
        )}
      </div>
    </Card>
  );
};

export { BudgetSummary };
export default BudgetSummary;
