import React, { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Label } from '@radix-ui/react-label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../ui/Toast';
import { FISCAL_YEAR_STATUS } from '../../constants/status';
import { AlertCircle, Calendar, Info, Loader2, X } from 'lucide-react';

const fiscalYearFormSchema = z.object({
  code: z.string().min(1, 'Fiscal year code is required').max(20, 'Fiscal year code must not exceed 20 characters'),
  description: z.string().min(1, 'Description is required').max(255, 'Description must not exceed 255 characters'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid start date' }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid end date' }),
  status: z.enum(FISCAL_YEAR_STATUS as [string, ...string[]]).optional(),
  isActive: z.boolean().optional(),
});

interface FiscalYearFormData {
  code: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive' | 'Archived';
  isActive: boolean;
}

interface FiscalYearEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fiscalYearId: string;
  initialData: any;
  onSubmit: (payload: { id: string; data: FiscalYearFormData }) => any;
  isLoading?: boolean;
}

const FiscalYearEditDialog: React.FC<FiscalYearEditDialogProps> = ({
  isOpen,
  onClose,
  fiscalYearId,
  initialData,
  onSubmit,
  isLoading = false
}) => {
  const formMethods = useForm<FiscalYearFormData>({
    resolver: zodResolver(fiscalYearFormSchema),
    defaultValues: {
      code: initialData?.code || '',
      description: initialData?.description || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
      endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
      status: initialData?.status || 'Inactive',
      isActive: initialData?.isActive || false
    }
  });

  const { showToast } = useToast();

  const toDateInputValue = (iso: string) => {
    const date = new Date(iso);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (initialData) {
      formMethods.reset({
        code: initialData.code || '',
        description: initialData.description || '',
        startDate: initialData.startDate ? toDateInputValue(initialData.startDate) : '',
        endDate: initialData.endDate ? toDateInputValue(initialData.endDate) : '',
        status: initialData.status || 'Inactive',
        isActive: initialData.isActive || false
      });
    }
  }, [initialData, formMethods]);

  const onFormSubmit = async (data: FiscalYearFormData) => {
    try {
      await onSubmit({ id: fiscalYearId, data });
      showToast('Fiscal year updated successfully', 'success');
      onClose();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'Failed to update fiscal year',
        'error'
      );
    }
  };

  if (!isOpen) return null;

  const isFormDisabled = formMethods.formState.isSubmitting || isLoading;
  const errors = formMethods.formState.errors;

  const inputClassName = (hasError: boolean) =>
    `w-full px-4 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none ${
      hasError
        ? 'border-red-400 focus:ring-2 focus:ring-red-500/20'
        : 'border-slate-300 focus:ring-2 focus:ring-indigo-500/20'
    } ${isFormDisabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl! p-0! gap-0! rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden max-h-[90vh] flex! flex-col">
        {/* Fixed Header */}
        <div className="px-7 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              Edit Fiscal Year
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Update the details of this fiscal year.
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
        <form onSubmit={formMethods.handleSubmit(onFormSubmit)} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 space-y-7">
            {/* SECTION 1: BASIC INFORMATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-md">
                  Basic Information
                </span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-semibold text-slate-800">
                  Fiscal Year Code <span className="text-red-500">*</span>
                </Label>
                <input
                  id="code"
                  type="text"
                  disabled={isFormDisabled}
                  placeholder="e.g., FY2024"
                  {...formMethods.register('code')}
                  className={inputClassName(Boolean(errors.code))}
                />
                {errors.code && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.code.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-800">
                  Description <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="description"
                  rows={3}
                  disabled={isFormDisabled}
                  placeholder="Enter fiscal year description"
                  {...formMethods.register('description')}
                  className={inputClassName(Boolean(errors.description))}
                />
                {errors.description && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 2: SCHEDULE */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-md">
                  Schedule
                </span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-semibold text-slate-800">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="startDate"
                    type="date"
                    disabled={isFormDisabled}
                    {...formMethods.register('startDate')}
                    className={inputClassName(Boolean(errors.startDate))}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-semibold text-slate-800">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="endDate"
                    type="date"
                    disabled={isFormDisabled}
                    {...formMethods.register('endDate')}
                    className={inputClassName(Boolean(errors.endDate))}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: CONFIGURATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-md">
                  Configuration
                </span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold text-slate-800">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formMethods.watch('status') || 'Inactive'}
                  onValueChange={(val: string) => formMethods.setValue('status', val as any, { shouldValidate: true })}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_YEAR_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Fiscal Year Switch */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="isActive" className="text-sm font-semibold text-slate-900 cursor-pointer">
                      Active Fiscal Year
                    </Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enable this if this fiscal year should become the active operating year.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="isActive"
                    role="switch"
                    aria-checked={formMethods.watch('isActive') || false}
                    disabled={isFormDisabled}
                    onClick={() => formMethods.setValue('isActive', !(formMethods.watch('isActive') || false))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      formMethods.watch('isActive') ? 'bg-indigo-600' : 'bg-slate-300'
                    } ${isFormDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        formMethods.watch('isActive') ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {formMethods.watch('isActive') && (
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Setting this fiscal year as active will automatically deactivate the current active fiscal year.
                    </span>
                  </div>
                )}
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
                  Updating Fiscal Year...
                </span>
              ) : (
                'Update Fiscal Year'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { FiscalYearEditDialog };
export default FiscalYearEditDialog;
