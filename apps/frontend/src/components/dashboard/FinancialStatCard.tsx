import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

interface FinancialStatCardProps {
  title: string;
  /** Pre-formatted display string, e.g. the output of `formatCurrency`. */
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconClassName?: string;
  loading?: boolean;
}

/**
 * Compact KPI card for monetary figures.
 *
 * Unlike the general-purpose `StatisticsCard`, the value here is never
 * truncated: the icon sits on the title row so the amount owns the card's full
 * width, and it wraps rather than clipping if it still runs long. Digits use
 * tabular figures so amounts line up across the row.
 */
export function FinancialStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName = 'bg-[var(--color-primary-bg)] text-[var(--color-primary)]',
  loading = false,
}: FinancialStatCardProps) {
  return (
    <Card className="p-4 h-full border-slate-200/80" aria-busy={loading}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 truncate">
          {title}
        </p>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClassName}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-6 w-28 rounded-md" />
      ) : (
        <p
          className="text-xl font-bold text-slate-900 tabular-nums leading-tight break-words"
          title={value}
        >
          {value}
        </p>
      )}

      {subtitle && !loading && (
        <p className="text-xs text-slate-500 mt-1 truncate" title={subtitle}>
          {subtitle}
        </p>
      )}
    </Card>
  );
}

export default FinancialStatCard;
