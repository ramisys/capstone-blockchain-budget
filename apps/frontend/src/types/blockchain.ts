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
