import React from 'react';
import { Card } from '../ui/Card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Label } from '@radix-ui/react-label';
import { Button } from '../ui/Button';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { ALLOCATION_STATUS_LIST } from '../../constants/allocationStatus';
import { ALLOCATION_STATUS_LABELS } from '../../constants/allocationStatus';
import type { AllocationStatus } from '../../types/allocation';
import type { AllocationFilterKey, AllocationFilters } from '../../hooks/useAllocationFilters';

const ALL = '__all__';

interface FilterSelectProps {
  label: string;
  value: string | undefined;
  options: Array<{ id: string; code?: string; name?: string }>;
  onChange: (value: string | undefined) => void;
  placeholder: string;
  loading?: boolean;
  disabled?: boolean;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  loading = false,
  disabled = false,
}: FilterSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600">{label}</Label>
      <Select
        value={value ?? ALL}
        onValueChange={(val) => onChange(val === ALL ? undefined : val)}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All {label}s</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.code && option.name ? `${option.code} — ${option.name}` : option.code || option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface AllocationFiltersProps {
  filters: AllocationFilters;
  onChange: (key: AllocationFilterKey, value: string | undefined) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  fiscalYears?: Array<{ id: string; code: string; name?: string }>;
  departments?: Array<{ id: string; code: string; name: string }>;
  fundSources?: Array<{ id: string; code: string; name: string }>;
  categories?: Array<{ id: string; code: string; name: string }>;
  programs?: Array<{ id: string; code: string; name: string }>;
  loading?: boolean;
}

/**
 * Advanced filter bar for the allocation list. Multiple filters combine and a
 * Reset button clears them all at once.
 */
const AllocationFilters: React.FC<AllocationFiltersProps> = ({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  fiscalYears = [],
  departments = [],
  fundSources = [],
  categories = [],
  programs = [],
  loading = false,
}) => {
  return (
    <Card className="p-5 border-slate-200/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Active
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!hasActiveFilters || loading}
          className="text-slate-500 hover:text-red-600"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <FilterSelect
          label="Fiscal Year"
          value={filters.fiscalYearId}
          options={fiscalYears}
          onChange={(value) => onChange('fiscalYearId', value)}
          placeholder="All fiscal years"
          loading={loading}
        />
        <FilterSelect
          label="Department"
          value={filters.departmentId}
          options={departments}
          onChange={(value) => onChange('departmentId', value)}
          placeholder="All departments"
          loading={loading}
        />
        <FilterSelect
          label="Fund Source"
          value={filters.fundSourceId}
          options={fundSources}
          onChange={(value) => onChange('fundSourceId', value)}
          placeholder="All fund sources"
          loading={loading}
        />
        <FilterSelect
          label="Budget Category"
          value={filters.categoryId}
          options={categories}
          onChange={(value) => onChange('categoryId', value)}
          placeholder="All categories"
          loading={loading}
        />
        <FilterSelect
          label="Program"
          value={filters.programId}
          options={programs}
          onChange={(value) => onChange('programId', value)}
          placeholder="All programs"
          loading={loading}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          options={ALLOCATION_STATUS_LIST.map((status: AllocationStatus) => ({
            id: status,
            name: ALLOCATION_STATUS_LABELS[status],
          }))}
          onChange={(value) => onChange('status', value as AllocationStatus | undefined)}
          placeholder="All statuses"
        />
      </div>
    </Card>
  );
};

export { AllocationFilters };
export default AllocationFilters;
