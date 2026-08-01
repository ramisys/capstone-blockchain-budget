import { useCallback, useMemo, useState } from 'react';
import type { AllocationStatus } from '../types/allocation';

export interface AllocationFilters {
  fiscalYearId?: string;
  departmentId?: string;
  fundSourceId?: string;
  categoryId?: string;
  programId?: string;
  status?: AllocationStatus;
}

export type AllocationFilterKey = keyof AllocationFilters;

export interface AllocationFilterControls {
  filters: AllocationFilters;
  filtersKey: string;
  hasActiveFilters: boolean;
  setFilter: (key: AllocationFilterKey, value: string | undefined) => void;
  resetFilters: () => void;
}

/**
 * Manages the advanced filter state for the allocation list. `filtersKey` is a
 * stable stringified snapshot that pages/list effects can depend on.
 */
export function useAllocationFilters(): AllocationFilterControls {
  const [filters, setFilters] = useState<AllocationFilters>({});

  const setFilter = useCallback((key: AllocationFilterKey, value: string | undefined) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => Boolean(value)),
    [filters]
  );

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  return { filters, filtersKey, hasActiveFilters, setFilter, resetFilters };
}
