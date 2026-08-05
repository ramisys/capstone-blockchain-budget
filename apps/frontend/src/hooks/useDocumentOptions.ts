import { useFiscalYears } from './useFiscalYears';
import { useDepartments } from './useDepartments';
import { useAllocations } from './useAllocations';
import type { FiscalYear } from './useFiscalYears';
import type { Department } from './useDepartments';
import type { AllocationRef } from '../types/document';

export interface DocumentOptions {
  fiscalYears: FiscalYear[];
  departments: Department[];
  allocations: AllocationRef[];
  isLoading: boolean;
  isError: boolean;
}

const OPTIONS_LIMIT = 100;

/**
 * Loads the master-data options (fiscal years, departments, and allocations)
 * needed by the document upload/edit forms and the document filters. Uses a
 * generous limit so dropdowns do not truncate.
 */
export function useDocumentOptions(): DocumentOptions {
  const fiscalYearsQuery = useFiscalYears({}, { page: 1, limit: OPTIONS_LIMIT });
  const departmentsQuery = useDepartments({}, { page: 1, limit: OPTIONS_LIMIT });
  const allocationsQuery = useAllocations({}, { page: 1, limit: OPTIONS_LIMIT });

  return {
    fiscalYears: fiscalYearsQuery.data?.fiscalYears ?? [],
    departments: departmentsQuery.data?.departments ?? [],
    allocations: allocationsQuery.data?.allocations ?? [],
    isLoading:
      fiscalYearsQuery.isLoading ||
      departmentsQuery.isLoading ||
      allocationsQuery.isLoading,
    isError:
      fiscalYearsQuery.isError ||
      departmentsQuery.isError ||
      allocationsQuery.isError,
  };
}
