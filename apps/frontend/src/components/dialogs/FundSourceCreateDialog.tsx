import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Label } from '@radix-ui/react-label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../ui/Toast';
import { AlertCircle, Landmark, Loader2, X } from 'lucide-react';

const fundSourceFormSchema = z.object({
  code: z.string().min(1, 'Fund source code is required').max(20, 'Fund source code must not exceed 20 characters'),
  name: z.string().min(1, 'Fund source name is required').max(100, 'Fund source name must not exceed 100 characters'),
  description: z.string().max(255, 'Description must not exceed 255 characters').optional(),
  status: z.enum(['Active', 'Inactive']).optional().default('Inactive'),
});

interface FundSourceFormData {
  code: string;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
}

interface FundSourceCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FundSourceFormData) => Promise<void>;
  isLoading?: boolean;
}

const FundSourceCreateDialog: React.FC<FundSourceCreateDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FundSourceFormData>({
    resolver: zodResolver(fundSourceFormSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      status: 'Inactive'
    }
  });

  const { showToast } = useToast();

  const onFormSubmit = async (data: FundSourceFormData) => {
    try {
      await onSubmit(data);
      reset();
      showToast('Fund source created successfully', 'success');
      onClose();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'Failed to create fund source',
        'error'
      );
    }
  };

  if (!isOpen) return null;

  const isFormDisabled = isSubmitting || isLoading;

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
                <Landmark className="w-5 h-5" />
              </div>
              Create Fund Source
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Create a new fund source for budget allocation.
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-semibold text-slate-800">
                    Fund Source Code <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="code"
                    type="text"
                    disabled={isFormDisabled}
                    placeholder="e.g., FS001"
                    {...register('code')}
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
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-800">
                    Fund Source Name <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="name"
                    type="text"
                    disabled={isFormDisabled}
                    placeholder="e.g., Consolidated Fund"
                    {...register('name')}
                    className={inputClassName(Boolean(errors.name))}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.name.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-md">
                  Details
                </span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-800">
                  Description
                </Label>
                <textarea
                  id="description"
                  rows={3}
                  disabled={isFormDisabled}
                  placeholder="Enter fund source description (optional)"
                  {...register('description')}
                  className={inputClassName(Boolean(errors.description))}
                />
                <p className="text-xs text-slate-500">
                  Provide additional context about this fund source.
                </p>
                {errors.description && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold text-slate-800">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('status') || 'Inactive'}
                  onValueChange={(val: any) => setValue('status', val, { shouldValidate: true })}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
                  Creating Fund Source...
                </span>
              ) : (
                'Create Fund Source'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { FundSourceCreateDialog };
export default FundSourceCreateDialog;
