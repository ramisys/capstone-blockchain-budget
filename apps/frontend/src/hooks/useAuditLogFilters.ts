import { useCallback, useMemo, useState } from 'react';
import type { AuditAnchorStatus, AuditResult } from '../types/audit';

export interface AuditFilters {
  action?: string;
  result?: AuditResult;
  anchorStatus?: AuditAnchorStatus;
  dateFrom?: string;
  dateTo?: string;
}

export type AuditFilterKey = keyof AuditFilters;

export interface AuditFilterControls {
  filters: AuditFilters;
  filtersKey: string;
  hasActiveFilters: boolean;
  setFilter: (key: AuditFilterKey, value: string | undefined) => void;
  resetFilters: () => void;
}

/**
 * Manages the advanced filter state for the audit log list. `filtersKey` is a
 * stable stringified snapshot that list effects can depend on.
 */
export function useAuditLogFilters(): AuditFilterControls {
  const [filters, setFilters] = useState<AuditFilters>({});

  const setFilter = useCallback((key: AuditFilterKey, value: string | undefined) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) {
        next[key] = value as never;
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
