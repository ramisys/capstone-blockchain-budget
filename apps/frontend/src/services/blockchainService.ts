import type { AxiosResponse } from 'axios';
import apiClient from '../api/apiClient';
import type {
  BlockchainListParams,
  BlockchainRecord,
  BlockchainStatus,
  BlockchainTransactionsResponse,
  BlockchainVerification,
} from '../types/blockchain';

interface ApiEnvelope<T> {
  data: T;
}

export const blockchainApi = {
  // Get the blockchain ledger status with record statistics
  getStatus(): Promise<AxiosResponse<ApiEnvelope<{ blockchainStatus: BlockchainStatus }>>> {
    return apiClient.get('/blockchain/status');
  },

  // Get paginated blockchain transaction history with filters and sorting
  getTransactions(
    params: BlockchainListParams
  ): Promise<AxiosResponse<ApiEnvelope<BlockchainTransactionsResponse>>> {
    return apiClient.get('/blockchain/transactions', { params });
  },

  // Get the verification record for a single allocation without recomputing
  getAllocationVerification(
    id: string
  ): Promise<AxiosResponse<ApiEnvelope<BlockchainVerification>>> {
    return apiClient.get(`/blockchain/allocations/${id}`);
  },

  // Recompute and check an allocation against the stored record and the ledger
  verifyAllocation(id: string): Promise<AxiosResponse<ApiEnvelope<BlockchainVerification>>> {
    return apiClient.post(`/blockchain/allocations/${id}/verify`);
  },

  // Re-anchor a Pending/Failed record on the ledger
  retryRecord(id: string): Promise<AxiosResponse<ApiEnvelope<{ record: BlockchainRecord }>>> {
    return apiClient.post(`/blockchain/allocations/${id}/retry`);
  },
};
