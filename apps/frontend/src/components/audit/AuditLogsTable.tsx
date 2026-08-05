import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '../ui/Table';
import { Button } from '../ui/Button';
import Pagination from '../ui/Pagination';
import { AuditResultBadge } from './AuditResultBadge';
import { AuditAnchorStatusBadge } from './AuditAnchorStatusBadge';
import { AUDIT_ACTION_LABELS } from '../../constants/auditActions';
import { formatDateTime } from '../../utils/format';
import { ExternalLink, Link2, Eye, RefreshCw } from 'lucide-react';
import type { AuditLog } from '../../types/audit';
import type { PaginationInfo } from '../../types/allocation';

const shortHash = (value: string | null, length = 10): string => {
  if (!value) return '—';
  if (value.length <= length * 2 + 2) return value;
  return `${value.slice(0, length)}...${value.slice(-length)}`;
};

const isRetryable = (log: AuditLog): boolean =>
  log.anchorStatus === 'Pending' || log.anchorStatus === 'Failed';

interface AuditLogsTableProps {
  logs: AuditLog[];
  pagination: PaginationInfo;
  onView: (log: AuditLog) => void;
  onPageChange: (page: number) => void;
  canRetry?: boolean;
  onRetry?: (log: AuditLog) => void;
  retryingId?: string | null;
}

const AuditLogsTable: React.FC<AuditLogsTableProps> = ({
  logs,
  pagination,
  onView,
  onPageChange,
  canRetry = false,
  onRetry,
  retryingId = null,
}) => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableCaption className="text-slate-600 font-medium mb-2">
            Audit Log Entries ({pagination.total} total)
          </TableCaption>
          <TableHeader className="bg-slate-50">
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="px-6 py-3 min-w-48">Action</TableHead>
              <TableHead className="px-6 py-3 min-w-24">Result</TableHead>
              <TableHead className="px-6 py-3 min-w-48">Actor</TableHead>
              <TableHead className="px-6 py-3 min-w-40">Resource</TableHead>
              <TableHead className="px-6 py-3 min-w-40">Created At</TableHead>
              <TableHead className="px-6 py-3 min-w-32">Anchor Status</TableHead>
              <TableHead className="px-6 py-3 min-w-40">Transaction</TableHead>
              <TableHead className="px-6 py-3 min-w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-slate-100">
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-6 py-8 text-center text-slate-500">
                  No audit log entries found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onView(log)}>
                  <TableCell className="px-6 py-4 text-sm">
                    <span className="block font-medium text-slate-800">
                      {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    <span className="block font-mono text-xs text-slate-400">{log.action}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    <AuditResultBadge result={log.result} />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600">
                    <span className="block font-medium text-slate-700">{log.actorEmail ?? '—'}</span>
                    {log.actorRole && (
                      <span className="block text-xs text-slate-400">{log.actorRole}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600">
                    <span className="block">{log.resourceType ?? '—'}</span>
                    {log.resourceCode && (
                      <span className="block font-mono text-xs text-slate-400">{log.resourceCode}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    <AuditAnchorStatusBadge status={log.anchorStatus} />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-600">
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      {log.txExplorerUrl ? (
                        <a
                          href={log.txExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 hover:underline hover:text-emerald-700 font-semibold"
                          title="View transaction in block explorer"
                        >
                          {shortHash(log.txHash)}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        shortHash(log.txHash)
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-medium whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                    <div className="inline-flex items-center gap-2">
                      {canRetry && isRetryable(log) && onRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={retryingId === log.id}
                          onClick={() => onRetry(log)}
                          title="Retry anchoring this audit event on the ledger"
                        >
                          {retryingId === log.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          {retryingId === log.id ? 'Anchoring' : 'Retry'}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" type="button" onClick={() => onView(log)}>
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {logs.length > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.limit}
          onPageChange={onPageChange}
          label="entries"
        />
      )}
    </div>
  );
};

export { AuditLogsTable };
export default AuditLogsTable;
