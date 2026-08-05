import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor, fireEvent, createTestAuthValue } from '../../../test/test-utils';
import { AuditLogs } from '../AuditLogs';
import type { AuditLog, AuditLogSummary } from '../../../types/audit';

const { logsHook, logHook, summaryHook, retryHook } = vi.hoisted(() => ({
  logsHook: vi.fn(),
  logHook: vi.fn(),
  summaryHook: vi.fn(),
  retryHook: vi.fn(),
}));

vi.mock('../../../hooks/useAuditLogs', () => ({
  useAuditLogs: logsHook,
  useAuditLog: logHook,
  useAuditLogSummary: summaryHook,
  useRetryAuditLog: retryHook,
}));

const mockLog: AuditLog = {
  id: 'log-1',
  action: 'AUTH_LOGIN',
  result: 'Success',
  actorId: 'user-1',
  actorEmail: 'admin@university.edu',
  actorRole: 'Administrator',
  ip: '127.0.0.1',
  userAgent: null,
  resourceType: 'User',
  resourceId: 'user-1',
  resourceCode: null,
  details: { foo: 'bar' },
  eventHash: 'a'.repeat(64),
  anchorStatus: 'Confirmed',
  txHash: '0xdeadbeef',
  blockNumber: 42,
  createdAt: '2026-08-06T08:00:00.000Z',
  updatedAt: '2026-08-06T08:00:00.000Z',
};

const mockLog2: AuditLog = {
  ...mockLog,
  id: 'log-2',
  action: 'ALLOCATION_CREATE',
  result: 'Failure',
  actorEmail: 'treasurer@university.edu',
  anchorStatus: 'Pending',
  txHash: null,
  blockNumber: null,
  createdAt: '2026-08-06T09:00:00.000Z',
};

const mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

const mockSummary: AuditLogSummary = {
  total: 10,
  successCount: 8,
  failureCount: 2,
  pendingAnchors: 3,
  byAction: [{ action: 'AUTH_LOGIN', count: 5 }],
};

function defaultMocks() {
  summaryHook.mockReturnValue({ data: mockSummary, isLoading: false, error: null });
  logsHook.mockReturnValue({
    data: { logs: [mockLog, mockLog2], pagination: mockPagination },
    isLoading: false,
    isError: false,
    error: null,
  });
  logHook.mockReturnValue({ data: mockLog, isLoading: false, isError: false, error: null });
  retryHook.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ data: { data: { log: mockLog } } }),
    isPending: false,
  });
}

describe('AuditLogs page integration suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
  });

  it('renders the header, summary cards, and audit log rows', () => {
    renderWithProviders(<AuditLogs />);

    expect(screen.getByRole('heading', { name: 'Audit Trail' })).toBeInTheDocument();

    expect(screen.getByText('Total Entries')).toBeInTheDocument();
    expect(screen.getByText('Successful')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Pending Anchors')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    expect(screen.getByText('User Login')).toBeInTheDocument();
    expect(screen.getByText('AUTH_LOGIN')).toBeInTheDocument();
    expect(screen.getByText('Allocation Created')).toBeInTheDocument();
    expect(screen.getByText('admin@university.edu')).toBeInTheDocument();
    expect(screen.getAllByText('Success').length).toBeGreaterThan(0);
    expect(screen.getByText('Failure')).toBeInTheDocument();
  });

  it('reports a load error instead of the table', () => {
    logsHook.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load audit logs'),
    });

    renderWithProviders(<AuditLogs />);

    expect(screen.getByText('Failed to load audit logs')).toBeInTheDocument();
    expect(screen.queryByText('AUTH_LOGIN')).not.toBeInTheDocument();
  });

  it('opens the detail dialog when a Details button is clicked', async () => {
    renderWithProviders(<AuditLogs />);

    fireEvent.click(screen.getAllByRole('button', { name: /Details/ })[0]);

    expect((await screen.findAllByText('Audit Log Details')).length).toBeGreaterThan(0);
    expect(logHook).toHaveBeenCalledWith('log-1');
    expect(screen.getByText(/"foo": "bar"/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockLog.eventHash))).toBeInTheDocument();
  });

  it('opens the detail dialog when a row is clicked', async () => {
    renderWithProviders(<AuditLogs />);

    fireEvent.click(screen.getByText('AUTH_LOGIN'));

    expect((await screen.findAllByText('Audit Log Details')).length).toBeGreaterThan(0);
  });

  it('wires the result filter into the logs query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditLogs />);

    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[1]);
    const successOption = await screen.findByRole('option', { name: 'Success' });
    await user.click(successOption);

    await waitFor(() => {
      expect(logsHook).toHaveBeenCalledWith(
        { search: undefined, result: 'Success' },
        { page: 1, limit: 10 },
        { sortBy: 'newest', sortOrder: 'desc' }
      );
    });
  });

  it('wires the debounced search box into the logs query', async () => {
    renderWithProviders(<AuditLogs />);

    fireEvent.change(screen.getByPlaceholderText('Search by action, actor, or resource...'), {
      target: { value: 'login' },
    });

    await waitFor(() => {
      expect(logsHook).toHaveBeenCalledWith(
        { search: 'login' },
        { page: 1, limit: 10 },
        { sortBy: 'newest', sortOrder: 'desc' }
      );
    });
  });

  it('hides retry actions when the role cannot retry anchors', () => {
    renderWithProviders(<AuditLogs />);

    expect(screen.queryByRole('button', { name: /Retry/ })).not.toBeInTheDocument();
  });

  it('shows a retry action for Pending/Failed anchors and triggers the mutation', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({ data: { data: { log: mockLog2 } } });
    retryHook.mockReturnValue({ mutateAsync, isPending: false });

    renderWithProviders(<AuditLogs />, { authValue: createTestAuthValue({ hasRole: () => true }) });

    const retryButtons = screen.getAllByRole('button', { name: /Retry/ });
    expect(retryButtons.length).toBeGreaterThan(0);

    await user.click(retryButtons[0]);
    expect(mutateAsync).toHaveBeenCalledWith('log-2');
  });

  it('shows a retry action in the detail dialog for retryable entries', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({ data: { data: { log: mockLog2 } } });
    retryHook.mockReturnValue({ mutateAsync, isPending: false });
    logHook.mockReturnValue({ data: mockLog2, isLoading: false, isError: false, error: null });

    renderWithProviders(<AuditLogs />, { authValue: createTestAuthValue({ hasRole: () => true }) });

    fireEvent.click(screen.getAllByRole('button', { name: /Details/ })[0]);

    const retryButton = await screen.findByRole('button', { name: /Retry Anchor/ });
    await user.click(retryButton);
    expect(mutateAsync).toHaveBeenCalledWith('log-2');
  });
});
