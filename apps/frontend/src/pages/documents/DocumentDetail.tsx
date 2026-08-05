import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  useDocumentById,
  useDocumentVersions,
  useDocumentActivities,
  useArchiveDocument,
} from '../../hooks/useDocuments';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { DocumentVerificationCard } from '../../components/documents/DocumentVerificationCard';
import { VersionTable } from '../../components/documents/VersionTable';
import { ActivityTimeline } from '../../components/documents/ActivityTimeline';
import { DocumentStatusBadge } from '../../components/documents/DocumentStatusBadge';
import { DocumentTypeBadge } from '../../components/documents/DocumentTypeBadge';
import { DocumentArchiveDialog } from '../../components/documents/DocumentArchiveDialog';
import { DocumentEditDialog } from '../../components/documents/DocumentEditDialog';
import { DocumentReplaceDialog } from '../../components/documents/DocumentReplaceDialog';
import { BlockchainStatusBadge } from '../../components/blockchain/BlockchainStatusBadge';
import { documentApi, openBlobPreview, triggerBlobDownload } from '../../services/documentService';
import { ROLES } from '../../constants/roles';
import { formatDate, formatDateTime } from '../../utils/format';
import { AlertCircle, ArrowLeft, Download, Eye, FileEdit, RefreshCw, X } from 'lucide-react';
import type { DocumentVersion, ManagedDocument } from '../../types/document';
import type { BlockchainRecordStatus } from '../../types/blockchain';

const WRITE_ROLES = [ROLES.ADMINISTRATOR, ROLES.TREASURER, ROLES.BUDGET_OFFICER];

const canEditDocument = (role: string): boolean => WRITE_ROLES.includes(role as (typeof WRITE_ROLES)[number]);

const canArchiveDocument = (role: string, document: ManagedDocument, currentUserId?: string): boolean => {
  if (role === ROLES.ADMINISTRATOR) return true;
  if (role === ROLES.BUDGET_OFFICER) return document.uploadedBy === currentUserId;
  if (role === ROLES.TREASURER) return document.uploadedBy === currentUserId || Boolean(document.allocation);
  return false;
};

/**
 * Document detail page: header metadata, blockchain verification card,
 * version history table, and the persisted activity timeline.
 */
