import React, { useState } from 'react';
import { useAuditLogs, useAuditLogSummary, useAuditLog, useRetryAuditLog } from '../../hooks/useAuditLogs';
import { useListControls } from '../../hooks/useListControls';
import { useAuditLogFilters } from '../../hooks/useAuditLogFilters';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/Select';
import { AuditLogsTable } from '../../components/audit/AuditLogsTable';
import { AuditResultBadge } from '../../components/audit/AuditResultBadge';
import { AuditAnchorStatusBadge } from '../../components/audit/AuditAnchorStatusBadge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { AUDIT_ACTION_LIST, AUDIT_ACTION_LABELS } from '../../constants/auditActions';
import {
  AUDIT_RESULT_LIST,
  AUDIT_RESULT_LABELS,
  AUDIT_ANCHOR_STATUS_LIST,
  AUDIT_ANCHOR_STATUS_LABELS,
} from '../../constants/audit';
import { formatNumber, formatDateTime } from '../../utils/format';
import { ScrollText, ShieldCheck, XCircle, Clock, Loader2, ExternalLink, Link2, RefreshCw } from 'lucide-react';
import type { AuditLog } from '../../types/audit';

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ icon, label, value, sub, accent = 'bg-indigo-50 text-indigo-600' }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</h3>
        <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
    </div>
  </Card>
);

const shortHash = (value: string | null, length = 12): string => {
  if (!value) return '—';
  if (value.length <= length * 2 + 2) return value;
  return `${value.slice(0, length)}...${value.slice(-length)}`;
};

const ALL = '__all__';

const RETRY_ROLES = [ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER];

const isRetryable = (log: AuditLog): boolean =>
  log.anchorStatus === 'Pending' || log.anchorStatus === 'Failed';

