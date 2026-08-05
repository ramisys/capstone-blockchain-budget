import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListControls } from '../../hooks/useListControls';
import { useDocumentFilters } from '../../hooks/useDocumentFilters';
import { useDocuments, useArchiveDocument } from '../../hooks/useDocuments';
import { useDocumentOptions } from '../../hooks/useDocumentOptions';
import { useDocumentUploaders } from '../../hooks/useDocumentUploaders';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import { DocumentTable } from '../../components/documents/DocumentTable';
import { DocumentSearch } from '../../components/documents/DocumentSearch';
import { DocumentFilters } from '../../components/documents/DocumentFilters';
import { DocumentArchiveDialog } from '../../components/documents/DocumentArchiveDialog';
import { DocumentUploadDialog } from '../../components/documents/DocumentUploadDialog';
import { Button } from '../../components/ui/Button';
import { documentApi, triggerBlobDownload } from '../../services/documentService';
import { AlertCircle, FileUp, Loader2 } from 'lucide-react';
import type { ManagedDocument } from '../../types/document';

/**
 * Document management list page: searchable, filterable, paginated table with
 * role-aware actions (view / download / archive) and a quick upload dialog.
 */
export function DocumentList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || '';
  const currentUserId = user?.id;

  const { showToast } = useToast();

  const {
    search,
    setSearch,
    debouncedSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortBy,
    sortOrder,
    handleSort,
  } = useListControls({ initialSortBy: 'newest' });

  const { filters, filtersKey, hasActiveFilters, setFilter, resetFilters } = useDocumentFilters();

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useDocuments(
    { ...filters, search: debouncedSearch || undefined },
    { page, limit: pageSize },
    { sortBy, sortOrder },
  );

  const { fiscalYears, departments, allocations, isLoading: optionsLoading } = useDocumentOptions();
  const { uploaders, isLoading: uploadersLoading } = useDocumentUploaders();

  const { mutateAsync: archiveDocument, isPending: isArchiving } = useArchiveDocument();

  const [archiveTarget, setArchiveTarget] = useState<ManagedDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const documents = data?.documents ?? [];
  const pagination = data?.pagination;

  const handleDownload = async (document: ManagedDocument) => {
    const version = document.currentVersion;
    if (!version) {
      showToast('This document has no downloadable version.', 'error');
      return;
    }
    try {
      const response = await documentApi.downloadDocument(document.id, version.versionNumber);
      const blob = response.data as Blob;
      const fallbackName = version.originalFileName || `${document.documentCode}.${version.fileExtension || 'bin'}`;
      triggerBlobDownload(blob, fallbackName);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to download document', 'error');
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveDocument(archiveTarget.id);
      setArchiveTarget(null);
    } catch {
      // Error toast is handled by the mutation hook.
    }
  };

  const handleView = (document: ManagedDocument) => {
    navigate(`/documents/${document.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Documents</h1>
            <p className="text-slate-500">
              Upload, track, and verify procurement and budget documents on the blockchain ledger.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsUploadOpen(true)}
            className="w-full sm:w-auto"
          >
            <FileUp className="w-4 h-4" />
            Upload Document
          </Button>
        </div>

        {isError && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200/80 bg-red-50 px-5 py-4">
            <div className="flex items-center gap-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Failed to load documents: {error?.message || 'Please try again.'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Search */}
        <DocumentSearch value={search} onChange={setSearch} />

        {/* Advanced Filters */}
        <DocumentFilters
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
          fiscalYears={fiscalYears}
          departments={departments}
          allocations={allocations}
          uploaders={uploaders}
          loading={optionsLoading || uploadersLoading}
        />

        {/* Table */}
        <DocumentTable
          documents={documents}
          loading={isLoading}
          pagination={pagination}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          role={role}
          currentUserId={currentUserId}
          onView={handleView}
          onDownload={handleDownload}
          onArchive={setArchiveTarget}
        />
      </div>

      {/* Archive Confirmation */}
      <DocumentArchiveDialog
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        isLoading={isArchiving}
        documentCode={archiveTarget?.documentCode}
      />

      {/* Upload Dialog */}
      <DocumentUploadDialog isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
}

export default DocumentList;
