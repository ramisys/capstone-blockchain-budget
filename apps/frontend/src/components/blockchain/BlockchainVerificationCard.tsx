import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { BlockchainStatusBadge } from './BlockchainStatusBadge';
import {
  useAllocationBlockchainVerification,
  useRetryBlockchainRecord,
  useVerifyAllocation,
} from '../../hooks/useBlockchain';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { BLOCKCHAIN_RECORD_STATUS } from '../../constants/blockchainStatus';
import { formatDateTime } from '../../utils/format';
import { Box, CheckCircle2, ExternalLink, Link2, Lock, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { BlockchainVerification } from '../../types/blockchain';

const RETRY_ROLES = [ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER];

const detailItem = (label: string, value: React.ReactNode) => (
  <div className="flex flex-col gap-1">
    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
    <dd className="text-sm font-medium text-slate-800 break-all">{value}</dd>
  </div>
);

interface VerificationContentProps {
  verification?: BlockchainVerification;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isVerifying: boolean;
  isRetrying: boolean;
  canRetry: boolean;
  onVerify: () => void;
  onRetry: () => void;
}

/**
 * Presentational rendering of an allocation's blockchain verification result.
 */
export const BlockchainVerificationContent: React.FC<VerificationContentProps> = ({
  verification,
  isLoading,
  isError,
  errorMessage,
  isVerifying,
  isRetrying,
  canRetry,
  onVerify,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !verification) {
    return (
      <div className="flex items-start gap-3 text-sm text-red-600">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <span>{errorMessage || 'Unable to load blockchain verification for this allocation.'}</span>
      </div>
    );
  }

  const record = verification.record;
  const needsRetry =
    record?.status === BLOCKCHAIN_RECORD_STATUS.PENDING ||
    record?.status === BLOCKCHAIN_RECORD_STATUS.FAILED;

  const heading = verification.verified
    ? 'Verified on the ledger'
    : verification.inconclusive
      ? 'Verification inconclusive'
      : 'Not verified';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {verification.verified ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <Lock className="w-5 h-5 text-slate-400" />
          )}
          <span className="text-sm font-bold text-slate-900">{heading}</span>
          {record && <BlockchainStatusBadge status={record.status} />}
        </div>
        <div className="flex items-center gap-2">
          {needsRetry && canRetry && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              loading={isRetrying}
              onClick={onRetry}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Anchor
            </Button>
          )}
          <Button variant="primary" size="sm" type="button" loading={isVerifying} onClick={onVerify}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Verify Now
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-500">{verification.message}</p>

      {record ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {detailItem('Content Hash', (
            <span className="font-mono text-xs text-slate-500">{record.contentHash}</span>
          ))}
          {detailItem('Transaction Hash', record.txHash ? (
            <span className="font-mono text-xs text-emerald-600 flex items-center gap-1.5 flex-wrap">
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              {record.txHash}
              {record.txExplorerUrl && (
                <a
                  href={record.txExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline ml-1"
                  title="View transaction in block explorer"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </span>
          ) : (
            <span className="text-slate-400">Not confirmed yet</span>
          ))}
          {detailItem('Block Number', record.blockNumber ?? '—')}
          {detailItem('Network', record.network || '—')}
          {detailItem('Confirmed At', record.confirmedAt ? formatDateTime(record.confirmedAt) : '—')}
          {detailItem('Integrity', verification.integrityOk ? (
            <span className="text-emerald-600 font-semibold">Hash matches stored record</span>
          ) : (
            <span className="text-red-600 font-semibold">Hash mismatch — possible tampering</span>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-slate-500">
          No blockchain record exists for this allocation yet. Approving the allocation, or
          using the retry action, will anchor it on the ledger.
        </p>
      )}
    </div>
  );
};

interface BlockchainVerificationCardProps {
  allocationId: string;
  allocationCode?: string;
  className?: string;
  bare?: boolean;
}

/**
 * Self-contained verification card for a single allocation. Loads the current
 * verification detail and exposes Verify / Retry actions. Used inline in the
 * allocation details view and inside the ledger page's verification dialog.
 */
const BlockchainVerificationCard: React.FC<BlockchainVerificationCardProps> = ({
  allocationId,
  allocationCode,
  className = '',
  bare = false,
}) => {
  const { hasRole } = useAuth();
  const { data: verification, isLoading, isError, error } = useAllocationBlockchainVerification(
    allocationId
  );
  const { mutateAsync: verifyAllocation, isPending: isVerifying } = useVerifyAllocation();
  const { mutateAsync: retryRecord, isPending: isRetrying } = useRetryBlockchainRecord();

  const canRetry = hasRole(...RETRY_ROLES);

  const handleVerify = () => {
    verifyAllocation(allocationId).catch(() => {
      // Error toast is handled by the mutation hook.
    });
  };

  const handleRetry = () => {
    retryRecord(allocationId).catch(() => {
      // Error toast is handled by the mutation hook.
    });
  };

  const header = (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
        <Box className="w-5 h-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-900">Blockchain Verification</h4>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 text-indigo-600">
            <Lock className="w-3 h-3" />
            {allocationCode ?? 'Ledger'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable on-chain anchor and integrity check for this allocation
        </p>
      </div>
    </div>
  );

  const content = (
    <BlockchainVerificationContent
      verification={verification}
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as Error | null)?.message}
      isVerifying={isVerifying}
      isRetrying={isRetrying}
      canRetry={canRetry}
      onVerify={handleVerify}
      onRetry={handleRetry}
    />
  );

  if (bare) {
    return (
      <div className={`space-y-5 ${className}`}>
        {header}
        {content}
      </div>
    );
  }

  return (
    <Card className={`p-6 sm:p-7 border-slate-200/80 ${className}`}>
      {header}
      {content}
    </Card>
  );
};

export { BlockchainVerificationCard };
export default BlockchainVerificationCard;
