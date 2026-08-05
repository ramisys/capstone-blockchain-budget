import type { AxiosResponse } from 'axios';
import apiClient from '../api/apiClient';
import type {
  DocumentActivitiesResponse,
  DocumentListParams,
  DocumentReplaceData,
  DocumentType,
  DocumentUpdateData,
  DocumentUploadData,
  DocumentVerification,
  DocumentVersion,
  DocumentVersionsResponse,
  DocumentsResponse,
  ManagedDocument,
} from '../types/document';

interface ApiEnvelope<T> {
  data: T;
}

export const documentApi = {
  // Get documents with filtering, pagination, and sorting
  getDocuments(params: DocumentListParams): Promise<AxiosResponse<ApiEnvelope<DocumentsResponse>>> {
    return apiClient.get('/documents', { params });
  },

  // Get a single document by ID (includes current version + verification status)
  getDocumentById(id: string): Promise<AxiosResponse<ApiEnvelope<{ document: ManagedDocument }>>> {
    return apiClient.get(`/documents/${id}`);
  },

  // Upload a new document (multipart: file + metadata)
  uploadDocument(data: DocumentUploadData): Promise<AxiosResponse<ApiEnvelope<{ document: ManagedDocument }>>> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    formData.append('documentType', data.documentType);
    if (data.description) formData.append('description', data.description);
    if (data.allocationId) formData.append('allocationId', data.allocationId);
    if (data.fiscalYearId) formData.append('fiscalYearId', data.fiscalYearId);
    if (data.departmentId) formData.append('departmentId', data.departmentId);
    return apiClient.post('/documents', formData);
  },

  // Update document metadata
  updateDocument(id: string, data: DocumentUpdateData): Promise<AxiosResponse<ApiEnvelope<{ document: ManagedDocument }>>> {
    return apiClient.put(`/documents/${id}`, data);
  },

  // Replace the current version with a new file (multipart)
  replaceDocument(id: string, data: DocumentReplaceData): Promise<AxiosResponse<ApiEnvelope<{ document: ManagedDocument; version: DocumentVersion }>>> {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.replaceReason) formData.append('replaceReason', data.replaceReason);
    return apiClient.post(`/documents/${id}/replace`, formData);
  },

  // Archive + soft-delete a document (versions are kept)
  deleteDocument(id: string): Promise<AxiosResponse<ApiEnvelope<{ message: string }>>> {
    return apiClient.delete(`/documents/${id}`);
  },

  // Get the full version history of a document
  getDocumentVersions(id: string): Promise<AxiosResponse<ApiEnvelope<DocumentVersionsResponse>>> {
    return apiClient.get(`/documents/${id}/versions`);
  },

  // Get the persisted activity timeline of a document
  getDocumentActivities(id: string): Promise<AxiosResponse<ApiEnvelope<DocumentActivitiesResponse>>> {
    return apiClient.get(`/documents/${id}/activity`);
  },

  // Verify a document version's integrity and on-chain anchor
  verifyDocument(id: string, version?: number): Promise<AxiosResponse<ApiEnvelope<DocumentVerification>>> {
    return apiClient.get(`/documents/${id}/verify`, {
      params: version ? { version } : undefined,
    });
  },

  // Re-anchor a Pending/Failed document version on the ledger
  retryDocumentVersion(id: string, version?: number): Promise<AxiosResponse<ApiEnvelope<{ version: DocumentVersion }>>> {
    return apiClient.post(`/documents/${id}/retry`, undefined, {
      params: version ? { version } : undefined,
    });
  },

  // Download a document version as a binary attachment
  downloadDocument(id: string, version?: number): Promise<AxiosResponse<Blob>> {
    return apiClient.get(`/documents/${id}/download`, {
      params: version ? { version } : undefined,
      responseType: 'blob',
    });
  },

  // Preview a document inline (PDFs and images only)
  previewDocument(id: string): Promise<AxiosResponse<Blob>> {
    return apiClient.get(`/documents/${id}/preview`, {
      responseType: 'blob',
    });
  },
};

export interface DocumentTypeOption {
  value: DocumentType;
  label: string;
}

/**
 * Trigger a browser download for an in-memory blob using the server-provided
 * filename. Authenticated fetches (which cannot be opened via `window.open`)
 * rely on this helper.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Open an authenticated blob (e.g. a PDF preview) in a new browser tab.
 */
export function openBlobPreview(blob: Blob): void {
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  // Revoke after a tick so the new tab has time to load the object URL.
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}
