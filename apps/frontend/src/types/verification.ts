/**
 * Type definitions for external file verification (Phase 4.6 M6).
 *
 * Mirrors the backend `verifyExternalFile` response: a user-uploaded file is
 * hashed and matched against stored document hashes without being persisted.
 */

import type { BlockchainOnChainRecord } from './blockchain';

export type VerificationAgainst = 'blockchain' | 'database' | 'none';

export interface ExternalMatchedDocumentRef {
  id: string;
  documentCode: string;
  title: string;
  documentType: string;
  status: string;
}

export interface ExternalMatchedVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileExtension: string;
  sha256Hash: string;
  blockchainStatus: string;
  txHash: string | null;
  txExplorerUrl?: string | null;
  blockNumber: number | null;
  network: string | null;
  confirmedAt: string | null;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  document?: ExternalMatchedDocumentRef | null;
}

export interface ExternalFileVerification {
  verified: boolean;
  integrityOk: boolean | null;
  onChain: BlockchainOnChainRecord | null;
  inconclusive?: boolean;
  message: string;
  verifiedAgainst: VerificationAgainst;
  matchedVersion: ExternalMatchedVersion | null;
}
