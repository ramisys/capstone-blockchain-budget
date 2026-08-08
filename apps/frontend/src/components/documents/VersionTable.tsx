import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/Table';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { BlockchainStatusBadge } from '../blockchain/BlockchainStatusBadge';
import EmptyState from '../allocations/EmptyState';
import { Copy, CopyCheck, Download, History, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '../../utils/format';
import type { DocumentVersion } from '../../types/document';

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function CopyableHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; no-op.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy SHA-256 hash"
      className="inline-flex items-start gap-1 text-left font-mono text-xs text-slate-500 hover:text-indigo-600 transition-colors"
    >
      <span className="max-w-52 break-all">{hash}</span>
      {copied ? (
        <CopyCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 shrink-0" />
      )}
    </button>
  );
}

interface VersionTableProps {
  versions: DocumentVersion[];
  loading?: boolean;
  onDownload: (version: DocumentVersion) => void;
  onVerify: (version: DocumentVersion) => void;
}

/**
 * Version history table for a document. Each row shows the version number,
 * file name, uploader, size, ledger status, and download/verify actions.
 */
const VersionTable: React.FC<VersionTableProps> = ({
  versions,
  loading = false,
  onDownload,
  onVerify,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="min-w-20">Version</TableHead>
              <TableHead className="min-w-44">File Name</TableHead>
              <TableHead className="min-w-36">Uploader</TableHead>
              <TableHead className="min-w-24 text-right">Size</TableHead>
              <TableHead className="min-w-32">Uploaded Date</TableHead>
              <TableHead className="min-w-44">SHA-256 Hash</TableHead>
              <TableHead className="min-w-32">Ledger Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 8 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-20 rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : versions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-4 py-12 text-center">
                  <EmptyState
                    icon={<History className="w-10 h-10 text-slate-300" />}
                    title="No versions yet"
                    description="Upload or replace this document to create its first version."
                  />
                </TableCell>
              </TableRow>
            ) : (
              versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>
                    <span className="font-mono text-sm font-semibold text-slate-800">
                      v{version.versionNumber}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {version.originalFileName}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {version.uploader?.fullName ?? '—'}
                  </TableCell>
                  <TableCell className="text-right text-slate-600 tabular-nums">
                    {formatFileSize(version.fileSizeBytes)}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {formatDate(version.uploadedAt)}
                  </TableCell>
                  <TableCell>
                    <CopyableHash hash={version.sha256Hash} />
                  </TableCell>
                  <TableCell>
                    <BlockchainStatusBadge status={version.blockchainStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-700"
                        title={`Download v${version.versionNumber}`}
                        aria-label={`Download version ${version.versionNumber}`}
                        onClick={() => onDownload(version)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-indigo-700"
                        title={`Verify v${version.versionNumber}`}
                        aria-label={`Verify version ${version.versionNumber}`}
                        onClick={() => onVerify(version)}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export { VersionTable };
export default VersionTable;
