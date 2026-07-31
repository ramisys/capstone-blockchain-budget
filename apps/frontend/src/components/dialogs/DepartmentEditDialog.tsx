import React, { useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Label } from '@radix-ui/react-label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../ui/Toast';
import { AlertCircle, Building2, Loader2, X } from 'lucide-react';

const departmentFormSchema = z.object({
  code: z.string().min(1, 'Department code is required').max(20, 'Department code must not exceed 20 characters'),
  name: z.string().min(1, 'Department name is required').max(100, 'Department name must not exceed 100 characters'),
  officeHead: z.string().max(100, 'Office head must not exceed 100 characters').optional(),
  contactNumber: z.string().max(20, 'Contact number must not exceed 20 characters').optional(),
  email: z.string().email('Invalid email address').max(100, 'Email must not exceed 100 characters').optional().or(z.literal('')),
  officeAddress: z.string().max(255, 'Office address must not exceed 255 characters').optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
});

interface DepartmentFormData {
  code: string;
  name: string;
  officeHead?: string;
  contactNumber?: string;
  email?: string;
  officeAddress?: string;
  status: 'Active' | 'Inactive';
}

interface DepartmentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  initialData: any;
  onSubmit: ({ id, data }: { id: string; data: DepartmentFormData }) => Promise<void>;
  isLoading?: boolean;
}

const DepartmentEditDialog: React.FC<DepartmentEditDialogProps> = ({
  isOpen,
  onClose,
  departmentId,
  initialData,
  onSubmit,
  isLoading = false
}) => {
  const formMethods = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      officeHead: initialData?.officeHead || '',
      contactNumber: initialData?.contactNumber || '',
      email: initialData?.email || '',
      officeAddress: initialData?.officeAddress || '',
      status: initialData?.status || 'Active'
    }
  });

  const { showToast } = useToast();

  useEffect(() => {
    if (initialData) {
      formMethods.reset({
        code: initialData.code || '',
        name: initialData.name || '',
        officeHead: initialData.officeHead || '',
        contactNumber: initialData.contactNumber || '',
        email: initialData.email || '',
        officeAddress: initialData.officeAddress || '',
        status: initialData.status || 'Active'
      });
    }
  }, [initialData, formMethods]);

  const onFormSubmit = async (data: DepartmentFormData) => {
    try {
      await onSubmit({ id: departmentId, data });
      showToast('Department updated successfully', 'success');
      onClose();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 'Failed to update department',
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
                <Building2 className="w-5 h-5" />
              </div>
              Edit Department
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Update the details of this department.
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-semibold text-slate-800">
                    Department Code <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="code"
                    type="text"
                    disabled={isFormDisabled}
                    placeholder="e.g., D001"
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
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-800">
                    Department Name <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="name"
                    type="text"
                    disabled={isFormDisabled}
                    placeholder="e.g., Finance Department"
                    {...formMethods.register('name')}
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

            {/* SECTION 2: CONTACT INFORMATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-md">
                  Contact Information
                </span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeHead" className="text-sm font-semibold text-slate-800">
                  Office Head
                </Label>
                <input
                  id="officeHead"
                  type="text"
                  disabled={isFormDisabled}
                  placeholder="Enter office head name (optional)"
                  {...formMethods.register('officeHead')}
                  className={inputClassName(Boolean(errors.officeHead))}
                />
                {errors.officeHead && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.officeHead.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="contactNumber" className="text-sm font-semibold text-slate-800">
                    Contact Number
                  </Label>
                  <input
                    id="contactNumber"
                    type="tel"
                    disabled={isFormDisabled}
                    placeholder="Enter contact number (optional)"
                    {...formMethods.register('contactNumber')}
                    className={inputClassName(Boolean(errors.contactNumber))}
                  />
                  {errors.contactNumber && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.contactNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-800">
                    Email Address
                  </Label>
                  <input
                    id="email"
                    type="email"
                    disabled={isFormDisabled}
                    placeholder="Enter email address (optional)"
                    {...formMethods.register('email')}
                    className={inputClassName(Boolean(errors.email))}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeAddress" className="text-sm font-semibold text-slate-800">
                  Office Address
                </Label>
                <textarea
                  id="officeAddress"
                  rows={3}
                  disabled={isFormDisabled}
                  placeholder="Enter office address (optional)"
                  {...formMethods.register('officeAddress')}
                  className={inputClassName(Boolean(errors.officeAddress))}
                />
                {errors.officeAddress && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.officeAddress.message}
                  </p>
                )}
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
                  value={formMethods.watch('status') || 'Active'}
                  onValueChange={(val: any) => formMethods.setValue('status', val, { shouldValidate: true })}
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
                  Updating Department...
                </span>
              ) : (
                'Update Department'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { DepartmentEditDialog };
export default DepartmentEditDialog;
