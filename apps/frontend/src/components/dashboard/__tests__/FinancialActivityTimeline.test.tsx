import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, fireEvent, within } from '../../../test/test-utils';
import { FinancialActivityTimeline } from '../FinancialActivityTimeline';
import type { TimelineResponse } from '../../../types/timeline';

const timelineHook = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useFinancialTimeline', () => ({
  useFinancialTimeline: timelineHook,
}));

const mockResponse: TimelineResponse = {
  timeline: [
    {
      id: 'entry-1',
      kind: 'AllocationApproval',
      action: 'Approved',
      label: 'Allocation approved',
      description: 'ALC-2026-0001 · Research was approved.',
      actor: { id: 'user-1', name: 'Admin User', email: 'admin@university.edu', role: 'Administrator' },
      resourceType: 'Allocation',
      resourceCode: 'ALC-2026-0001',
      details: { comment: 'Looks good' },
      createdAt: '2026-08-06T08:00:00.000Z',
    },
    {
      id: 'entry-2',
      kind: 'BlockchainRecord',
      action: 'Confirmed',
      label: 'Anchor confirmed',
      description: 'ALC-2026-0001 anchored on hardhat.',
      actor: null,
      resourceType: 'Blockchain',
      resourceCode: 'ALC-2026-0001',
      details: { status: 'Confirmed', txHash: '0xabc' },
      createdAt: '2026-08-05T08:00:00.000Z',
    },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

const multiPageResponse: TimelineResponse = {
  timeline: mockResponse.timeline,
  pagination: { page: 1, limit: 1, total: 3, totalPages: 3 },
};

function defaultMocks() {
  timelineHook.mockReturnValue({
    data: mockResponse,
    isLoading: false,
    isError: false,
    error: null,
  });
}

describe('FinancialActivityTimeline component suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
  });

  it('renders the header and timeline entries', () => {
    renderWithProviders(<FinancialActivityTimeline />);

    expect(screen.getByText('Financial Activity')).toBeInTheDocument();
    expect(screen.getByText('Allocation approved')).toBeInTheDocument();
    expect(screen.getByText('Anchor confirmed')).toBeInTheDocument();
    expect(screen.getAllByText('ALC-2026-0001').length).toBeGreaterThan(0);
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('shows a loading spinner while fetching', () => {
    timelineHook.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });

    const { container } = renderWithProviders(<FinancialActivityTimeline />);

    // Scoped to the component: ToastProvider renders a permanent role="status"
    // live region into document.body, so an unscoped query is ambiguous.
    expect(within(container).getByRole('status')).toBeInTheDocument();
  });

  it('reports a load error instead of the feed', () => {
    timelineHook.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load timeline'),
    });

    renderWithProviders(<FinancialActivityTimeline />);

    expect(screen.getByText('Failed to load timeline')).toBeInTheDocument();
    expect(screen.queryByText('Allocation approved')).not.toBeInTheDocument();
  });

  it('shows an empty state when there is no activity', () => {
    timelineHook.mockReturnValue({
      data: { timeline: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<FinancialActivityTimeline />);

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('wires the kind filter into the timeline query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FinancialActivityTimeline />);

    await user.click(screen.getByRole('button', { name: 'Document' }));

    expect(timelineHook).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'DocumentActivity', page: 1 })
    );
  });

  it('resets to page 1 when the filter changes', async () => {
    timelineHook.mockReturnValue({
      data: multiPageResponse,
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    renderWithProviders(<FinancialActivityTimeline />);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(timelineHook).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 })
    );

    await user.click(screen.getByRole('button', { name: 'Allocation' }));
    expect(timelineHook).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: 'AllocationApproval', page: 1 })
    );
  });

  it('renders pagination controls when there are multiple pages', () => {
    timelineHook.mockReturnValue({
      data: multiPageResponse,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<FinancialActivityTimeline />);

    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
  });
});
