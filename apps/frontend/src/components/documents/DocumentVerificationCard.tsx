import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { BlockchainStatusBadge } from '../blockchain/BlockchainStatusBadge';
import {
  useDocumentVerification,
  useRetryDocumentVersion,
  useVerifyDocument,
} from '../../hooks/useDocuments';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { BLOCKCHAIN_RECORD_STATUS } from '../../constants/blockchainStatus';
import { formatDateTime } from '../../utils/format';
import { CheckCircle2, ExternalLink, FileCheck, Link2, Lock, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { DocumentVerification } from '../../types/document';

const RETRY_ROLES = [ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER];

const detailItem = (label: string, value: React.ReactNode) => (
  <div className="flex flex-col gap-1">
    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
    <dd className="text-sm font-medium text-slate-800 break-all">{value}</dd>
  </div>
);

interface VerificationContentProps {
  verification?: DocumentVerification;
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
 * Presentational rendering of a document version's verification result.
 */
export const DocumentVerificationContent: React.FC<VerificationContentProps> = ({
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
        <span>{errorMessage || 'Unable to load blockchain verification for this document version.'}</span>
      </div>
    );
  }

  const version = verification.version;
  const needsRetry =
    version?.blockchainStatus === BLOCKCHAIN_RECORD_STATUS.PENDING ||
    version?.blockchainStatus === BLOCKCHAIN_RECORD_STATUS.FAILED;

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
          {version && <BlockchainStatusBadge status={version.blockchainStatus} />}
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

      {version ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {detailItem('Version', (
            <span className="font-mono text-xs text-slate-600">v{version.versionNumber}</span>
          ))}
          {detailItem('File Hash (SHA-256)', (
            <span className="font-mono text-xs text-slate-500 break-all">{version.sha256Hash}</span>
          ))}
          {detailItem('Transaction Hash', version.txHash ? (
            <span className="font-mono text-xs text-emerald-600 flex items-center gap-1.5 flex-wrap">
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              {version.txHash}
              {version.txExplorerUrl && (
                <a
                  href={version.txExplorerUrl}
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
          {detailItem('Block Number', version.blockNumber ?? '—')}
          {detailItem('Network', version.network || '—')}
          {detailItem('Confirmed At', version.confirmedAt ? formatDateTime(version.confirmedAt) : '—')}
          {detailItem('Integrity', verification.integrityOk ? (
            <span className="text-emerald-600 font-semibold">Hash matches stored file</span>
          ) : (
            <span className="text-red-600 font-semibold">Hash mismatch — possible tampering</span>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-slate-500">
          No version is available for verification yet.
        </p>
      )}
    </div>
  );
};

interface DocumentVerificationCardProps {
  documentId: string;
  documentCode?: string;
  version?: number;
  className?: string;
  bare?: boolean;
}

/**
 * Self-contained verification card for a single document version. Loads the
 * current verification detail and exposes Verify / Retry actions. Used inline
 * on the document detail page.
 */
const DocumentVerificationCard: React.FC<DocumentVerificationCardProps> = ({
  documentId,
  documentCode,
  version,
  className = '',
  bare = false,
}) => {
  const { hasRole } = useAuth();
  const {
    data: verification,
    isLoading,
    isError,
    error,
  } = useDocumentVerification(documentId, version);
  const { mutateAsync: verifyDocument, isPending: isVerifying } = useVerifyDocument();
  const { mutateAsync: retryVersion, isPending: isRetrying } = useRetryDocumentVersion();

  const canRetry = hasRole(...RETRY_ROLES);

  const handleVerify = () => {
    verifyDocument({ id: documentId, version }).catch(() => {
      // Error toast is handled by the mutation hook.
    });
  };

  const handleRetry = () => {
    retryVersion({ id: documentId, version }).catch(() => {
      // Error toast is handled by the mutation hook.
    });
  };

  const header = (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
        <FileCheck className="w-5 h-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-900">Blockchain Verification</h4>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 text-indigo-600">
            <Lock className="w-3 h-3" />
            {documentCode ?? 'Document'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable on-chain anchor and integrity check for this document version
        </p>
      </div>
    </div>
  );

  const content = (
    <DocumentVerificationContent
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

export { DocumentVerificationCard };
export default DocumentVerificationCard;
