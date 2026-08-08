import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, CopyCheck, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { formatDateTime, formatNumber, formatRelativeTime } from '../../utils/format';
import type { BlockchainStatus } from '../../types/blockchain';

const LEDGER_PATH = '/budget-allocation/blockchain';

/** `0x1234abcd…9f2c` — keeps both ends recognizable without overflowing. */
function truncateAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function ContractAddress({ address, explorerUrl }: { address: string; explorerUrl?: string | null }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; no-op.
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy contract address ${address}`}
        title={address}
        className="inline-flex items-center gap-1 font-mono text-xs text-slate-600 hover:text-[var(--color-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 rounded"
      >
        <span className="truncate">{truncateAddress(address)}</span>
        {copied ? (
          <CopyCheck className="w-3.5 h-3.5 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
        ) : (
          <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        )}
      </button>

      {/* Announced without stealing focus, so the copy result is perceivable
          to screen reader users as well as sighted ones. */}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Contract address copied to clipboard' : ''}
      </span>

      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="View contract in block explorer"
          className="text-slate-400 hover:text-[var(--color-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 rounded"
        >
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      )}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-sm text-slate-900 truncate">{children}</span>
    </div>
  );
}

interface BlockchainStatusStripProps {
  status?: BlockchainStatus;
  loading?: boolean;
}

/**
 * Compact ledger health strip.
 *
 * Deliberately one row rather than a full card of technical detail: the
 * dashboard needs to answer "is the ledger healthy?", and the ledger page owns
 * everything past that. The sync line distinguishes three genuinely different
 * states, because "Connected" beside "Last Sync: Never" reads as a
 * contradiction when the truth is simply that nothing has been anchored yet.
 */
export function BlockchainStatusStrip({ status, loading = false }: BlockchainStatusStripProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-6">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-6 w-40 rounded" />
        </div>
      </Card>
    );
  }

  const connected = status?.connected ?? false;
  const recordCount = status?.recordCount ?? 0;
  const pendingCount = status?.pendingCount ?? 0;
  const failedCount = status?.failedCount ?? 0;

  let syncMessage: string;
  if (!connected) {
    // The API explains *why* it is unavailable; repeating that is more useful
    // than inventing our own wording.
    syncMessage = status?.message || 'Blockchain ledger is unavailable.';
  } else if (recordCount === 0) {
    syncMessage = 'No records anchored yet.';
  } else if (status?.lastSync) {
    syncMessage = `Last anchor ${formatRelativeTime(status.lastSync)}.`;
  } else {
    syncMessage = 'Anchor time unavailable.';
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex flex-wrap items-start gap-x-6 gap-y-4 min-w-0">
          <div className="flex flex-col gap-1">
            {connected ? (
              <Badge variant="success">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"
                  aria-hidden="true"
                />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                Not connected
              </Badge>
            )}
          </div>

          {connected && (
            <>
              <Field label="Network">
                {status?.network || 'Unknown'}
                {status?.chainId ? (
                  <span className="text-slate-500"> · {status.chainId}</span>
                ) : null}
              </Field>

              <Field label="Latest block">
                {status?.latestBlock != null ? formatNumber(status.latestBlock) : '—'}
              </Field>

              <Field label="Anchored records">
                <span className="tabular-nums">
                  {formatNumber(status?.confirmedCount ?? 0)} / {formatNumber(recordCount)}
                </span>
                {pendingCount > 0 && (
                  <span className="ml-2 text-xs text-[var(--color-warning)]">
                    {formatNumber(pendingCount)} pending
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="ml-2 text-xs text-[var(--color-error)]">
                    {formatNumber(failedCount)} failed
                  </span>
                )}
              </Field>

              {status?.contractAddress && (
                <Field label="Contract">
                  <ContractAddress
                    address={status.contractAddress}
                    explorerUrl={status.contractExplorerUrl}
                  />
                </Field>
              )}
            </>
          )}
        </div>

        <Link
          to={LEDGER_PATH}
          className="text-xs font-semibold text-[var(--color-primary)] hover:underline shrink-0"
        >
          View ledger →
        </Link>
      </div>

      <p
        className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500"
        title={status?.lastSync ? formatDateTime(status.lastSync) : undefined}
      >
        {syncMessage}
      </p>
    </Card>
  );
}

export default BlockchainStatusStrip;
