import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { BlockchainStatusBadge } from './BlockchainStatusBadge';
import { Badge } from '../ui/Badge';
import {
  LEDGER_RECORD_TYPE,
  LEDGER_RECORD_TYPE_LABELS,
  LEDGER_RECORD_TYPE_VARIANTS,
} from '../../constants/ledger';
import { useBlockchainTransactionDetail } from '../../hooks/useBlockchain';
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/format';
import { Box, ExternalLink, Link2, Loader2, FileText, ShieldAlert, ScrollText } from 'lucide-react';
import type { LedgerRecordType, LedgerHistoryEntry } from '../../types/blockchain';

const detailItem = (label: string, value: React.ReactNode) => (
  <div className="flex flex-col gap-1">
    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
    <dd className="text-sm font-medium text-slate-800 break-all">{value}</dd>
  </div>
);

const shortHash = (value: string | null, length = 16): string => {
  if (!value) return '—';
  if (value.length <= length * 2 + 2) return value;
  return `${value.slice(0, length)}...${value.slice(-length)}`;
};

const RECORD_TYPE_ICONS = {
  [LEDGER_RECORD_TYPE.ALLOCATION]: <Box className="w-5 h-5" />,
  [LEDGER_RECORD_TYPE.DOCUMENT]: <FileText className="w-5 h-5" />,
  [LEDGER_RECORD_TYPE.AUDIT]: <ScrollText className="w-5 h-5" />,
};

interface BlockchainTransactionDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
  recordType: LedgerRecordType | null;
}

/**
 * Detail drawer for a single entry in the unified blockchain history. Loads the
 * type-aware transaction detail and renders the anchor data plus the source
 * record (allocation / document / audit event) reference.
 */
const BlockchainTransactionDetail: React.FC<BlockchainTransactionDetailProps> = ({
  open,
  onOpenChange,
  transactionId,
  recordType,
}) => {
  const { data: transaction, isLoading, isError, error } = useBlockchainTransactionDetail(
    transactionId ?? undefined,
    recordType ?? undefined
  );

  const icon =
    (transaction?.recordType && RECORD_TYPE_ICONS[transaction.recordType]) ||
    RECORD_TYPE_ICONS[LEDGER_RECORD_TYPE.ALLOCATION];

  const renderSourceSection = (tx: LedgerHistoryEntry) => {
    const ref = tx.ref;
    if (tx.recordType === LEDGER_RECORD_TYPE.ALLOCATION) {
      return (
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Allocation</dt>
          <dd className="text-sm font-medium text-slate-800">
            <span className="font-mono">{ref?.allocationCode ?? tx.code}</span>
          </dd>
          {ref?.status && (
            <dd className="text-sm">
              <BlockchainStatusBadge status={ref.status} />
            </dd>
          )}
          {ref?.allocatedAmount != null && (
            <dd className="text-sm font-semibold text-slate-800">{formatCurrency(ref.allocatedAmount)}</dd>
          )}
          {ref?.department && (
            <dd className="text-xs text-slate-500">
              {ref.department.name} · {ref.department.code}
            </dd>
          )}
          {ref?.fiscalYear && (
            <dd className="text-xs text-slate-500">FY {ref.fiscalYear.code}</dd>
          )}
        </div>
      );
    }

    if (tx.recordType === LEDGER_RECORD_TYPE.DOCUMENT) {
      return (
        <>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Document</dt>
            <dd className="text-sm font-medium text-slate-800">{ref?.title ?? '—'}</dd>
            {ref?.documentCode && (
              <dd className="font-mono text-xs text-slate-500">{ref.documentCode}</dd>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Type</dt>
            <dd className="text-sm font-medium text-slate-800">{ref?.documentType ?? '—'}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">File</dt>
            <dd className="text-sm font-medium text-slate-800 break-all">{ref?.originalFileName ?? '—'}</dd>
          </div>
          {ref?.fileSizeBytes != null && (
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Size</dt>
              <dd className="text-sm font-medium text-slate-800">
                {formatNumber(ref.fileSizeBytes)} bytes
                {ref.mimeType ? ` · ${ref.mimeType}` : ''}
              </dd>
            </div>
          )}
          {tx.versionNumber != null && (
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Version</dt>
              <dd className="text-sm font-medium text-slate-800">v{tx.versionNumber}</dd>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Action</dt>
          <dd className="text-sm font-medium text-slate-800">
            {ref?.action ?? '—'}
            {ref?.result && <span className="text-slate-400"> · {ref.result}</span>}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Actor</dt>
          <dd className="text-sm font-medium text-slate-800">
            {ref?.actorEmail ?? '—'}
            {ref?.actorRole && <span className="text-slate-400"> ({ref.actorRole})</span>}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resource</dt>
          <dd className="text-sm font-medium text-slate-800">
            {ref?.resourceType ?? '—'}
            {ref?.resourceCode && (
              <span className="block font-mono text-xs text-slate-400">{ref.resourceCode}</span>
            )}
          </dd>
        </div>
        {ref?.details && Object.keys(ref.details).length > 0 && (
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Details</dt>
            <dd>
              <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 overflow-x-auto">
                {JSON.stringify(ref.details, null, 2)}
              </pre>
            </dd>
          </div>
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl p-0 gap-0 rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-7 py-5 border-b border-slate-100 bg-white flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            {icon}
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">Transaction Details</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              {transaction
                ? `${LEDGER_RECORD_TYPE_LABELS[transaction.recordType] ?? transaction.recordType} · ${transaction.code}`
                : 'Blockchain ledger entry'}
            </DialogDescription>
          </div>
          {transaction?.recordType && (
            <Badge variant={LEDGER_RECORD_TYPE_VARIANTS[transaction.recordType]}>
              {LEDGER_RECORD_TYPE_LABELS[transaction.recordType] ?? transaction.recordType}
            </Badge>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading transaction...
            </div>
          ) : isError || !transaction ? (
            <div className="flex items-start gap-3 text-sm text-red-600">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{(error as Error | null)?.message || 'Unable to load this ledger entry.'}</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <BlockchainStatusBadge status={transaction.status} />
                {transaction.blockNumber !== null && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                    Block #{formatNumber(transaction.blockNumber)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reference</dt>
                  <dd className="font-mono text-xs text-slate-700 break-all">{transaction.code}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created At</dt>
                  <dd className="text-sm font-medium text-slate-800">{formatDateTime(transaction.createdAt)}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Network</dt>
                  <dd className="text-sm font-medium text-slate-800">{transaction.network || '—'}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Confirmed At</dt>
                  <dd className="text-sm font-medium text-slate-800">
                    {transaction.confirmedAt ? formatDateTime(transaction.confirmedAt) : '—'}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transaction</dt>
                  <dd className="text-sm font-medium">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-600">
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      {transaction.txExplorerUrl ? (
                        <a
                          href={transaction.txExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline font-semibold"
                        >
                          {shortHash(transaction.txHash)}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        shortHash(transaction.txHash)
                      )}
                    </span>
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Content Hash</dt>
                  <dd className="font-mono text-xs text-slate-600 break-all">{transaction.hash}</dd>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {renderSourceSection(transaction)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0 flex justify-end">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { BlockchainTransactionDetail };
export default BlockchainTransactionDetail;
