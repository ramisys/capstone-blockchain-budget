import { useCallback, useMemo, useState } from 'react';
import type { BlockchainRecordStatus } from '../types/blockchain';
import type { DocumentStatus, DocumentType } from '../types/document';

export interface DocumentFilters {
  documentType?: DocumentType;
  status?: DocumentStatus;
  blockchainStatus?: BlockchainRecordStatus;
  fiscalYearId?: string;
  departmentId?: string;
}

export type DocumentFilterKey = keyof DocumentFilters;

export interface DocumentFilterControls {
  filters: DocumentFilters;
  filtersKey: string;
  hasActiveFilters: boolean;
  setFilter: (key: DocumentFilterKey, value: string | undefined) => void;
  resetFilters: () => void;
}

/**
 * Manages the advanced filter state for the document list. `filtersKey` is a
 * stable stringified snapshot that pages/list effects can depend on.
 */
export function useDocumentFilters(): DocumentFilterControls {
  const [filters, setFilters] = useState<DocumentFilters>({});

  const setFilter = useCallback((key: DocumentFilterKey, value: string | undefined) => {
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
