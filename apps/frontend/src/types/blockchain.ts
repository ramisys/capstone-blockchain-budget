/**
 * Type definitions for the Blockchain Ledger module.
 *
 * Shapes mirror the backend `BlockchainRecord` model and the serialized API
 * responses returned by the blockchain controllers.
 */

import type { PaginationInfo } from './allocation';

export type BlockchainRecordStatus = 'Pending' | 'Confirmed' | 'Failed';

export interface BlockchainAllocationRef {
  id: string;
  allocationCode: string;
  status: string;
  allocatedAmount: number;
  department: { id: string; name: string; code: string } | null;
  fiscalYear: { id: string; code: string } | null;
}

export interface BlockchainRecord {
  id: string;
  allocationId: string;
  allocationCode: string;
  contentHash: string;
  txHash: string | null;
  txExplorerUrl?: string | null;
  blockNumber: number | null;
  network: string;
  status: BlockchainRecordStatus;
  confirmedAt: string | null;
  supersededAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  allocation?: BlockchainAllocationRef;
}

export interface BlockchainStatus {
  connected: boolean;
  network: string | null;
  chainId: number | null;
  latestBlock: number | null;
  lastSync: string | null;
  contractAddress: string | null;
  explorerUrl?: string | null;
  contractExplorerUrl?: string | null;
  onChainCount: number | null;
  message: string;
  recordCount: number;
  confirmedCount: number;
  pendingCount: number;
  failedCount: number;
}

export interface BlockchainOnChainRecord {
  exists: boolean;
  anchoredBy: string;
  anchoredAt: number;
  blockNumber: number;
}

export interface BlockchainVerification {
  verified: boolean;
  integrityOk: boolean | null;
  onChain: BlockchainOnChainRecord | null;
  inconclusive?: boolean;
  record: BlockchainRecord | null;
  message: string;
}

export interface BlockchainTransactionsResponse {
  transactions: BlockchainRecord[];
  pagination: PaginationInfo;
}

export interface BlockchainListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BlockchainRecordStatus;
  allocationId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Unified, type-aware ledger history. The backend merges allocation anchors
 * (BlockchainRecord), document anchors (DocumentVersion), and audit events
 * (AuditLog) into this single normalized shape.
 */
export type LedgerRecordType = 'Allocation' | 'Document' | 'Audit';

export interface LedgerHistoryEntry {
  id: string;
  recordType: LedgerRecordType;
  code: string;
  hash: string;
  txHash: string | null;
  txExplorerUrl?: string | null;
  blockNumber: number | null;
  network: string | null;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  supersededAt?: string | null;
  versionNumber?: number | null;
  allocationId?: string | null;
  ref: LedgerHistoryRef | null;
}

export interface LedgerHistoryRef {
  id: string | null;
  // Allocation
  allocationCode?: string;
  allocatedAmount?: number;
  department?: { id: string; name: string; code: string } | null;
  fiscalYear?: { id: string; code: string } | null;
  // Document
  documentCode?: string;
  title?: string;
  documentType?: string;
  originalFileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  // Shared status
  status?: string;
  // Audit
  action?: string;
  result?: string;
  actorEmail?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  resourceType?: string | null;
  resourceCode?: string | null;
  details?: Record<string, unknown> | null;
}

export type BlockchainTransactionDetail = LedgerHistoryEntry;

export interface BlockchainHistoryResponse {
  transactions: LedgerHistoryEntry[];
  pagination: PaginationInfo;
}

export interface BlockchainHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  recordType?: LedgerRecordType;
  status?: BlockchainRecordStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
