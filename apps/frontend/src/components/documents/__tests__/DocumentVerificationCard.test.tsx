import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import {
  DocumentVerificationContent,
  DocumentVerificationCard,
} from '../DocumentVerificationCard';
import { ROLES } from '../../../constants/roles';
import type { DocumentVerification } from '../../../types/document';

vi.mock('../../../hooks/useDocuments', () => ({
  useDocumentVerification: vi.fn(),
  useVerifyDocument: vi.fn(),
  useRetryDocumentVersion: vi.fn(),
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import {
  useDocumentVerification,
  useVerifyDocument,
  useRetryDocumentVersion,
} from '../../../hooks/useDocuments';
import { useAuth } from '../../../hooks/useAuth';

const mockVersion = {
  id: 'ver-1',
  documentId: 'doc-1',
  versionNumber: 1,
  originalFileName: 'pr-laptops.pdf',
  storageKey: 'doc-1/1/pr-laptops.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 102400,
  fileExtension: 'pdf',
  sha256Hash: 'abc123',
  blockchainStatus: 'Confirmed' as const,
  txHash: '0xdeadbeef',
  txExplorerUrl: null,
  blockNumber: 42,
  network: 'hardhat',
  confirmedAt: '2026-08-04T08:00:00.000Z',
  replaceReason: null,
  uploadedBy: 'user-1',
  uploadedAt: '2026-08-04T08:00:00.000Z',
  createdAt: '2026-08-04T08:00:00.000Z',
};

const mockVerification: DocumentVerification = {
  verified: true,
  integrityOk: true,
  onChain: null,
  message: 'Document verified on the ledger.',
  documentCode: 'DOC-2026-0001',
  version: mockVersion,
};

describe('DocumentVerificationContent', () => {
  it('renders loading skeletons while fetching', () => {
    render(
      <DocumentVerificationContent
        verification={undefined}
        isLoading
        isError={false}
        isVerifying={false}
        isRetrying={false}
        canRetry={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
      />
    );
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows an error message when the query fails', () => {
    render(
      <DocumentVerificationContent
        verification={undefined}
        isLoading={false}
        isError
        errorMessage="Ledger unavailable"
        isVerifying={false}
        isRetrying={false}
        canRetry={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
      />
    );
    expect(screen.getByText('Ledger unavailable')).toBeInTheDocument();
  });

  it('renders the verified version details and integrity result', () => {
    render(
      <DocumentVerificationContent
        verification={mockVerification}
        isLoading={false}
        isError={false}
        isVerifying={false}
        isRetrying={false}
        canRetry={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
      />
    );

    expect(screen.getByText('Verified on the ledger')).toBeInTheDocument();
    expect(screen.getByText('0xdeadbeef')).toBeInTheDocument();
    expect(screen.getByText('Hash matches stored file')).toBeInTheDocument();
  });

  it('shows the not-verified state when no version exists', () => {
    render(
      <DocumentVerificationContent
        verification={{
          verified: false,
          integrityOk: null,
          onChain: null,
          message: 'No version is available for verification yet.',
          documentCode: 'DOC-2026-0001',
          version: null,
        }}
        isLoading={false}
        isError={false}
        isVerifying={false}
        isRetrying={false}
        canRetry={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
      />
    );

    expect(screen.getByText('Not verified')).toBeInTheDocument();
    expect(
      screen.getAllByText(/No version is available for verification yet/).length
    ).toBeGreaterThan(0);
  });

  it('shows an inconclusive state when the on-chain node is unreachable', () => {
    render(
      <DocumentVerificationContent
        verification={{
          verified: false,
          integrityOk: true,
          onChain: null,
          inconclusive: true,
          message: 'On-chain verification is inconclusive — the node is unreachable.',
          documentCode: 'DOC-2026-0001',
          version: mockVersion,
        }}
        isLoading={false}
        isError={false}
        isVerifying={false}
        isRetrying={false}
        canRetry={false}
        onVerify={() => undefined}
        onRetry={() => undefined}
      />
    );

    expect(screen.getByText('Verification inconclusive')).toBeInTheDocument();
  });
});

describe('DocumentVerificationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDocumentVerification).mockReturnValue({
      data: mockVerification,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    vi.mocked(useVerifyDocument).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);
    vi.mocked(useRetryDocumentVersion).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);
    vi.mocked(useAuth).mockReturnValue({
      hasRole: vi.fn(() => true),
    } as any);
  });

  it('runs verify when the Verify Now button is clicked', async () => {
    const verify = vi.fn().mockResolvedValue({});
    vi.mocked(useVerifyDocument).mockReturnValue({
      mutateAsync: verify,
      isPending: false,
    } as any);

    render(<DocumentVerificationCard documentId="doc-1" documentCode="DOC-2026-0001" />);

    fireEvent.click(screen.getByRole('button', { name: /Verify Now/ }));

    await waitFor(() => expect(verify).toHaveBeenCalledWith({ id: 'doc-1', version: undefined }));
  });

  it('shows a Retry Anchor button for retry-allowed roles on a pending version', () => {
    vi.mocked(useDocumentVerification).mockReturnValue({
      data: { ...mockVerification, version: { ...mockVersion, blockchainStatus: 'Pending' } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(useAuth).mockReturnValue({
      hasRole: vi.fn((...roles: string[]) =>
        roles.includes(ROLES.ADMINISTRATOR) || roles.includes(ROLES.TREASURER)
      ),
    } as any);

    render(<DocumentVerificationCard documentId="doc-1" documentCode="DOC-2026-0001" />);

    expect(screen.getByRole('button', { name: /Retry Anchor/ })).toBeInTheDocument();
  });

  it('hides Retry Anchor for an Auditor (not in retry roles)', () => {
    vi.mocked(useDocumentVerification).mockReturnValue({
      data: { ...mockVerification, version: { ...mockVersion, blockchainStatus: 'Failed' } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(useAuth).mockReturnValue({
      hasRole: vi.fn(() => false),
    } as any);

    render(<DocumentVerificationCard documentId="doc-1" documentCode="DOC-2026-0001" />);

    expect(screen.queryByRole('button', { name: /Retry Anchor/ })).not.toBeInTheDocument();
  });

  it('re-anchors via the Retry Anchor button', async () => {
    const retry = vi.fn().mockResolvedValue({});
    vi.mocked(useDocumentVerification).mockReturnValue({
      data: { ...mockVerification, version: { ...mockVersion, blockchainStatus: 'Pending' } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    vi.mocked(useRetryDocumentVersion).mockReturnValue({
      mutateAsync: retry,
      isPending: false,
    } as any);

    render(<DocumentVerificationCard documentId="doc-1" documentCode="DOC-2026-0001" />);

    fireEvent.click(screen.getByRole('button', { name: /Retry Anchor/ }));

    await waitFor(() => expect(retry).toHaveBeenCalledWith({ id: 'doc-1', version: undefined }));
  });
});
