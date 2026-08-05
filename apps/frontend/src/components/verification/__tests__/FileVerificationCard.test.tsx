import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { ExternalVerificationResult, FileVerificationCard } from '../FileVerificationCard';
import type { ExternalFileVerification } from '../../../types/verification';

vi.mock('../../../hooks/useFileVerification', () => ({
  useFileVerification: vi.fn(),
}));

import { useFileVerification } from '../../../hooks/useFileVerification';

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

describe('ExternalVerificationResult', () => {
  it('renders the verified state with matched document details', () => {
    render(<ExternalVerificationResult verification={mockResult} />);

    expect(screen.getByText('Verified on the ledger')).toBeInTheDocument();
    expect(screen.getByText('Verified against blockchain')).toBeInTheDocument();
    expect(screen.getByText('DOC-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Purchase Request - Laptops')).toBeInTheDocument();
    expect(screen.getByText('0xdeadbeef')).toBeInTheDocument();
  });

  it('renders the no-match state when verifiedAgainst is none', () => {
    render(
      <ExternalVerificationResult
        verification={{
          verified: false,
          integrityOk: false,
          onChain: null,
          inconclusive: false,
          message: 'No document in the system matches this file.',
          verifiedAgainst: 'none',
          matchedVersion: null,
        }}
      />
    );

    expect(screen.getByText('No matching document')).toBeInTheDocument();
    expect(screen.getByText('No database match')).toBeInTheDocument();
    expect(
      screen.getByText(/This file has not been uploaded to the system/)
    ).toBeInTheDocument();
  });

  it('renders the inconclusive state for a database match with no node', () => {
    render(
      <ExternalVerificationResult
        verification={{
          verified: false,
          integrityOk: true,
          onChain: null,
          inconclusive: true,
          message: 'On-chain verification is inconclusive.',
          verifiedAgainst: 'database',
          matchedVersion: mockResult.matchedVersion,
        }}
      />
    );

    expect(screen.getByText('Verification inconclusive')).toBeInTheDocument();
    expect(screen.getByText('Matched in database')).toBeInTheDocument();
  });

  it('renders an error message when the mutation failed', () => {
    render(<ExternalVerificationResult isError errorMessage="Unsupported file type" />);
    expect(screen.getByText('Unsupported file type')).toBeInTheDocument();
  });
});

describe('FileVerificationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFileVerification).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(mockResult),
      isPending: false,
      error: null,
      reset: vi.fn(),
      data: undefined,
    } as any);
  });

  it('disables the verify button until a file is chosen', () => {
    render(<FileVerificationCard />);
    expect(screen.getByRole('button', { name: /Verify File/ })).toBeDisabled();
  });

  it('enables verification and calls the mutation with the selected file', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(mockResult);
    vi.mocked(useFileVerification).mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
      reset: vi.fn(),
      data: undefined,
    } as any);

    render(<FileVerificationCard />);

    const file = new File(['laptops'], 'pr-laptops.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });

    const verifyButton = screen.getByRole('button', { name: /Verify File/ });
    expect(verifyButton).toBeEnabled();

    fireEvent.click(verifyButton);

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(file));
  });

  it('renders the result after a successful verification', async () => {
    vi.mocked(useFileVerification).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(mockResult),
      isPending: false,
      error: null,
      reset: vi.fn(),
      data: mockResult,
    } as any);

    render(<FileVerificationCard />);

    expect(screen.getByText('Verified on the ledger')).toBeInTheDocument();
    expect(screen.getByText('DOC-2026-0001')).toBeInTheDocument();
  });

  it('renders an inline error when the mutation fails', () => {
    vi.mocked(useFileVerification).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue({}),
      isPending: false,
      error: { response: { data: { message: 'Unsupported file type' } } },
      reset: vi.fn(),
      data: undefined,
    } as any);

    render(<FileVerificationCard />);

    expect(screen.getByText('Unsupported file type')).toBeInTheDocument();
  });
});
