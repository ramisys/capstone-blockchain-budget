import React, { useState } from 'react';
import {
  useBlockchainStatus,
  useBlockchainTransactions,
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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { ROLES } from '../../constants/roles';
import { BLOCKCHAIN_RECORD_STATUS_LIST, BLOCKCHAIN_RECORD_STATUS_LABELS } from '../../constants/blockchainStatus';
import { formatNumber, formatDateTime } from '../../utils/format';
import { Box, ExternalLink, Link2, Loader2, ShieldCheck, Wifi, WifiOff, Layers, Clock, XCircle } from 'lucide-react';
import type { BlockchainRecord } from '../../types/blockchain';

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

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<BlockchainRecord | null>(null);

  const {
    data: statusData,
    isLoading: isStatusLoading,
    error: statusError,
  } = useBlockchainStatus();

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
    error: transactionsError,
  } = useBlockchainTransactions(
    {
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
    },
    { page, limit: pageSize },
    { sortBy, sortOrder }
  );

  const { mutateAsync: retryRecord, isPending: isRetrying } = useRetryBlockchainRecord();

  const records = transactionsData?.transactions ?? [];
  const pagination = transactionsData?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 };

  const handleRetry = (record: BlockchainRecord) => {
    retryRecord(record.allocationId).catch(() => {
      // Error toast is handled by the mutation hook.
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Blockchain Ledger</h1>
            <p className="text-slate-500">
              Immutable on-chain anchors for budget allocations, with integrity verification
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
              placeholder="Search by allocation code..."
              className="w-full sm:max-w-md"
            />
            <div className="flex items-center gap-3">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
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

          {isTransactionsError ? (
            <Card className="p-6 text-sm text-red-600">
              {(transactionsError as Error).message || 'Failed to load blockchain transactions'}
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <BlockchainRecordTable
                records={records}
                pagination={pagination}
                canRetry={canRetry}
                isRetrying={isRetrying}
                onVerify={setSelectedRecord}
                onRetry={handleRetry}
                onPageChange={setPage}
              />
              {isTransactionsLoading && records.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading transactions...
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Verification Dialog */}
      <Dialog open={selectedRecord !== null} onOpenChange={(open) => !open && setSelectedRecord(null)}>
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
                {selectedRecord?.allocationCode
                  ? `Integrity check for allocation ${selectedRecord.allocationCode}`
                  : 'Allocation ledger verification'}
              </DialogDescription>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
            {selectedRecord && (
              <BlockchainVerificationCard
                allocationId={selectedRecord.allocationId}
                allocationCode={selectedRecord.allocationCode}
                bare
              />
            )}
          </div>
          <div className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0 flex justify-end">
            <Button variant="outline" type="button" onClick={() => setSelectedRecord(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
