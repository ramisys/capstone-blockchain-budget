import React from 'react';
import { Card } from '../ui/Card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Label } from '@radix-ui/react-label';
import { Button } from '../ui/Button';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { DOCUMENT_TYPE_LIST, DOCUMENT_TYPE_LABELS } from '../../constants/documentType';
import { DOCUMENT_STATUS_LIST, DOCUMENT_STATUS_LABELS } from '../../constants/documentStatus';
import { BLOCKCHAIN_RECORD_STATUS_LIST, BLOCKCHAIN_RECORD_STATUS_LABELS } from '../../constants/blockchainStatus';
import type { DocumentFilterKey, DocumentFilters } from '../../hooks/useDocumentFilters';

const ALL = '__all__';

interface FilterSelectProps {
  label: string;
  value: string | undefined;
  options: Array<{ id: string; name?: string; code?: string }>;
  onChange: (value: string | undefined) => void;
  placeholder: string;
  loading?: boolean;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  loading = false,
}: FilterSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600">{label}</Label>
      <Select
        value={value ?? ALL}
        onValueChange={(val) => onChange(val === ALL ? undefined : val)}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All {label}s</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.code && option.name ? `${option.code} — ${option.name}` : option.name || option.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface FilterDateInputProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

function FilterDateInput({ label, value, onChange }: FilterDateInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600">{label}</Label>
      <input
        type="date"
        aria-label={label}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

interface DocumentFiltersProps {
  filters: DocumentFilters;
  onChange: (key: DocumentFilterKey, value: string | undefined) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  fiscalYears?: Array<{ id: string; code: string; name?: string }>;
  departments?: Array<{ id: string; code: string; name: string }>;
  allocations?: Array<{ id: string; allocationCode: string }>;
  uploaders?: Array<{ id: string; fullName: string }>;
  loading?: boolean;
}

/**
 * Advanced filter bar for the document list. Multiple filters combine and a
 * Reset button clears them all at once.
 */
const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  fiscalYears = [],
  departments = [],
  allocations = [],
  uploaders = [],
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <FilterSelect
          label="Document Type"
          value={filters.documentType}
          options={DOCUMENT_TYPE_LIST.map((type) => ({
            id: type,
            name: DOCUMENT_TYPE_LABELS[type],
          }))}
          onChange={(value) => onChange('documentType', value)}
          placeholder="All document types"
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          options={DOCUMENT_STATUS_LIST.map((status) => ({
            id: status,
            name: DOCUMENT_STATUS_LABELS[status],
          }))}
          onChange={(value) => onChange('status', value)}
          placeholder="All statuses"
        />
        <FilterSelect
          label="Blockchain Status"
          value={filters.blockchainStatus}
          options={BLOCKCHAIN_RECORD_STATUS_LIST.map((status) => ({
            id: status,
            name: BLOCKCHAIN_RECORD_STATUS_LABELS[status],
          }))}
          onChange={(value) => onChange('blockchainStatus', value)}
          placeholder="All ledger statuses"
        />
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
          label="Allocation"
          value={filters.allocationId}
          options={allocations.map((allocation) => ({
            id: allocation.id,
            code: allocation.allocationCode,
          }))}
          onChange={(value) => onChange('allocationId', value)}
          placeholder="All allocations"
          loading={loading}
        />
        {uploaders.length > 0 && (
          <FilterSelect
            label="Uploader"
            value={filters.uploadedBy}
            options={uploaders.map((uploader) => ({
              id: uploader.id,
              name: uploader.fullName,
            }))}
            onChange={(value) => onChange('uploadedBy', value)}
            placeholder="All uploaders"
            loading={loading}
          />
        )}
        <FilterDateInput
          label="From Date"
          value={filters.dateFrom}
          onChange={(value) => onChange('dateFrom', value)}
        />
        <FilterDateInput
          label="To Date"
          value={filters.dateTo}
          onChange={(value) => onChange('dateTo', value)}
        />
      </div>
    </Card>
  );
};

export { DocumentFilters };
export default DocumentFilters;
