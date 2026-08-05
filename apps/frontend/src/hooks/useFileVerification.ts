import { useMutation } from '@tanstack/react-query';
import { verificationApi } from '../services/verificationService';
import { useToast } from '../components/ui/Toast';
import type { ExternalFileVerification } from '../types/verification';

function errorMessage(error: any, fallback: string): string {
  return error?.response?.data?.message || error?.message || fallback;
}

/**
 * Verify a user-uploaded file against stored document hashes and the ledger.
 * Returns the verification result so the caller can render it.
 */
export const useFileVerification = () => {
  const { showToast } = useToast();

  return useMutation<ExternalFileVerification, any, File>({
    mutationFn: (file) =>
      verificationApi.verifyExternalFile(file).then((response) => response.data?.data),
    onError: (error) => {
      showToast(errorMessage(error, 'Failed to verify file'), 'error');
    },
  });
};
