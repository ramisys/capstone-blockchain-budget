import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFileVerification } from '../useFileVerification';
import { verificationApi } from '../../services/verificationService';
import type { ExternalFileVerification } from '../../types/verification';

vi.mock('../../services/verificationService', () => ({
  verificationApi: {
    verifyExternalFile: vi.fn(),
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

const mockResult: ExternalFileVerification = {
  verified: true,
  integrityOk: true,
  onChain: { exists: true, anchoredBy: '0xaaa', anchoredAt: 1710000000, blockNumber: 42 },
  inconclusive: false,
  message: 'File verified on the blockchain ledger.',
  verifiedAgainst: 'blockchain',
  matchedVersion: {
    id: 'ver-1',
    documentId: 'doc-1',
    versionNumber: 1,
    originalFileName: 'pr-laptops.pdf',
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
    uploadedBy: 'user-1',
    uploadedAt: '2026-08-04T08:00:00.000Z',
    createdAt: '2026-08-04T08:00:00.000Z',
    document: {
      id: 'doc-1',
      documentCode: 'DOC-2026-0001',
      title: 'Purchase Request - Laptops',
      documentType: 'PurchaseRequest',
      status: 'Active',
    },
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useFileVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies a file and resolves the result', async () => {
    vi.mocked(verificationApi.verifyExternalFile).mockResolvedValueOnce({
      data: { data: mockResult },
    } as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFileVerification(), { wrapper });

    const file = new File(['laptops'], 'pr-laptops.pdf', { type: 'application/pdf' });
    await result.current.mutateAsync(file);

    expect(verificationApi.verifyExternalFile).toHaveBeenCalledWith(file);
    await waitFor(() => {
      expect(result.current.data?.verified).toBe(true);
    });
    expect(result.current.data?.verifiedAgainst).toBe('blockchain');
  });

  it('shows an error toast with the backend message on failure', async () => {
    vi.mocked(verificationApi.verifyExternalFile).mockRejectedValueOnce({
      response: { data: { message: 'Unsupported file type' } },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFileVerification(), { wrapper });

    const file = new File(['x'], 'bad.exe', { type: 'application/octet-stream' });
    try {
      await result.current.mutateAsync(file);
    } catch {
      // Expected mutation failure
    }

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Unsupported file type', 'error');
    });
  });
});
