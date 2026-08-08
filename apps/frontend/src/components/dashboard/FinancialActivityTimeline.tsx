import React from 'react';
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
import { formatDateTime } from '../../utils/format';
import { FileText, Landmark, Link2, ScrollText } from 'lucide-react';
import type { TimelineKind } from '../../types/timeline';

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

interface FinancialActivityTimelineProps {
  className?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

const filterButtonClass = (active: boolean): string =>
  `px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
    active
      ? 'bg-indigo-600 text-white border-indigo-600'
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
      <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
        <h6 className="mb-0 text-sm font-semibold text-slate-500">Financial Activity</h6>
        <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter timeline by type">
          {KIND_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
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
          <div className="max-h-96 overflow-y-auto pr-1 timeline-scroll">
            {entries.map((entry) => {
              const Icon = KIND_ICONS[entry.kind] ?? ScrollText;
              return (
                <div
                  key={`${entry.kind}-${entry.id}`}
                  className="relative flex items-start gap-3 pb-4 last:pb-0 timeline-entry"
                >
                  <div className="shrink-0 mt-0.5">
                    <Badge variant={TIMELINE_KIND_VARIANTS[entry.kind] ?? 'secondary'}>
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{TIMELINE_KIND_LABELS[entry.kind] ?? entry.kind}</span>
                    </Badge>
                  </div>
                  <div className="min-w-0 grow">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{entry.label}</p>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-slate-600 truncate">{entry.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {entry.actor?.name && <span>{entry.actor.name}</span>}
                      {entry.actor?.email && <span className="text-slate-400">{entry.actor.email}</span>}
                      {entry.resourceCode && (
                        <span className="font-mono text-indigo-600">{entry.resourceCode}</span>
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
