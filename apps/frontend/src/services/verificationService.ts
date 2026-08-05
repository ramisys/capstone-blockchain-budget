import type { AxiosResponse } from 'axios';
import apiClient from '../api/apiClient';
import type { ExternalFileVerification } from '../types/verification';

interface ApiEnvelope<T> {
  data: T;
}

export const verificationApi = {
  /**
   * Verify a user-uploaded file against stored document hashes and the
   * blockchain ledger. The file is streamed on the server and never stored.
   */
  verifyExternalFile(file: File): Promise<AxiosResponse<ApiEnvelope<ExternalFileVerification>>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/verification/documents', formData);
  },
};
