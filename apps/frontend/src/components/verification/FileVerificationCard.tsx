import React, { useRef, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { BlockchainStatusBadge } from '../blockchain/BlockchainStatusBadge';
import { formatDateTime } from '../../utils/format';
import { formatFileSize } from '../documents/VersionTable';
import { useFileVerification } from '../../hooks/useFileVerification';
import {
  CheckCircle2,
  FileCheck,
  FileSearch,
  FileUp,
  Link2,
  Lock,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import type { ExternalFileVerification } from '../../types/verification';

const detailItem = (label: string, value: React.ReactNode) => (
  <div className="flex flex-col gap-1">
    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
    <dd className="text-sm font-medium text-slate-800 break-all">{value}</dd>
  </div>
);

const VERIFIED_AGAINST_LABELS: Record<string, string> = {
  blockchain: 'Verified against blockchain',
  database: 'Matched in database',
  none: 'No database match',
};

const VERIFIED_AGAINST_STYLES: Record<string, string> = {
  blockchain: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  database: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  none: 'bg-slate-100 text-slate-600 border-slate-200',
};

interface ExternalVerificationResultProps {
  verification?: ExternalFileVerification;
  isError?: boolean;
  errorMessage?: string;
}

/**
 * Presentational rendering of an external-file verification result.
 */
export const ExternalVerificationResult: React.FC<ExternalVerificationResultProps> = ({
  verification,
  isError = false,
  errorMessage,
}) => {
  if (isError || !verification) {
    return (
      <div className="flex items-start gap-3 text-sm text-red-600">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <span>{errorMessage || 'Unable to verify the file. Please try again.'}</span>
      </div>
    );
  }

  const version = verification.matchedVersion;
  const heading = verification.verified
    ? 'Verified on the ledger'
    : verification.inconclusive
      ? 'Verification inconclusive'
      : verification.verifiedAgainst === 'none'
        ? 'No matching document'
        : 'Not verified on the ledger';

  const headingTone = verification.verified
    ? 'text-emerald-700'
    : verification.inconclusive || verification.verifiedAgainst === 'database'
      ? 'text-amber-600'
      : 'text-slate-700';

  const icon = verification.verified ? (
    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
  ) : verification.inconclusive ? (
    <SearchCheck className="w-5 h-5 text-amber-500" />
  ) : (
    <Lock className="w-5 h-5 text-slate-400" />
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-sm font-bold ${headingTone}`}>{heading}</span>
          {verification.verifiedAgainst && (
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                VERIFIED_AGAINST_STYLES[verification.verifiedAgainst] || VERIFIED_AGAINST_STYLES.none
              }`}
            >
              {VERIFIED_AGAINST_LABELS[verification.verifiedAgainst] || verification.verifiedAgainst}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500">{verification.message}</p>

      {version ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {detailItem('Document Code', version.document?.documentCode ?? '—')}
          {detailItem('Title', version.document?.title ?? '—')}
          {detailItem('Document Type', version.document?.documentType ?? '—')}
          {detailItem('Version', (
            <span className="font-mono text-xs text-slate-600">v{version.versionNumber}</span>
          ))}
          {detailItem('Original File', (
            <span className="font-mono text-xs text-slate-600 break-all">{version.originalFileName}</span>
          ))}
          {detailItem('File Size', formatFileSize(version.fileSizeBytes))}
          {detailItem('File Hash (SHA-256)', (
            <span className="font-mono text-xs text-slate-500 break-all">{version.sha256Hash}</span>
          ))}
          {detailItem('Blockchain Status', (
            <BlockchainStatusBadge status={version.blockchainStatus as any} />
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
                </a>
              )}
            </span>
          ) : (
            <span className="text-slate-400">Not confirmed yet</span>
          ))}
          {detailItem('Block Number', version.blockNumber ?? '—')}
          {detailItem('Network', version.network || '—')}
          {detailItem('Confirmed At', version.confirmedAt ? formatDateTime(version.confirmedAt) : '—')}
        </dl>
      ) : (
        <p className="text-sm text-slate-500">
          This file has not been uploaded to the system, so there is no anchor to check.
        </p>
      )}
    </div>
  );
};

/**
 * Self-contained card for verifying a user-uploaded file against the ledger.
 * Lets the user pick a local file (drag-drop or browse), then uploads it to the
 * verification endpoint. The file is hashed server-side and never stored.
 */
const FileVerificationCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: verifyFile, isPending, error, reset, data } = useFileVerification();

  const acceptFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      setFile(files[0]);
      reset();
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFiles(event.dataTransfer.files);
  };

  const handleVerify = () => {
    if (!file) return;
    verifyFile(file).catch(() => {
      // Error toast is handled by the mutation hook.
    });
  };

  const errorMessage =
    (error as any)?.response?.data?.message || (error as Error | null)?.message;

  const header = (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
        <FileCheck className="w-5 h-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-900">Verify a File</h4>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-3 h-3" />
            External
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload a file to check its integrity and blockchain anchor. It is never stored.
        </p>
      </div>
    </div>
  );

  return (
    <Card className={`p-6 sm:p-7 border-slate-200/80 ${className}`}>
      {header}

      <div
        role="button"
        tabIndex={0}
        aria-label="Choose a file to verify"
        className={`relative rounded-xl border-2 border-dashed transition-colors p-8 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
          dragging ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-300 hover:border-indigo-300'
        }`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(event) => acceptFiles(event.target.files)}
          data-testid="file-input"
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileUp className="w-8 h-8 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-800 break-all">{file.name}</span>
            <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setFile(null);
                reset();
                if (inputRef.current) inputRef.current.value = '';
              }}
              aria-label="Remove selected file"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="w-8 h-8 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              Drag &amp; drop a file here, or{' '}
              <span className="text-indigo-600 font-semibold">browse</span>
            </span>
            <span className="text-xs text-slate-400">The file is hashed on the server and never stored</span>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button
          variant="primary"
          loading={isPending}
          disabled={!file || isPending}
          onClick={handleVerify}
        >
          <FileSearch className="w-4 h-4" />
          Verify File
        </Button>
        {file && !isPending && (
          <span className="text-xs text-slate-400">
            {formatFileSize(file.size)} ready to verify
          </span>
        )}
      </div>

      {(data || error) && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <ExternalVerificationResult
            verification={data}
            isError={Boolean(error)}
            errorMessage={errorMessage}
          />
        </div>
      )}
    </Card>
  );
};

export { FileVerificationCard };
export default FileVerificationCard;
