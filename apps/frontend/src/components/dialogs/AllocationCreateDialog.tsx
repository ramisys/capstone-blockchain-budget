import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Label } from '@radix-ui/react-label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../ui/Toast';
import { useCreateAllocation } from '../../hooks/useAllocations';
import { useAllocationOptions } from '../../hooks/useAllocationOptions';
import { formatCurrency } from '../../utils/format';
import { AlertCircle, Loader2, Wallet, X } from 'lucide-react';
import type { AllocationFormData } from '../../types/allocation';

const allocationFormSchema = z.object({
  fiscalYearId: z.string().min(1, 'Fiscal year is required'),
  departmentId: z.string().min(1, 'Department is required'),
  fundSourceId: z.string().min(1, 'Fund source is required'),
  categoryId: z.string().min(1, 'Budget category is required'),
  programId: z.string().min(1, 'Program is required'),
  allocatedAmount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ invalid_type_error: 'Allocated amount must be a valid number' })
      .positive('Allocated amount must be greater than 0')
      .max(999999999999.99, 'Allocated amount exceeds the maximum allowed'),
  ),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().default(''),
});

interface FieldSelectProps {
  id: string;
  label: string;
  required?: boolean;
  value: string | undefined;
  onChange: (value: string) => void;
  options: Array<{ id: string; code: string; name?: string }>;
  placeholder: string;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
}

const FieldSelect: React.FC<FieldSelectProps> = ({
  id,
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder,
  error,
  loading = false,
  disabled = false,
}) => {
  const isDisabled = disabled || loading;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value ?? ''} onValueChange={onChange} disabled={isDisabled}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="__loading__" disabled>
              Loading...
            </SelectItem>
          ) : options.length === 0 ? (
            <SelectItem value="__none__" disabled>
              No options available
            </SelectItem>
          ) : (
            options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.code && option.name ? `${option.code} — ${option.name}` : option.code || option.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

interface AllocationCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AllocationCreateDialog: React.FC<AllocationCreateDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { fiscalYears, departments, fundSources, categories, programs, isLoading: optionsLoading } =
    useAllocationOptions();
  const { mutateAsync: createAllocation, isPending: isCreating } = useCreateAllocation();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AllocationFormData>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      fiscalYearId: '',
      departmentId: '',
      fundSourceId: '',
      categoryId: '',
      programId: '',
      allocatedAmount: undefined as unknown as number,
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const isFormDisabled = isSubmitting || isCreating;

  const inputClassName = (hasError: boolean) =>
    `w-full px-4 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none ${
      hasError
        ? 'border-red-400 focus:ring-2 focus:ring-red-500/20'
        : 'border-slate-300 focus:ring-2 focus:ring-indigo-500/20'
    } ${isFormDisabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`;

  const selectedAmount = Number(watch('allocatedAmount')) || 0;

  const sectionHeader = (title: string) => (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-md">
        {title}
      </span>
      <div className="h-px bg-slate-100 flex-1" />
    </div>
  );

  const onFormSubmit = async (data: AllocationFormData) => {
    try {
      await createAllocation(data);
      showToast('Allocation created successfully', 'success');
      onClose();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'Failed to create allocation',
        'error',
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl! p-0! gap-0! rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden max-h-[90vh] flex! flex-col">
        {/* Fixed Header */}
        <div className="px-7 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              Create Budget Allocation
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Allocate budget to a department under a fiscal year, fund source, category, and program.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isFormDisabled}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Wrap */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 space-y-7">
            {/* SECTION 1: ALLOCATION DETAILS */}
            <div className="space-y-4">
              {sectionHeader('Allocation Details')}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <FieldSelect
                  id="fiscalYearId"
                  label="Fiscal Year"
                  required
                  value={watch('fiscalYearId')}
                  onChange={(value) => setValue('fiscalYearId', value, { shouldValidate: true })}
                  options={fiscalYears}
                  placeholder="Select fiscal year"
                  error={errors.fiscalYearId?.message}
                  loading={optionsLoading}
                  disabled={isFormDisabled}
                />
                <FieldSelect
                  id="departmentId"
                  label="Department"
                  required
                  value={watch('departmentId')}
                  onChange={(value) => setValue('departmentId', value, { shouldValidate: true })}
                  options={departments}
                  placeholder="Select department"
                  error={errors.departmentId?.message}
                  loading={optionsLoading}
                  disabled={isFormDisabled}
                />
                <FieldSelect
                  id="fundSourceId"
                  label="Fund Source"
                  required
                  value={watch('fundSourceId')}
                  onChange={(value) => setValue('fundSourceId', value, { shouldValidate: true })}
                  options={fundSources}
                  placeholder="Select fund source"
                  error={errors.fundSourceId?.message}
                  loading={optionsLoading}
                  disabled={isFormDisabled}
                />
              </div>
            </div>

            {/* SECTION 2: BUDGET ASSIGNMENT */}
            <div className="space-y-4">
              {sectionHeader('Budget Assignment')}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <FieldSelect
                  id="categoryId"
                  label="Budget Category"
                  required
                  value={watch('categoryId')}
                  onChange={(value) => setValue('categoryId', value, { shouldValidate: true })}
                  options={categories}
                  placeholder="Select budget category"
                  error={errors.categoryId?.message}
                  loading={optionsLoading}
                  disabled={isFormDisabled}
                />
                <FieldSelect
                  id="programId"
                  label="Program / PPA"
                  required
                  value={watch('programId')}
                  onChange={(value) => setValue('programId', value, { shouldValidate: true })}
                  options={programs}
                  placeholder="Select program"
                  error={errors.programId?.message}
                  loading={optionsLoading}
                  disabled={isFormDisabled}
                />

                <div className="space-y-2">
                  <Label htmlFor="allocatedAmount" className="text-sm font-semibold text-slate-800">
                    Allocated Amount <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="allocatedAmount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    disabled={isFormDisabled}
                    placeholder="e.g., 500000.00"
                    {...register('allocatedAmount')}
                    className={inputClassName(Boolean(errors.allocatedAmount))}
                  />
                  {errors.allocatedAmount ? (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.allocatedAmount.message}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedAmount > 0
                        ? `Equivalent to ${formatCurrency(selectedAmount)}`
                        : 'Enter the amount to allocate'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: DESCRIPTION */}
            <div className="space-y-4">
              {sectionHeader('Description')}

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-800">
                  Description <span className="text-xs font-normal text-slate-400">(optional)</span>
                </Label>
                <textarea
                  id="description"
                  rows={4}
                  disabled={isFormDisabled}
                  placeholder="Provide additional details about this allocation (e.g., purpose, funding notes)..."
                  {...register('description')}
                  className={inputClassName(Boolean(errors.description))}
                />
                <div className="flex items-center justify-between">
                  {errors.description ? (
                    <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.description.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-slate-400 tabular-nums">
                    {(watch('description') || '').length}/500
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="px-7 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isFormDisabled}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isFormDisabled}
            >
              {isFormDisabled ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Allocation...
                </span>
              ) : (
                'Create Allocation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { AllocationCreateDialog };
export default AllocationCreateDialog;
