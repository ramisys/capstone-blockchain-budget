/**
 * Type definitions for the Document Management module.
 *
 * Shapes mirror the backend `ManagedDocument`, `DocumentVersion`, and
 * `DocumentActivity` models plus the serialized API responses returned by the
 * document controllers (BigInt values are already converted to plain numbers).
 */

import type { BlockchainOnChainRecord, BlockchainRecordStatus } from './blockchain';
import type { PaginationInfo } from './allocation';

export type { PaginationInfo };

export type DocumentType =
  | 'PurchaseRequest'
  | 'PurchaseOrder'
  | 'Quotation'
  | 'Receipt'
  | 'Invoice'
  | 'DisbursementVoucher'
  | 'LiquidationReport'
  | 'BudgetProposal'
  | 'Contract'
  | 'Other';

export type DocumentStatus = 'Active' | 'Archived';

export type DocumentActivityAction =
  | 'UPLOAD'
  | 'METADATA_UPDATE'
  | 'REPLACE'
  | 'ARCHIVE'
  | 'VERIFY'
  | 'ANCHOR_RETRY';

export interface UserRef {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface FiscalYearRef {
  id: string;
  code: string;
  startDate?: string;
  endDate?: string;
}

export interface DepartmentRef {
  id: string;
  code: string;
  name: string;
}

export interface AllocationRef {
  id: string;
  allocationCode: string;
  status?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  fileExtension: string;
  sha256Hash: string;
  blockchainStatus: BlockchainRecordStatus;
  txHash: string | null;
  txExplorerUrl?: string | null;
  blockNumber: number | null;
  network: string | null;
  confirmedAt: string | null;
  replaceReason: string | null;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  uploader?: UserRef;
}

export interface ManagedDocument {
  id: string;
  documentCode: string;
  title: string;
  description?: string | null;
  documentType: DocumentType;
  status: DocumentStatus;
  currentVersionId?: string | null;
  fiscalYearId?: string | null;
  departmentId?: string | null;
  allocationId?: string | null;
  uploadedBy: string;
  archivedBy?: string | null;
  archivedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  uploader?: UserRef;
  archiver?: UserRef | null;
  fiscalYear?: FiscalYearRef | null;
  department?: DepartmentRef | null;
  allocation?: AllocationRef | null;
  currentVersion?: DocumentVersion | null;
  _count?: { versions: number };
}

export interface DocumentActivity {
  id: string;
  documentId: string;
  versionId?: string | null;
  actorId: string;
  action: DocumentActivityAction;
  details?: Record<string, unknown> | null;
  createdAt: string;
  actor?: UserRef;
}

export interface DocumentVerification {
  verified: boolean;
  integrityOk: boolean | null;
  onChain: BlockchainOnChainRecord | null;
  inconclusive?: boolean;
  message: string;
  documentCode?: string;
  version?: DocumentVersion | null;
}

export interface DocumentsResponse {
  documents: ManagedDocument[];
  pagination: PaginationInfo;
}

export interface DocumentVersionsResponse {
  versions: DocumentVersion[];
}

export interface DocumentActivitiesResponse {
  activities: DocumentActivity[];
}

export interface DocumentListParams {
  page?: number;
  limit?: number;
  search?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  blockchainStatus?: BlockchainRecordStatus;
  fiscalYearId?: string;
  departmentId?: string;
  allocationId?: string;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentUploadData {
  file: File;
  title: string;
  documentType: DocumentType;
  description?: string;
  allocationId?: string;
  fiscalYearId?: string;
  departmentId?: string;
}

export interface DocumentUpdateData {
  title?: string;
  description?: string;
  documentType?: DocumentType;
  allocationId?: string | null;
  departmentId?: string | null;
  fiscalYearId?: string | null;
}

export interface DocumentReplaceData {
  file: File;
  replaceReason?: string;
}
