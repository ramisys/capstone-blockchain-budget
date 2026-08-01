import { useFiscalYears } from './useFiscalYears';
import { useDepartments } from './useDepartments';
import { useFundSources } from './useFundSources';
import { useBudgetCategories } from './useBudgetCategories';
import { useBudgetPrograms } from './useBudgetPrograms';
import type { FiscalYear } from './useFiscalYears';
import type { Department } from './useDepartments';
import type { FundSource } from './useFundSources';
import type { BudgetCategory } from './useBudgetCategories';
import type { BudgetProgram } from './useBudgetPrograms';

export interface AllocationOptions {
  fiscalYears: FiscalYear[];
  departments: Department[];
  fundSources: FundSource[];
  categories: BudgetCategory[];
  programs: BudgetProgram[];
  isLoading: boolean;
  isError: boolean;
}

const OPTIONS_LIMIT = 100;

/**
 * Loads the master-data options (fiscal years, departments, fund sources,
 * budget categories, and programs) needed by the allocation form and the
 * allocation filters. Uses a generous limit so dropdowns do not truncate.
 */
export function useAllocationOptions(): AllocationOptions {
  const fiscalYearsQuery = useFiscalYears({}, { page: 1, limit: OPTIONS_LIMIT });
  const departmentsQuery = useDepartments({}, { page: 1, limit: OPTIONS_LIMIT });
  const fundSourcesQuery = useFundSources({}, { page: 1, limit: OPTIONS_LIMIT });
  const categoriesQuery = useBudgetCategories({}, { page: 1, limit: OPTIONS_LIMIT });
  const programsQuery = useBudgetPrograms({}, { page: 1, limit: OPTIONS_LIMIT });

  return {
    fiscalYears: fiscalYearsQuery.data?.fiscalYears ?? [],
    departments: departmentsQuery.data?.departments ?? [],
    fundSources: fundSourcesQuery.data?.fundSources ?? [],
    categories: categoriesQuery.data?.budgetCategories ?? [],
    programs: programsQuery.data?.budgetPrograms ?? [],
    isLoading:
      fiscalYearsQuery.isLoading ||
      departmentsQuery.isLoading ||
      fundSourcesQuery.isLoading ||
      categoriesQuery.isLoading ||
      programsQuery.isLoading,
    isError:
      fiscalYearsQuery.isError ||
      departmentsQuery.isError ||
      fundSourcesQuery.isError ||
      categoriesQuery.isError ||
      programsQuery.isError,
  };
}
