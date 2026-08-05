import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentFilters } from '../useDocumentFilters';

describe('useDocumentFilters hook suite', () => {
  it('starts with no filters', () => {
    const { result } = renderHook(() => useDocumentFilters());

    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filtersKey).toBe('{}');
  });

  it('sets a filter and reports active filters', () => {
    const { result } = renderHook(() => useDocumentFilters());

    act(() => {
      result.current.setFilter('documentType', 'PurchaseRequest');
    });

    expect(result.current.filters.documentType).toBe('PurchaseRequest');
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.filtersKey).toBe('{"documentType":"PurchaseRequest"}');
  });

  it('clears a filter when passed an empty value', () => {
    const { result } = renderHook(() => useDocumentFilters());

    act(() => {
      result.current.setFilter('status', 'Active');
    });
    act(() => {
      result.current.setFilter('status', undefined);
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('resets all filters at once', () => {
    const { result } = renderHook(() => useDocumentFilters());

    act(() => {
      result.current.setFilter('documentType', 'Invoice');
      result.current.setFilter('blockchainStatus', 'Confirmed');
      result.current.setFilter('departmentId', 'dept-1');
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('supports allocation and uploader filters', () => {
    const { result } = renderHook(() => useDocumentFilters());

    act(() => {
      result.current.setFilter('allocationId', 'alloc-1');
      result.current.setFilter('uploadedBy', 'user-1');
    });

    expect(result.current.filters.allocationId).toBe('alloc-1');
    expect(result.current.filters.uploadedBy).toBe('user-1');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('supports date-range filters', () => {
    const { result } = renderHook(() => useDocumentFilters());

    act(() => {
      result.current.setFilter('dateFrom', '2026-01-01');
      result.current.setFilter('dateTo', '2026-12-31');
    });

    expect(result.current.filters.dateFrom).toBe('2026-01-01');
    expect(result.current.filters.dateTo).toBe('2026-12-31');
    expect(result.current.filtersKey).toBe('{"dateFrom":"2026-01-01","dateTo":"2026-12-31"}');
  });
});
