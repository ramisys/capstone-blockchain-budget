import React, { useState } from 'react';
import {
  useBlockchainStatus,
  useBlockchainHistory,
  useRetryBlockchainRecord,
} from '../../hooks/useBlockchain';
import { useListControls } from '../../hooks/useListControls';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/Select';
import { BlockchainRecordTable } from '../../components/blockchain/BlockchainRecordTable';
import { BlockchainVerificationCard } from '../../components/blockchain/BlockchainVerificationCard';
import { BlockchainTransactionDetail } from '../../components/blockchain/BlockchainTransactionDetail';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { ROLES } from '../../constants/roles';
import { BLOCKCHAIN_RECORD_STATUS_LIST, BLOCKCHAIN_RECORD_STATUS_LABELS } from '../../constants/blockchainStatus';
import { LEDGER_RECORD_TYPE_LIST, LEDGER_RECORD_TYPE_LABELS } from '../../constants/ledger';
import { formatNumber, formatDateTime } from '../../utils/format';
import { Box, ExternalLink, Link2, Loader2, ShieldCheck, Wifi, WifiOff, Layers, Clock, XCircle } from 'lucide-react';
import type {
  BlockchainRecordStatus,
  LedgerHistoryEntry,
  LedgerRecordType,
} from '../../types/blockchain';

const ALL = '';

const RETRY_ROLES = [ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER];

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

