import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Label } from '@radix-ui/react-label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../ui/Toast';
import { Calendar, CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react';

const fiscalYearFormSchema = z.object({
  yearInput: z.string().min(1, 'Fiscal year is required'),
  code: z.string().min(1, 'Fiscal year code is required').max(20, 'Fiscal year code must not exceed 20 characters'),
  description: z.string().min(1, 'Description is required').max(255, 'Description must not exceed 255 characters'),
  startDate: z.string().min(1, 'Start date is required').refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid start date' }),
  endDate: z.string().min(1, 'End date is required').refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid end date' }),
  status: z.enum(['Active', 'Inactive', 'Archived']).default('Active'),
  isActive: z.boolean().default(false),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: 'End date must be later than start date',
  path: ['endDate'],
});

interface FiscalYearFormData {
  code: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive' | 'Archived';
  isActive: boolean;
}

interface FormSchemaInput extends FiscalYearFormData {
  yearInput: string;
}

interface FiscalYearCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FiscalYearFormData) => Promise<void>;
  isLoading?: boolean;
}

const FiscalYearCreateDialog: React.FC<FiscalYearCreateDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [yearInput, setYearInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormSchemaInput>({
    resolver: zodResolver(fiscalYearFormSchema),
    defaultValues: {
      yearInput: '',
      code: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'Active',
      isActive: false
    }
  });

  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      reset({
        yearInput: '',
        code: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'Active',
        isActive: false
      });
      setYearInput('');
      setGeneratedCode('');
    }
  }, [isOpen, reset]);

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.trim();
    setYearInput(rawVal);
    setValue('yearInput', rawVal, { shouldValidate: true });

    if (!rawVal) {
      setGeneratedCode('');
      setValue('code', '', { shouldValidate: true });
      return;
    }

    let code = rawVal.toUpperCase();
    if (/^\d{4}$/.test(rawVal)) {
      code = `FY${rawVal}`;
      // Auto-fill schedule range for convenience
      if (!watch('startDate')) {
        setValue('startDate', `${rawVal}-01-01`, { shouldValidate: true });
      }
      if (!watch('endDate')) {
        setValue('endDate', `${rawVal}-12-31`, { shouldValidate: true });
      }
    }

    setGeneratedCode(code);
    setValue('code', code, { shouldValidate: true });
  };

  const onFormSubmit = async (data: FormSchemaInput) => {
    try {
      const payload: FiscalYearFormData = {
        code: data.code,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        isActive: data.isActive
      };

      await onSubmit(payload);
      reset();
      showToast('Fiscal year created successfully', 'success');
      onClose();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || error.message || 'Failed to create fiscal year',
        'error'
      );
    }
  };

  if (!isOpen) return null;

  const isFormDisabled = isSubmitting || isLoading;

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
              Create Fiscal Year
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Create a new fiscal year for budget planning and allocation.
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
            {/* SECTION 1: BASIC INFORMATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-md">
                  Basic Information
                </span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              {/* Fiscal Year Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="yearInput" className="text-sm font-semibold text-slate-800">
                    Fiscal Year <span className="text-red-500">*</span>
                  </Label>
                  {generatedCode && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Generated Code: {generatedCode}
                    </span>
                  )}
                </div>
                <input
                  id="yearInput"
                  type="text"
                  autoFocus
                  disabled={isFormDisabled}
                  placeholder="e.g., 2026"
                  value={yearInput}
                  onChange={handleYearInputChange}
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none ${
                    errors.yearInput || errors.code
                      ? 'border-red-400 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500/20'
                  } ${isFormDisabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`}
                />
                <p className="text-xs text-slate-500">
                  Enter 4-digit year (e.g. 2026). Code will automatically generate as FY2026.
                </p>
                {(errors.yearInput || errors.code) && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.yearInput?.message || errors.code?.message}
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-800">
                  Description <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="description"
                  rows={3}
                  disabled={isFormDisabled}
                  placeholder="Provide a short description of this fiscal year for budget planning..."
                  {...register('description')}
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none ${
                    errors.description
                      ? 'border-red-400 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500/20'
                  } ${isFormDisabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`}
                />
                <p className="text-xs text-slate-500">
                  Provide a short description of this fiscal year.
                </p>
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
                    {...register('startDate')}
                    className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none ${
                      errors.startDate
                        ? 'border-red-400 focus:ring-2 focus:ring-red-500/20'
                        : 'border-slate-300 focus:ring-2 focus:ring-indigo-500/20'
                    } ${isFormDisabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`}
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
                    {...register('endDate')}
                    className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl transition-all duration-200 focus:outline-none ${
                      errors.endDate
                        ? 'border-red-400 focus:ring-2 focus:ring-red-500/20'
                        : 'border-slate-300 focus:ring-2 focus:ring-indigo-500/20'
                    } ${isFormDisabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`}
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

              {/* Status Select */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold text-slate-800">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('status') || 'Active'}
                  onValueChange={(val: any) => setValue('status', val, { shouldValidate: true })}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
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
                    aria-checked={watch('isActive') || false}
                    disabled={isFormDisabled}
                    onClick={() => setValue('isActive', !(watch('isActive') || false))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      watch('isActive') ? 'bg-indigo-600' : 'bg-slate-300'
                    } ${isFormDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        watch('isActive') ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {watch('isActive') && (
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
                  Creating Fiscal Year...
                </span>
              ) : (
                'Create Fiscal Year'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { FiscalYearCreateDialog };
export default FiscalYearCreateDialog;