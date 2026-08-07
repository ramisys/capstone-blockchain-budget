import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Check,
  X,
  UserPlus,
  AlertCircle,
  Sliders,
  UserCheck,
  KeyRound,
} from 'lucide-react';

import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { useUserById, useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { USER_STATUS } from '../../constants/status';

interface UserFormValues {
  fullName: string;
  email: string;
  password?: string;
  role: string;
  status: string;
}

const ROLE_VALUES = Object.values(ROLES) as [string, ...string[]];
const STATUS_VALUES = Object.values(USER_STATUS) as [string, ...string[]];

// Mirrors apps/backend/validators/userValidator.js so weak passwords are caught
// here rather than coming back as a 400 from the server.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number');

function buildUserFormSchema(isEditMode: boolean): z.ZodType<UserFormValues> {
  return z.object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Email Address is required')
      .email('Please enter a valid email address'),
    // In edit mode the password is only submitted when "Change Password" is
    // ticked, so an untouched empty field must not trip the rules.
    password: isEditMode
      ? z.preprocess(
          (value) => (value === '' || value === null ? undefined : value),
          passwordSchema.optional(),
        )
      : passwordSchema,
    role: z.enum(ROLE_VALUES, { errorMap: () => ({ message: 'Role is required' }) }),
    status: z.enum(STATUS_VALUES, { errorMap: () => ({ message: 'Status is required' }) }),
  }) as z.ZodType<UserFormValues>;
}

