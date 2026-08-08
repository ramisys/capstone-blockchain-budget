import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { RoleBadge } from '../ui/Badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/Select';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/format';
import type { FiscalYear } from '../../hooks/useFiscalYears';

/** Sentinel for the "no fiscal year filter" option (Radix forbids empty values). */
export const ALL_FISCAL_YEARS = '__all__';

interface DashboardHeaderProps {
  fiscalYears: FiscalYear[];
  /** `undefined` means every fiscal year is in scope. */
  selectedFiscalYearId?: string;
  onFiscalYearChange: (fiscalYearId: string | undefined) => void;
  fiscalYearsLoading?: boolean;
  /** Epoch ms of the most recent successful dashboard fetch. */
  lastUpdatedAt?: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

/**
 * Dashboard page header: identity, the fiscal-year scope that every financial
 * figure below is measured against, data freshness, and a manual refresh.
 */
export function DashboardHeader({
  fiscalYears,
  selectedFiscalYearId,
  onFiscalYearChange,
  fiscalYearsLoading = false,
  lastUpdatedAt,
  onRefresh,
  isRefreshing = false,
}: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <p className="mb-0 text-sm text-slate-500">
            {user?.fullName ? `Welcome back, ${user.fullName}.` : 'Welcome back.'}
          </p>
          {user?.role && <RoleBadge role={user.role} />}
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:items-end">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedFiscalYearId ?? ALL_FISCAL_YEARS}
            onValueChange={(value) =>
              onFiscalYearChange(value === ALL_FISCAL_YEARS ? undefined : value)
            }
            disabled={fiscalYearsLoading}
          >
            <SelectTrigger className="w-full sm:w-56" aria-label="Fiscal year scope">
              <SelectValue placeholder="All fiscal years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FISCAL_YEARS}>All Fiscal Years</SelectItem>
              {fiscalYears.map((fiscalYear) => (
                <SelectItem key={fiscalYear.id} value={fiscalYear.id}>
                  {fiscalYear.code}
                  {fiscalYear.isActive ? ' (Active)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>

        {lastUpdatedAt ? (
          <p className="mb-0 text-xs text-slate-500" aria-live="polite">
            Updated {formatDateTime(new Date(lastUpdatedAt).toISOString())}
          </p>
        ) : null}
      </div>
    </header>
  );
}

export default DashboardHeader;
