import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { documentApi } from '../services/documentService';
import { useToast } from '../components/ui/Toast';
import type {
  DocumentActivitiesResponse,
  DocumentReplaceData,
  DocumentUpdateData,
  DocumentUploadData,
  DocumentVerification,
  DocumentVersion,
  DocumentsResponse,
  ManagedDocument,
} from '../types/document';

const QUERY_KEYS = {
  documents: 'documents',
  document: 'document',
  versions: 'documentVersions',
  activities: 'documentActivities',
  verification: 'documentVerification',
};

function invalidateDocumentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string
) {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.documents] });
  if (id) {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.document, id] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.versions, id] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.activities, id] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.verification, id] });
  } else {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.document] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.versions] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.activities] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.verification] });
  }
}

function errorMessage(error: any, fallback: string): string {
  return error?.response?.data?.message || error?.message || fallback;
}

/**
 * Fetch documents with filtering, pagination, and sorting.
 */
export const useDocuments = (
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ordering: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'newest', sortOrder: 'asc' }
) => {
  return useQuery<AxiosResponse, Error, DocumentsResponse>({
    queryKey: [QUERY_KEYS.documents, filters, pagination, ordering],
    queryFn: () =>
      documentApi.getDocuments({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: ordering.sortBy,
        sortOrder: ordering.sortOrder,
      }),
    select: (response) => response.data?.data,
  });
};

/**
 * Fetch a single document by ID.
 */
export const useDocumentById = (id: string | undefined) => {
  return useQuery<AxiosResponse, Error, ManagedDocument>({
    queryKey: [QUERY_KEYS.document, id],
    queryFn: () => documentApi.getDocumentById(id!),
    enabled: !!id,
    select: (response) => response.data?.data?.document,
  });
};

/**
 * Fetch the version history of a document, newest first.
 */
export const useDocumentVersions = (id: string | undefined) => {
  return useQuery<AxiosResponse, Error, DocumentVersion[]>({
    queryKey: [QUERY_KEYS.versions, id],
    queryFn: () => documentApi.getDocumentVersions(id!),
    enabled: !!id,
    select: (response) => response.data?.data?.versions,
  });
};

/**
 * Fetch the persisted activity timeline of a document, newest first.
 */
export const useDocumentActivities = (id: string | undefined) => {
  return useQuery<AxiosResponse, Error, DocumentActivitiesResponse['activities']>({
    queryKey: [QUERY_KEYS.activities, id],
    queryFn: () => documentApi.getDocumentActivities(id!),
    enabled: !!id,
    select: (response) => response.data?.data?.activities,
  });
};

/**
 * Fetch (or recompute) the verification detail for a document version.
 */
export const useDocumentVerification = (id: string | undefined, version?: number) => {
  return useQuery<AxiosResponse, Error, DocumentVerification>({
    queryKey: [QUERY_KEYS.verification, id, version ?? null],
    queryFn: () => documentApi.verifyDocument(id!, version),
    enabled: !!id,
    select: (response) => response.data?.data,
    staleTime: 30 * 1000, // 30 s – deduplicate across co-mounted components
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Upload a new document (multipart).
 */
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: DocumentUploadData) => documentApi.uploadDocument(data),
    onSuccess: () => {
      invalidateDocumentQueries(queryClient);
      showToast('Document uploaded successfully', 'success');
    },
    onError: (error: any) => {
      showToast(errorMessage(error, 'Failed to upload document'), 'error');
    },
  });
};

/**
 * Update document metadata.
 */
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdateData }) =>
      documentApi.updateDocument(id, data),
    onSuccess: (_response, { id }) => {
      invalidateDocumentQueries(queryClient, id);
      showToast('Document updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(errorMessage(error, 'Failed to update document'), 'error');
    },
  });
};

/**
 * Replace the current version of a document with a new file.
 */
export const useReplaceDocument = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentReplaceData }) =>
      documentApi.replaceDocument(id, data),
    onSuccess: (_response, { id }) => {
      invalidateDocumentQueries(queryClient, id);
      showToast('Document version replaced successfully', 'success');
    },
    onError: (error: any) => {
      showToast(errorMessage(error, 'Failed to replace document version'), 'error');
    },
  });
};

/**
 * Archive + soft-delete a document (versions are kept).
 */
export const useArchiveDocument = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => documentApi.deleteDocument(id),
    onSuccess: (_response, id) => {
      invalidateDocumentQueries(queryClient, id);
      showToast('Document archived successfully', 'success');
    },
    onError: (error: any) => {
      showToast(errorMessage(error, 'Failed to archive document'), 'error');
    },
  });
};

/**
 * Re-run the verification computation for a document version. Returns the
 * fresh verification result so callers can update a dialog/panel.
 */
export const useVerifyDocument = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, version }: { id: string; version?: number }) =>
      documentApi.verifyDocument(id, version).then((response) => response.data?.data),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.verification, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.activities, id] });
      showToast(result.verified ? 'Document verified on the ledger' : 'Verification completed', 'success');
    },
    onError: (error: any) => {
      showToast(errorMessage(error, 'Failed to verify document'), 'error');
    },
  });
};

/**
 * Re-anchor a Pending/Failed document version on the ledger.
 */
export const useRetryDocumentVersion = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, version }: { id: string; version?: number }) =>
      documentApi.retryDocumentVersion(id, version),
    onSuccess: (_response, { id }) => {
      invalidateDocumentQueries(queryClient, id);
      showToast('Document version anchored successfully', 'success');
    },
    onError: (error: any) => {
      showToast(errorMessage(error, 'Failed to anchor document version'), 'error');
    },
  });
};