export function AuditLogs() {
  const { search, setSearch, debouncedSearch, page, setPage, pageSize, sortBy, sortOrder } =
    useListControls({ initialSortBy: 'newest', initialSortOrder: 'desc' });

  const { filters, setFilter, resetFilters, hasActiveFilters } = useAuditLogFilters();

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { hasRole } = useAuth();
  const canRetry = hasRole(...RETRY_ROLES);

  const { data: summaryData, isLoading: isSummaryLoading, error: summaryError } = useAuditLogSummary();

  const {
    data: logsData,
    isLoading: isLogsLoading,
    isError: isLogsError,
    error: logsError,
  } = useAuditLogs(
    {
      search: debouncedSearch || undefined,
      ...filters,
    },
    { page, limit: pageSize },
    { sortBy, sortOrder }
  );

  const { data: detailLog, isLoading: isDetailLoading } = useAuditLog(selectedLogId ?? undefined);

  const { mutateAsync: retryLog, isPending: isRetrying } = useRetryAuditLog();

  const logs = logsData?.logs ?? [];
  const pagination = logsData?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 };

  const openDetail = (log: AuditLog) => setSelectedLogId(log.id);

  const handleRetry = (log: AuditLog) => {
    setRetryingId(log.id);
    retryLog(log.id)
      .catch(() => {
        // Error toast is handled by the mutation hook.
      })
      .finally(() => setRetryingId(null));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Audit Trail</h1>
            <p className="text-slate-500">
              Immutable, append-only record of system activity anchored to the blockchain
            </p>
          </div>
          {isSummaryLoading && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            icon={<ScrollText className="w-5 h-5" />}
            label="Total Entries"
            value={formatNumber(summaryData?.total ?? 0)}
            sub="Audit log entries recorded"
            accent="bg-indigo-50 text-indigo-600"
          />
          <StatusCard
            icon={<ShieldCheck className="w-5 h-5" />}
            label="Successful"
            value={formatNumber(summaryData?.successCount ?? 0)}
            sub="Operations succeeded"
            accent="bg-emerald-50 text-emerald-600"
          />
          <StatusCard
            icon={<XCircle className="w-5 h-5" />}
            label="Failed"
            value={formatNumber(summaryData?.failureCount ?? 0)}
            sub="Operations failed"
            accent="bg-red-50 text-red-600"
          />
          <StatusCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending Anchors"
            value={formatNumber(summaryData?.pendingAnchors ?? 0)}
            sub="Awaiting ledger confirmation"
            accent="bg-amber-50 text-amber-600"
          />
        </div>
        {summaryError && (
          <p className="text-sm text-red-600">
            {(summaryError as Error).message || 'Failed to load audit summary'}
          </p>
        )}

        {/* Filters */}
        <Card className="p-5 border-slate-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
            <div className="xl:col-span-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by action, actor, or resource..."
                className="w-full"
              />
            </div>
            <Select value={filters.action ?? ALL} onValueChange={(value) => setFilter('action', value === ALL ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Actions</SelectItem>
                {AUDIT_ACTION_LIST.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.result ?? ALL} onValueChange={(value) => setFilter('result', value === ALL ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Results</SelectItem>
                {AUDIT_RESULT_LIST.map((result) => (
                  <SelectItem key={result} value={result}>
                    {AUDIT_RESULT_LABELS[result]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.anchorStatus ?? ALL} onValueChange={(value) => setFilter('anchorStatus', value === ALL ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All anchor statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Anchor Statuses</SelectItem>
                {AUDIT_ANCHOR_STATUS_LIST.map((status) => (
                  <SelectItem key={status} value={status}>
                    {AUDIT_ANCHOR_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="From date"
                value={filters.dateFrom ?? ''}
                onChange={(event) => setFilter('dateFrom', event.target.value || undefined)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                type="date"
                aria-label="To date"
                value={filters.dateTo ?? ''}
                onChange={(event) => setFilter('dateTo', event.target.value || undefined)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="text-slate-500 hover:text-red-600"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Table */}
        <div className="space-y-4">
          {isLogsError ? (
            <Card className="p-6 text-sm text-red-600">
              {(logsError as Error).message || 'Failed to load audit logs'}
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <AuditLogsTable
                logs={logs}
                pagination={pagination}
                onView={openDetail}
                onPageChange={setPage}
                canRetry={canRetry}
                onRetry={handleRetry}
                retryingId={retryingId}
              />
              {isLogsLoading && logs.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading audit logs...
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={selectedLogId !== null} onOpenChange={(open) => !open && setSelectedLogId(null)}>
        <DialogContent className="w-full max-w-2xl p-0 gap-0 rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden max-h-[90vh] flex flex-col">
          <div className="px-7 py-5 border-b border-slate-100 bg-white flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Audit Log Details</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                {detailLog
                  ? `${AUDIT_ACTION_LABELS[detailLog.action] ?? detailLog.action} · ${formatDateTime(detailLog.createdAt)}`
                  : 'Immutable audit trail entry'}
              </DialogDescription>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
            {isDetailLoading ? (
              <div className="py-10 text-center text-sm text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading entry...
              </div>
            ) : detailLog ? (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <AuditResultBadge result={detailLog.result} />
                  <AuditAnchorStatusBadge status={detailLog.anchorStatus} />
                  {detailLog.blockNumber !== null && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                      Block #{formatNumber(detailLog.blockNumber)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Actor</dt>
                    <dd className="text-sm font-medium text-slate-800">
                      {detailLog.actorEmail ?? '—'}
                      {detailLog.actorRole && <span className="text-slate-400"> ({detailLog.actorRole})</span>}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Source</dt>
                    <dd className="text-sm font-medium text-slate-800">
                      {detailLog.ip ?? '—'}
                      {detailLog.userAgent && <span className="block text-xs text-slate-400 truncate">{detailLog.userAgent}</span>}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resource</dt>
                    <dd className="text-sm font-medium text-slate-800">
                      {detailLog.resourceType ?? '—'}
                      {detailLog.resourceCode && (
                        <span className="block font-mono text-xs text-slate-400">{detailLog.resourceCode}</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resource ID</dt>
                    <dd className="font-mono text-xs text-slate-700 break-all">{detailLog.resourceId ?? '—'}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created At</dt>
                    <dd className="text-sm font-medium text-slate-800">{formatDateTime(detailLog.createdAt)}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transaction</dt>
                    <dd className="text-sm font-medium">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-600">
                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                        {detailLog.txExplorerUrl ? (
                          <a
                            href={detailLog.txExplorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:underline font-semibold"
                          >
                            {shortHash(detailLog.txHash)}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          shortHash(detailLog.txHash)
                        )}
                      </span>
                    </dd>
                  </div>
                </div>

                {detailLog.details && Object.keys(detailLog.details).length > 0 && (
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Details</dt>
                    <dd>
                      <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 overflow-x-auto">
                        {JSON.stringify(detailLog.details, null, 2)}
                      </pre>
                    </dd>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Event Hash</dt>
                  <dd className="font-mono text-xs text-slate-600 break-all">{detailLog.eventHash}</dd>
                </div>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">Entry not found</p>
            )}
          </div>

          <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0 flex items-center justify-between gap-2">
            <div>
              {detailLog && canRetry && isRetryable(detailLog) && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={isRetrying}
                  onClick={() => handleRetry(detailLog)}
                  title="Retry anchoring this audit event on the ledger"
                >
                  {isRetrying ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  {isRetrying ? 'Anchoring...' : 'Retry Anchor'}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {detailLog && canRetry && isRetryable(detailLog) && <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Pending or failed anchors can be re-submitted</span>}
              <Button variant="outline" type="button" onClick={() => setSelectedLogId(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
