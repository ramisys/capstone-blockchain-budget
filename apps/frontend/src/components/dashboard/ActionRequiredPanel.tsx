import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  FileEdit,
  Link2,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { ALLOCATION_STATUS } from '../../constants/allocationStatus';
import { formatNumber } from '../../utils/format';
import type { AllocationStatistics } from '../../types/allocation';
import type { BlockchainStatus } from '../../types/blockchain';

const ALLOCATIONS_PATH = '/budget-allocation/allocations';
const LEDGER_PATH = '/budget-allocation/blockchain';

/** Roles that can decide on a submitted allocation (mirrors the backend). */
const APPROVAL_ROLES = [ROLES.ADMINISTRATOR, ROLES.TREASURER];
/** Roles that can author and revise allocations (mirrors the backend). */
const AUTHORING_ROLES = [ROLES.ADMINISTRATOR, ROLES.BUDGET_OFFICER];

interface ActionItem {
  key: string;
  label: string;
  description: string;
  count: number;
  to: string;
  icon: LucideIcon;
  accent: string;
  /** Roles that can act on this item. Empty means every role sees it. */
  roles: string[];
}

interface ActionRequiredPanelProps {
  statistics?: AllocationStatistics;
  /** Optional enrichment: omitted entirely when the ledger status is unavailable. */
  blockchain?: BlockchainStatus;
  loading?: boolean;
  /** Describes the fiscal-year scope the counts were measured in. */
  scopeLabel?: string;
}

/**
 * "What needs my attention?" — the workflow queues a user can actually act on.
 *
 * Rows are filtered by role so the panel only ever offers work the signed-in
 * user is permitted to do, and rows with a zero count are hidden so the panel
 * never pads itself with non-work.
 */
export function ActionRequiredPanel({
  statistics,
  blockchain,
  loading = false,
  scopeLabel,
}: ActionRequiredPanelProps) {
  const { hasRole } = useAuth();

  const ledgerAttention =
    (blockchain?.pendingCount ?? 0) + (blockchain?.failedCount ?? 0);

  const items: ActionItem[] = [
    {
      key: 'pendingApproval',
      label: 'Pending approval',
      description: 'Allocations waiting on a decision',
      count: statistics?.pendingApprovalCount ?? 0,
      to: `${ALLOCATIONS_PATH}?status=${ALLOCATION_STATUS.PENDING_APPROVAL}`,
      icon: Clock,
      accent: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
      roles: APPROVAL_ROLES,
    },
    {
      key: 'draft',
      label: 'Draft allocations',
      description: 'Not yet submitted for approval',
      count: statistics?.draftCount ?? 0,
      to: `${ALLOCATIONS_PATH}?status=${ALLOCATION_STATUS.DRAFT}`,
      icon: FileEdit,
      accent: 'bg-[var(--color-bg)] text-[var(--color-text-secondary)]',
      roles: AUTHORING_ROLES,
    },
    {
      key: 'rejected',
      label: 'Rejected allocations',
      description: 'Returned and needing revision',
      count: statistics?.rejectedCount ?? 0,
      to: `${ALLOCATIONS_PATH}?status=${ALLOCATION_STATUS.REJECTED}`,
      icon: XCircle,
      accent: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
      roles: AUTHORING_ROLES,
    },
    {
      key: 'ledger',
      label: 'Ledger records to review',
      description: 'Anchors still pending or failed',
      count: ledgerAttention,
      to: LEDGER_PATH,
      icon: Link2,
      accent: 'bg-[var(--color-secondary-bg)] text-[var(--color-secondary)]',
      roles: [],
    },
  ];

  const visibleItems = items.filter(
    (item) =>
      item.count > 0 && (item.roles.length === 0 || hasRole(...item.roles))
  );

  return (
    <Card className="p-6 h-full border-slate-200/80">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">Action Required</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          {scopeLabel ? `Open items · ${scopeLabel}` : 'Open items awaiting action'}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2
            className="w-8 h-8 text-[var(--color-success)] mb-2"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-900">
            Nothing needs your attention
          </p>
          <p className="text-xs text-slate-500 mt-1">
            No open items you can act on{scopeLabel ? ` in ${scopeLabel}` : ''}.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
                >
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.accent}`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 grow">
                    <span className="block text-sm font-semibold text-slate-900">
                      {item.label}
                    </span>
                    <span className="block text-xs text-slate-500 truncate">
                      {item.description}
                    </span>
                  </span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums shrink-0">
                    {formatNumber(item.count)}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 text-slate-400 shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default ActionRequiredPanel;
