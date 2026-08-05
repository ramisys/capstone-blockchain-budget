import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useDocuments,
  useDocumentById,
  useDocumentVersions,
  useDocumentActivities,
  useDocumentVerification,
  useUploadDocument,
  useUpdateDocument,
  useReplaceDocument,
  useArchiveDocument,
  useVerifyDocument,
  useRetryDocumentVersion,
} from '../useDocuments';
import { documentApi } from '../../services/documentService';
import type { DocumentsResponse } from '../../types/document';

vi.mock('../../services/documentService', () => ({
  documentApi: {
    getDocuments: vi.fn(),
    getDocumentById: vi.fn(),
    getDocumentVersions: vi.fn(),
    getDocumentActivities: vi.fn(),
    verifyDocument: vi.fn(),
    uploadDocument: vi.fn(),
    updateDocument: vi.fn(),
    replaceDocument: vi.fn(),
    deleteDocument: vi.fn(),
    retryDocumentVersion: vi.fn(),
  },
}));

const mockShowToast = vi.fn();
vi.mock('../../components/ui/Toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

const mockDocuments: DocumentsResponse = {
  documents: [
    {
      id: 'doc-1',
      documentCode: 'DOC-2026-0001',
      title: 'Purchase Request - Laptops',
      documentType: 'PurchaseRequest',
      status: 'Active',
      uploadedBy: 'user-1',
      createdAt: '2026-08-04T08:00:00.000Z',
      updatedAt: '2026-08-04T08:00:00.000Z',
      currentVersion: {
        id: 'ver-1',
        documentId: 'doc-1',
        versionNumber: 1,
        originalFileName: 'pr-laptops.pdf',
        storageKey: 'doc-1/1/pr-laptops.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 102400,
        fileExtension: 'pdf',
        sha256Hash: 'abc123',
        blockchainStatus: 'Confirmed',
        txHash: '0xdeadbeef',
        txExplorerUrl: null,
        blockNumber: 42,
        network: 'hardhat',
        confirmedAt: '2026-08-04T08:00:00.000Z',
        replaceReason: null,
        uploadedBy: 'user-1',
        uploadedAt: '2026-08-04T08:00:00.000Z',
        createdAt: '2026-08-04T08:00:00.000Z',
      },
      _count: { versions: 1 },
    },
  ],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useDocuments hook suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useDocuments', () => {
    it('fetches documents with filters, pagination, and ordering', async () => {
      vi.mocked(documentApi.getDocuments).mockResolvedValueOnce({
        data: { data: mockDocuments },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () =>
          useDocuments(
            { search: 'laptops', documentType: 'PurchaseRequest' },
            { page: 2, limit: 25 },
            { sortBy: 'newest', sortOrder: 'desc' }
          ),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(documentApi.getDocuments).toHaveBeenCalledWith({
        search: 'laptops',
        documentType: 'PurchaseRequest',
        page: 2,
        limit: 25,
        sortBy: 'newest',
        sortOrder: 'desc',
      });
      expect(result.current.data?.documents).toHaveLength(1);
      expect(result.current.data?.documents[0].documentCode).toBe('DOC-2026-0001');
    });
  });

  describe('useDocumentById', () => {
    it('fetches a single document and unwraps document', async () => {
      vi.mocked(documentApi.getDocumentById).mockResolvedValueOnce({
        data: { data: { document: mockDocuments.documents[0] } },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDocumentById('doc-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(documentApi.getDocumentById).toHaveBeenCalledWith('doc-1');
      expect(result.current.data?.documentCode).toBe('DOC-2026-0001');
    });

    it('does not fetch when id is undefined', () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDocumentById(undefined), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(documentApi.getDocumentById).not.toHaveBeenCalled();
    });
  });

  describe('useDocumentVersions', () => {
    it('fetches version history', async () => {
      vi.mocked(documentApi.getDocumentVersions).mockResolvedValueOnce({
        data: { data: { versions: mockDocuments.documents[0].currentVersion ? [mockDocuments.documents[0].currentVersion] : [] } },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDocumentVersions('doc-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(documentApi.getDocumentVersions).toHaveBeenCalledWith('doc-1');
      expect(result.current.data).toHaveLength(1);
    });
  });

  describe('useDocumentActivities', () => {
    it('fetches the activity timeline', async () => {
      vi.mocked(documentApi.getDocumentActivities).mockResolvedValueOnce({
        data: {
          data: {
            activities: [
              {
                id: 'act-1',
                documentId: 'doc-1',
                actorId: 'user-1',
                action: 'UPLOAD',
                createdAt: '2026-08-04T08:00:00.000Z',
              },
            ],
          },
        },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDocumentActivities('doc-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].action).toBe('UPLOAD');
    });
  });

  describe('useDocumentVerification', () => {
    it('fetches verification detail with a version param', async () => {
      vi.mocked(documentApi.verifyDocument).mockResolvedValueOnce({
        data: {
          data: {
            verified: true,
            integrityOk: true,
            onChain: null,
            message: 'Document verified',
            documentCode: 'DOC-2026-0001',
            version: mockDocuments.documents[0].currentVersion,
          },
        },
      } as any);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDocumentVerification('doc-1', 1), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(documentApi.verifyDocument).toHaveBeenCalledWith('doc-1', 1);
      expect(result.current.data?.verified).toBe(true);
    });
  });

  describe('useUploadDocument', () => {
    it('uploads, invalidates caches, and shows a success toast', async () => {
      vi.mocked(documentApi.uploadDocument).mockResolvedValueOnce({ data: { success: true } } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUploadDocument(), { wrapper });

      await result.current.mutateAsync({
        file: new File(['x'], 'pr.pdf', { type: 'application/pdf' }),
        title: 'Purchase Request',
        documentType: 'PurchaseRequest',
      });

      expect(documentApi.uploadDocument).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Document uploaded successfully', 'success');
    });
  });

  describe('useUpdateDocument', () => {
    it('updates metadata, invalidates, and shows a success toast', async () => {
      vi.mocked(documentApi.updateDocument).mockResolvedValueOnce({ data: { success: true } } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateDocument(), { wrapper });

      await result.current.mutateAsync({
        id: 'doc-1',
        data: { title: 'Updated title' },
      });

      expect(documentApi.updateDocument).toHaveBeenCalledWith('doc-1', { title: 'Updated title' });
      expect(invalidateSpy).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Document updated successfully', 'success');
    });

    it('shows a toast with the backend message on error', async () => {
      vi.mocked(documentApi.updateDocument).mockRejectedValueOnce({
        response: { data: { message: 'Document not found' } },
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateDocument(), { wrapper });

      try {
        await result.current.mutateAsync({ id: 'doc-nope', data: { title: 'x' } });
      } catch {
        // Expected mutation failure
      }

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Document not found', 'error');
      });
    });
  });

  describe('useReplaceDocument', () => {
    it('replaces a version, invalidates, and shows a success toast', async () => {
      vi.mocked(documentApi.replaceDocument).mockResolvedValueOnce({ data: { success: true } } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useReplaceDocument(), { wrapper });

      await result.current.mutateAsync({
        id: 'doc-1',
        data: { file: new File(['y'], 'po.pdf', { type: 'application/pdf' }) },
      });

      expect(documentApi.replaceDocument).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Document version replaced successfully', 'success');
    });
  });

  describe('useArchiveDocument', () => {
    it('archives, invalidates, and shows a success toast', async () => {
      vi.mocked(documentApi.deleteDocument).mockResolvedValueOnce({ data: { success: true } } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useArchiveDocument(), { wrapper });

      await result.current.mutateAsync('doc-1');

      expect(documentApi.deleteDocument).toHaveBeenCalledWith('doc-1');
      expect(invalidateSpy).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Document archived successfully', 'success');
    });
  });

  describe('useVerifyDocument', () => {
    it('verifies a document and shows a success toast', async () => {
      vi.mocked(documentApi.verifyDocument).mockResolvedValueOnce({
        data: { data: { verified: true, integrityOk: true, onChain: null, message: 'ok' } },
      } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useVerifyDocument(), { wrapper });

      await result.current.mutateAsync({ id: 'doc-1', version: 1 });

      expect(documentApi.verifyDocument).toHaveBeenCalledWith('doc-1', 1);
      expect(invalidateSpy).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Document verified on the ledger', 'success');
    });
  });

  describe('useRetryDocumentVersion', () => {
    it('re-anchors a version, invalidates, and shows a success toast', async () => {
      vi.mocked(documentApi.retryDocumentVersion).mockResolvedValueOnce({ data: { success: true } } as any);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useRetryDocumentVersion(), { wrapper });

      await result.current.mutateAsync({ id: 'doc-1', version: 1 });

      expect(documentApi.retryDocumentVersion).toHaveBeenCalledWith('doc-1', 1);
      expect(invalidateSpy).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Document version anchored successfully', 'success');
    });
  });
});