export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || '';
  const currentUserId = user?.id;

  const { showToast } = useToast();

  const {
    data: document,
    isLoading,
    isError,
    error,
    refetch,
  } = useDocumentById(id);
  const { data: versions, isLoading: versionsLoading } = useDocumentVersions(id);
  const { data: activities, isLoading: activitiesLoading } = useDocumentActivities(id);
  const { mutateAsync: archiveDocument, isPending: isArchiving } = useArchiveDocument();

  const [verifyVersion, setVerifyVersion] = useState<DocumentVersion | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const detailItem = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 break-all">{value}</dd>
    </div>
  );

  const handleDownload = async (version: DocumentVersion) => {
    try {
      const response = await documentApi.downloadDocument(id!, version.versionNumber);
      const blob = response.data as Blob;
      triggerBlobDownload(blob, version.originalFileName || `${document?.documentCode ?? 'document'}.${version.fileExtension || 'bin'}`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to download version', 'error');
    }
  };

  const handlePreview = async () => {
    if (!document?.currentVersion) {
      showToast('This document has no file to preview.', 'error');
      return;
    }
    try {
      const response = await documentApi.previewDocument(id!);
      const blob = response.data as Blob;
      openBlobPreview(blob);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to open preview', 'error');
    }
  };

  const handleArchive = async () => {
    if (!document) return;
    try {
      await archiveDocument(document.id);
      setIsArchiveOpen(false);
      navigate('/documents', { replace: true });
    } catch {
      // Error toast is handled by the mutation hook.
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50 px-5 py-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Unable to load this document</p>
              <p className="text-sm text-red-700 mt-0.5">{error?.message || 'Please try again.'}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" onClick={() => navigate('/documents')}>
              <ArrowLeft className="w-4 h-4" />
              Back to Documents
            </Button>
            <Button variant="primary" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isArchived = document.status === 'Archived';
  const ledgerStatus = document.currentVersion?.blockchainStatus as BlockchainRecordStatus | undefined;
  const editAllowed = canEditDocument(role) && !isArchived;
  const archiveAllowed = canArchiveDocument(role, document, currentUserId) && !isArchived;
  const replaceAllowed = editAllowed && Boolean(document.currentVersion);

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/documents')}
            className="self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {replaceAllowed && (
              <Button variant="outline" size="sm" onClick={() => setIsReplaceOpen(true)}>
                <RefreshCw className="w-4 h-4" />
                Replace Version
              </Button>
            )}
            {editAllowed && (
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <FileEdit className="w-4 h-4" />
                Edit Metadata
              </Button>
            )}
            {archiveAllowed && (
              <Button variant="danger" size="sm" onClick={() => setIsArchiveOpen(true)}>
                <X className="w-4 h-4" />
                Archive
              </Button>
            )}
          </div>
        </div>

        {/* Header Card */}
        <Card className="p-6 sm:p-7 border-slate-200/80">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-indigo-700">
                  {document.documentCode}
                </span>
                <DocumentStatusBadge status={document.status} />
                <DocumentTypeBadge type={document.documentType} />
                {ledgerStatus && <BlockchainStatusBadge status={ledgerStatus} />}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{document.title}</h1>
              <p className="text-sm text-slate-500">
                Uploaded by {document.uploader?.fullName ?? '—'} on{' '}
                {formatDateTime(document.createdAt)}
              </p>
            </div>
            {document.currentVersion && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownload(document.currentVersion as DocumentVersion)
                  }
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="primary" size="sm" onClick={handlePreview}>
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
              </div>
            )}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 mt-6 pt-6 border-t border-slate-100">
            {detailItem('Description', document.description || '—')}
            {detailItem('Fiscal Year', document.fiscalYear?.code || '—')}
            {detailItem('Department', document.department?.name || '—')}
            {detailItem('Budget Allocation', document.allocation?.allocationCode || '—')}
            {detailItem('Total Versions', document._count?.versions ?? versions?.length ?? '—')}
            {detailItem('Current Version', document.currentVersion ? `v${document.currentVersion.versionNumber}` : '—')}
            {detailItem('Uploaded At', formatDate(document.createdAt))}
            {detailItem('Last Updated', formatDateTime(document.updatedAt))}
            {isArchived && document.archivedAt
              ? detailItem(
                  'Archived At',
                  <span className="text-amber-600">
                    {formatDateTime(document.archivedAt)}
                    {document.archiver?.fullName ? ` · by ${document.archiver.fullName}` : ''}
                  </span>
                )
              : null}
          </dl>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Verification + versions */}
          <div className="lg:col-span-2 space-y-6">
            <DocumentVerificationCard
              documentId={document.id}
              documentCode={document.documentCode}
              version={verifyVersion?.versionNumber}
            />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-800">Version History</h3>
              </div>
              <VersionTable
                versions={versions ?? []}
                loading={versionsLoading}
                onDownload={handleDownload}
                onVerify={setVerifyVersion}
              />
            </div>
          </div>

          {/* Activity timeline */}
          <div className="space-y-6">
            <ActivityTimeline
              activities={activities ?? []}
              loading={activitiesLoading}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <DocumentEditDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        document={document}
      />
      <DocumentReplaceDialog
        isOpen={isReplaceOpen}
        onClose={() => setIsReplaceOpen(false)}
        documentId={document.id}
        documentCode={document.documentCode}
        currentVersionNumber={document.currentVersion?.versionNumber}
      />
      <DocumentArchiveDialog
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchive}
        isLoading={isArchiving}
        documentCode={document.documentCode}
      />
    </div>
  );
}

export default DocumentDetail;