export function BlockchainLedger() {
  const { hasRole } = useAuth();
  const canRetry = hasRole(...RETRY_ROLES);

  const {
    search,
    setSearch,
    debouncedSearch,
    page,
    setPage,
    pageSize,
    sortBy,
    sortOrder,
  } = useListControls({ initialSortBy: 'newest' });

  const [statusFilter, setStatusFilter] = useState<BlockchainRecordStatus | ''>('');
  const [recordTypeFilter, setRecordTypeFilter] = useState<LedgerRecordType | ''>('');
  const [selectedEntry, setSelectedEntry] = useState<LedgerHistoryEntry | null>(null);
  const [detailSelection, setDetailSelection] = useState<{
    id: string;
    recordType: LedgerRecordType;
  } | null>(null);

  const {
    data: statusData,
    isLoading: isStatusLoading,
    error: statusError,
  } = useBlockchainStatus();

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyError,
  } = useBlockchainHistory({
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    recordType: recordTypeFilter || undefined,
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
  });

  const { mutateAsync: retryRecord, isPending: isRetrying } = useRetryBlockchainRecord();

  const records = historyData?.transactions ?? [];
  const pagination = historyData?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 };

  const handleRetry = (entry: LedgerHistoryEntry) => {
    if (!entry.allocationId) return;
    retryRecord(entry.allocationId).catch(() => {
      // Error toast is handled by the mutation hook.
    });
  };

  const openDetail = (entry: LedgerHistoryEntry) => {
    setDetailSelection({ id: entry.id, recordType: entry.recordType });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Blockchain Ledger</h1>
            <p className="text-slate-500">
              Unified immutable ledger history across allocations, documents, and audit events
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isStatusLoading ? (
              <Badge variant="secondary">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking ledger...
              </Badge>
            ) : statusData?.connected ? (
              <Badge variant="success">
                <Wifi className="w-3.5 h-3.5" /> Connected
              </Badge>
            ) : (
              <Badge variant="danger">
                <WifiOff className="w-3.5 h-3.5" /> Disconnected
              </Badge>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            icon={<ShieldCheck className="w-5 h-5" />}
            label="Confirmed Records"
            value={formatNumber(statusData?.confirmedCount ?? 0)}
            sub={`${formatNumber(statusData?.recordCount ?? 0)} total records`}
            accent="bg-emerald-50 text-emerald-600"
          />
          <StatusCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending Anchors"
            value={formatNumber(statusData?.pendingCount ?? 0)}
            sub="Awaiting ledger confirmation"
            accent="bg-amber-50 text-amber-600"
          />
          <StatusCard
            icon={<XCircle className="w-5 h-5" />}
            label="Failed Anchors"
            value={formatNumber(statusData?.failedCount ?? 0)}
            sub="Eligible for retry"
            accent="bg-red-50 text-red-600"
          />
          <StatusCard
            icon={<Layers className="w-5 h-5" />}
            label="Latest Block"
            value={statusData?.latestBlock ?? '—'}
            sub={
              statusData
                ? `${statusData.network || 'network'}${statusData.chainId ? ` · ${statusData.chainId}` : ''}`
                : undefined
            }
            accent="bg-indigo-50 text-indigo-600"
          />
        </div>

        {/* Ledger details */}
        <Card className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contract Address</dt>
              <dd className="font-mono text-xs text-slate-700 break-all">
                {statusData?.contractExplorerUrl ? (
                  <a
                    href={statusData.contractExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
                    title="View contract on block explorer"
                  >
                    {statusData.contractAddress}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  statusData?.contractAddress || '—'
                )}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">On-Chain Records</dt>
              <dd className="text-sm font-medium text-slate-800">
                {statusData?.onChainCount != null ? formatNumber(statusData.onChainCount) : '—'}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Sync</dt>
              <dd className="text-sm font-medium text-slate-800">
                {statusData?.lastSync ? formatDateTime(statusData.lastSync) : 'Never'}
              </dd>
            </div>
          </div>
          {statusError && (
            <p className="mt-4 text-sm text-red-600">
              {(statusError as Error).message || 'Failed to load blockchain status'}
            </p>
          )}
          {statusData?.message && (
            <p className="mt-3 text-xs text-slate-500">{statusData.message}</p>
          )}
        </Card>

        {/* Transactions */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by code, title, or resource..."
              className="w-full sm:max-w-md"
            />
            <div className="flex items-center gap-3">
              <Select
                value={recordTypeFilter}
                onValueChange={(value) => setRecordTypeFilter(value as LedgerRecordType | '')}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Types</SelectItem>
                  {LEDGER_RECORD_TYPE_LIST.map((type) => (
                    <SelectItem key={type} value={type}>
                      {LEDGER_RECORD_TYPE_LABELS[type] ?? type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as BlockchainRecordStatus | '')}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Statuses</SelectItem>
                  {BLOCKCHAIN_RECORD_STATUS_LIST.map((status) => (
                    <SelectItem key={status} value={status}>
                      {BLOCKCHAIN_RECORD_STATUS_LABELS[status] ?? status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isStatusLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
          </div>

          {isHistoryError ? (
            <Card className="p-6 text-sm text-red-600">
              {(historyError as Error).message || 'Failed to load blockchain ledger history'}
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <BlockchainRecordTable
                records={records}
                pagination={pagination}
                canRetry={canRetry}
                isRetrying={isRetrying}
                onViewDetails={openDetail}
                onVerify={setSelectedEntry}
                onRetry={handleRetry}
                onPageChange={setPage}
              />
              {isHistoryLoading && records.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading ledger history...
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Verification Dialog */}
      <Dialog open={selectedEntry !== null} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="w-full max-w-2xl p-0 gap-0 rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden max-h-[90vh] flex flex-col">
          <div className="px-7 py-5 border-b border-slate-100 bg-white flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Blockchain Verification
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                {selectedEntry?.code
                  ? `Integrity check for allocation ${selectedEntry.code}`
                  : 'Allocation ledger verification'}
              </DialogDescription>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
            {selectedEntry && selectedEntry.allocationId && (
              <BlockchainVerificationCard
                allocationId={selectedEntry.allocationId}
                allocationCode={selectedEntry.code}
                bare
              />
            )}
          </div>
          <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0 flex justify-end">
            <Button variant="outline" type="button" onClick={() => setSelectedEntry(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Drawer */}
      <BlockchainTransactionDetail
        open={detailSelection !== null}
        onOpenChange={(open) => !open && setDetailSelection(null)}
        transactionId={detailSelection?.id ?? null}
        recordType={detailSelection?.recordType ?? null}
      />
    </div>
  );
}
