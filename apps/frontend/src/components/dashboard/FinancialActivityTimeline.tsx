import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import Pagination from '../ui/Pagination';
import { useFinancialTimeline } from '../../hooks/useFinancialTimeline';
import {
  TIMELINE_KIND,
  TIMELINE_KIND_LABELS,
  TIMELINE_KIND_VARIANTS,
  TIMELINE_KIND_LIST,
} from '../../constants/timeline';
import { AUDIT_ACTION_LABELS } from '../../constants/auditActions';
import { formatDateTime, formatRelativeTime } from '../../utils/format';
import { FileText, Landmark, Link2, ScrollText } from 'lucide-react';
import type { TimelineEntry, TimelineKind } from '../../types/timeline';

const KIND_ICONS = {
  [TIMELINE_KIND.ALLOCATION_APPROVAL]: Landmark,
  [TIMELINE_KIND.DOCUMENT_ACTIVITY]: FileText,
  [TIMELINE_KIND.AUDIT_LOG]: ScrollText,
  [TIMELINE_KIND.BLOCKCHAIN_RECORD]: Link2,
};

type KindFilterValue = TimelineKind | 'All';

const KIND_FILTERS: Array<{ value: KindFilterValue; label: string }> = [
  { value: 'All', label: 'All' },
  ...TIMELINE_KIND_LIST.map((kind) => ({ value: kind, label: TIMELINE_KIND_LABELS[kind] })),
];

/**
 * Last-resort readability pass for an audit action with no mapped label, so a
 * newly added backend action never surfaces here as SCREAMING_SNAKE_CASE.
 * `DOCUMENT_ANCHOR_RETRY` becomes "Document anchor retry".
 */
function humanizeActionToken(action: string): string {
  const words = action.toLowerCase().split('_').filter(Boolean);
  if (words.length === 0) return '';
  return `${words[0].charAt(0).toUpperCase()}${words[0].slice(1)}${
    words.length > 1 ? ` ${words.slice(1).join(' ')}` : ''
  }`;
}

/**
 * Dashboard-facing label for a timeline entry.
 *
 * Audit entries arrive with `label` set to the raw action name, which is the
 * right form inside the audit trail but not on a dashboard. Other kinds are
 * already normalized by the backend and pass through untouched.
 */
function entryLabel(entry: TimelineEntry): string {
  if (entry.kind !== TIMELINE_KIND.AUDIT_LOG || !entry.action) {
    return entry.label;
  }
  return (
    AUDIT_ACTION_LABELS[entry.action] ||
    humanizeActionToken(entry.action) ||
    entry.label
  );
}

interface FinancialActivityTimelineProps {
  className?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

const filterButtonClass = (active: boolean): string =>
  `px-3 py-1 rounded-full text-xs font-semibold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 ${
    active
      ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] border-[var(--color-primary)]'
      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
  }`;

export function FinancialActivityTimeline({
  className = '',
  dateFrom,
  dateTo,
  limit = 20,
}: FinancialActivityTimelineProps) {
  const [kind, setKind] = React.useState<KindFilterValue>('All');
  const [page, setPage] = React.useState(1);

  const params: Record<string, unknown> = { page, limit };
  if (kind !== 'All') params.kind = kind;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const { data, isLoading, isError, error } = useFinancialTimeline(params as any);

  const entries = data?.timeline ?? [];
  const pagination = data?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 };

  const handleKindChange = (next: KindFilterValue) => {
    setKind(next);
    setPage(1);
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h6 className="mb-0 text-sm font-semibold text-slate-500">Financial Activity</h6>
          <Link
            to="/audit"
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            View audit trail →
          </Link>
        </div>
        <div
          className="flex items-center gap-1.5 flex-wrap"
          role="group"
          aria-label="Filter timeline by type"
        >
          {KIND_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={kind === filter.value}
              className={filterButtonClass(kind === filter.value)}
              onClick={() => handleKindChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardBody className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : isError ? (
          <Alert variant="danger">{error?.message || 'Failed to load financial activity'}</Alert>
        ) : entries.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No recent activity</p>
        ) : (
          /* No inner scroll container: the page owns the only scrollbar and the
             paginator below owns the length. */
          <div>
            {entries.map((entry) => {
              const Icon = KIND_ICONS[entry.kind] ?? ScrollText;
              return (
                <div
                  key={`${entry.kind}-${entry.id}`}
                  className="relative flex items-start gap-3 pb-4 last:pb-0"
                >
                  <div className="shrink-0 mt-0.5">
                    <Badge variant={TIMELINE_KIND_VARIANTS[entry.kind] ?? 'secondary'}>
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{TIMELINE_KIND_LABELS[entry.kind] ?? entry.kind}</span>
                    </Badge>
                  </div>
                  <div className="min-w-0 grow">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {entryLabel(entry)}
                      </p>
                      <time
                        dateTime={entry.createdAt}
                        title={formatDateTime(entry.createdAt)}
                        className="text-xs text-slate-500 whitespace-nowrap"
                      >
                        {formatRelativeTime(entry.createdAt)}
                      </time>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-slate-600 truncate">{entry.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {entry.actor?.name && <span>{entry.actor.name}</span>}
                      {entry.actor?.email && <span className="text-slate-500">{entry.actor.email}</span>}
                      {entry.resourceCode && (
                        <span className="font-mono text-[var(--color-primary)]">
                          {entry.resourceCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>

      {entries.length > 0 && pagination.totalPages > 1 && (
        <CardFooter>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.limit}
            onPageChange={setPage}
            label="activities"
          />
        </CardFooter>
      )}
    </Card>
  );
}

export default FinancialActivityTimeline;