export function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [enablePasswordEdit, setEnablePasswordEdit] = useState(false);

  const isEditMode = Boolean(id);
  const isAdmin = user?.role === ROLES.ADMINISTRATOR;

  const {
    data: existingUser,
    isLoading: isLoadingUser,
    isError: isUserError,
    error: userError,
  } = useUserById(id);

  const { mutateAsync: createUser, isPending: isCreating } = useCreateUser();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();

  const validationSchema = useMemo(() => buildUserFormSchema(isEditMode), [isEditMode]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<UserFormValues>({
    resolver: zodResolver(validationSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: '',
      status: '',
    },
  });

  const loading = (isEditMode && isLoadingUser) || isCreating || isUpdating || isSubmitting;

  const passwordValue = watch('password') || '';
  const roleValue = watch('role');
  const statusValue = watch('status');

  // Password requirement live evaluation
  const passwordRequirements = [
    { label: 'Minimum 8 characters', met: passwordValue.length >= 8 },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(passwordValue) },
    { label: 'At least one lowercase letter', met: /[a-z]/.test(passwordValue) },
    { label: 'At least one number', met: /[0-9]/.test(passwordValue) },
  ];

  const metRequirementsCount = passwordRequirements.filter((r) => r.met).length;

  const getPasswordStrength = () => {
    if (!passwordValue) return { label: '', color: 'bg-slate-200', textColor: '', width: 'w-0' };
    if (metRequirementsCount <= 1)
      return { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600', width: 'w-1/3' };
    if (metRequirementsCount <= 3)
      return { label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-600', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600', width: 'w-full' };
  };

  const strength = getPasswordStrength();

  // Populate the form once the user being edited has loaded
  useEffect(() => {
    if (existingUser) {
      reset({
        fullName: existingUser.fullName,
        email: existingUser.email,
        role: existingUser.role,
        status: existingUser.status,
        password: '',
      });
    }
  }, [existingUser, reset]);

  const onSubmit = async (data: UserFormValues) => {
    setSubmitError(null);

    const payload = {
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      status: data.status,
    };

    try {
      if (id) {
        await updateUser({
          id,
          data: {
            ...payload,
            // Only include password if the admin opted in and supplied one
            ...(enablePasswordEdit && data.password ? { password: data.password } : {}),
          },
        });
        showSuccess('User updated successfully.');
      } else {
        await createUser({ ...payload, password: data.password });
        showSuccess('User created successfully.');
      }

      navigate('/users');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Operation failed. Please try again.';
      setSubmitError(message);
      showError(message);
    }
  };

  const handlePasswordToggle = (checked: boolean) => {
    setEnablePasswordEdit(checked);
    if (!checked) {
      // Drop any partially typed password so it cannot block submission
      setValue('password', '', { shouldValidate: false });
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="danger" icon={<AlertCircle className="w-5 h-5" />}>
          Access Denied: Admin privileges required.
        </Alert>
      </div>
    );
  }

  const pageTitle = isEditMode ? 'Edit User' : 'Add New User';
  const pageSubtitle = isEditMode
    ? 'Update user account details and permissions.'
    : 'Create a new user account and assign system permissions.';
  const isSaving = isCreating || isUpdating || isSubmitting;
  const submitButtonText = isEditMode
    ? isSaving
      ? 'Updating User...'
      : 'Update User'
    : isSaving
    ? 'Creating User...'
    : 'Create User';

  const inputClassName = (hasError: boolean, extra = '') =>
    `w-full pl-10 ${extra || 'pr-3.5'} py-2.5 text-sm border rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-60 disabled:bg-slate-50 ${
      hasError
        ? 'border-red-500 bg-red-50/20 text-slate-900 focus:ring-red-500/20'
        : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:ring-[var(--color-primary)]/20'
    }`;

  const fieldError = (fieldId: string, message?: string) =>
    message ? (
      <div
        id={`${fieldId}-error`}
        className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium"
        role="alert"
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{message}</span>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-[var(--color-primary)] transition-colors group focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 rounded-md px-1.5 py-1 -ml-1.5"
            aria-label="Back to User Management"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            Back to User Management
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">{pageSubtitle}</p>
          </div>
        </div>

        {/* Failed to load the user being edited */}
        {isUserError && (
          <Alert variant="danger">
            {(userError as any)?.response?.data?.message || 'Failed to fetch user details.'}
          </Alert>
        )}

        {/* Global Error Notification */}
        {submitError && (
          <Alert variant="danger" className="animate-in fade-in slide-in-from-top-2 duration-200">
            {submitError}
          </Alert>
        )}

        {/* Main Form Card */}
        <Card className="shadow-sm border-slate-200/80 overflow-hidden bg-white">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8" noValidate>
            {/* SECTION 1: Personal Information */}
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--color-primary)]" />
                    Personal Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter the user's personal details and primary email address.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      disabled={loading}
                      {...register('fullName')}
                      className={inputClassName(Boolean(errors.fullName))}
                      placeholder="Enter full name"
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    />
                  </div>
                  {fieldError('fullName', errors.fullName?.message)}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      disabled={loading}
                      {...register('email')}
                      className={inputClassName(Boolean(errors.email))}
                      placeholder="Enter email address"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {fieldError('email', errors.email?.message)}
                </div>
              </div>
            </div>

            {/* SECTION 2: Security */}
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[var(--color-primary)]" />
                  Security
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set account authentication password and view security requirements.
                </p>
              </div>

              {!isEditMode ? (
                /* Create Mode Password Field */
                <div className="space-y-3">
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        disabled={loading}
                        {...register('password')}
                        className={inputClassName(Boolean(errors.password), 'pr-11')}
                        placeholder="Create a secure password"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? 'password-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldError('password', errors.password?.message)}
                  </div>

                  {/* Password Strength Meter & Live Requirements */}
                  {passwordValue && (
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 animate-in fade-in duration-200">
                      {/* Strength Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-600">Password Strength</span>
                          <span className={strength.textColor}>{strength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                        </div>
                      </div>

                      {/* Requirements Checklist */}
                      <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {passwordRequirements.map((req, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            {req.met ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className={req.met ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode Password Toggle */
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-medium text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enablePasswordEdit}
                      onChange={(e) => handlePasswordToggle(e.target.checked)}
                      className="h-4 w-4 accent-[var(--color-primary)] focus:ring-[var(--color-primary)]/20 border-slate-300 rounded transition"
                    />
                    <span className="ml-2.5">Change Password</span>
                  </label>

                  {enablePasswordEdit && (
                    <div>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          disabled={loading}
                          {...register('password')}
                          className={inputClassName(Boolean(errors.password), 'pr-11')}
                          placeholder="Enter new password"
                          aria-invalid={!!errors.password}
                          aria-describedby={errors.password ? 'password-error' : undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldError('password', errors.password?.message)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3: Account Settings */}
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[var(--color-primary)]" />
                  Account Settings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign system permissions role and account operational status.
                </p>
                {id && id === user?.id && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 mt-2 font-medium">
                    ⚠️ Note: You are currently editing your own account. Demoting your role or deactivating your status is guarded by system Last Admin protection to prevent lockout.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Role Selector */}
                <div>
                  <label htmlFor="role" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={roleValue ?? ''}
                    onValueChange={(value) => setValue('role', value, { shouldValidate: true })}
                    disabled={loading}
                  >
                    <SelectTrigger
                      id="role"
                      aria-invalid={!!errors.role}
                      aria-describedby={errors.role ? 'role-error' : undefined}
                      className={errors.role ? 'border-red-500 bg-red-50/20 focus:ring-red-500/20' : ''}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                        <SelectValue placeholder="Select a role" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ROLES).map((value) => (
                        <SelectItem key={value} value={value}>
                          {ROLE_LABELS[value] || value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldError('role', errors.role?.message)}
                </div>

                {/* Status Selector */}
                <div>
                  <label htmlFor="status" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={statusValue ?? ''}
                    onValueChange={(value) => setValue('status', value, { shouldValidate: true })}
                    disabled={loading}
                  >
                    <SelectTrigger
                      id="status"
                      aria-invalid={!!errors.status}
                      aria-describedby={errors.status ? 'status-error' : undefined}
                      className={errors.status ? 'border-red-500 bg-red-50/20 focus:ring-red-500/20' : ''}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                        <SelectValue placeholder="Select a status" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(USER_STATUS).map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldError('status', errors.status?.message)}
                </div>
              </div>
            </div>

            {/* Form Actions Footer */}
            <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate('/users')}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={isSaving}
                disabled={loading}
                className="w-full sm:w-auto shadow-sm hover:shadow-md transition-all"
              >
                {!isSaving && <UserPlus className="w-4 h-4 mr-1.5" />}
                {submitButtonText}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
