import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
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
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sliders,
  UserCheck,
  KeyRound,
} from 'lucide-react';

import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { USER_STATUS } from '../../constants/status';
import api from '../../api/apiClient';

export function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [enablePasswordEdit, setEnablePasswordEdit] = useState(false);
  const { t } = useTranslation();

  // Check if user is admin
  const isAdmin = user?.role === ROLES.ADMINISTRATOR;

  // Form validation schema
  const validationSchema = yup.object({
    fullName: yup.string().required(t('validation.fullNameRequired')),
    email: yup.string().email(t('validation.emailInvalid')).required(t('validation.emailRequired')),
    password: id
      ? yup.string().min(8, t('validation.passwordMinLength')).notRequired()
      : yup.string().min(8, t('validation.passwordMinLength')).required(t('validation.passwordRequired')),
    role: yup.string().required(t('validation.roleRequired')),
    status: yup.string().required(t('validation.statusRequired')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: 'onBlur',
  });

  const passwordValue = watch('password') || '';

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

  // Fetch user data for edit mode
  useEffect(() => {
    if (id) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/users/${id}`);
          setInitialData(response.data.data.user);

          // Set form values
          reset({
            fullName: response.data.data.user.fullName,
            email: response.data.data.user.email,
            role: response.data.data.user.role,
            status: response.data.data.user.status,
          });
        } catch (err) {
          setError(err.response?.data?.message || t('errors.fetchUserFailed'));
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [id, reset, setValue, t]);

  const onSubmit = async (data) => {
    if (!isAdmin) {
      setError(t('errors.accessDenied'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (id) {
        // Update existing user
        await api.put(`/users/${id}`, {
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          status: data.status,
          // Only include password if it was provided
          ...(enablePasswordEdit && data.password ? { password: data.password } : {}),
        });

        // Redirect with toast notification
        navigate('/users', {
          state: { toastMessage: 'User updated successfully.' },
        });
      } else {
        // Create new user
        await api.post('/users', {
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          role: data.role,
          status: data.status,
        });

        // Redirect with toast notification
        navigate('/users', {
          state: { toastMessage: 'User created successfully.' },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || t('errors.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="danger" icon={<AlertCircle className="w-5 h-5 text-red-600" />}>
          {t('errors.accessDenied')}
        </Alert>
      </div>
    );
  }

  const pageTitle = id ? t('user.editUser') : t('user.addNewUser');
  const pageSubtitle = id
    ? t('user.editUserSubtitle', 'Update user account details and system permissions.')
    : t('user.addNewUserSubtitle', 'Create a new user account and assign system permissions.');
  const submitButtonText = id
    ? loading
      ? t('user.updatingUser', 'Updating User...')
      : t('user.updateUser', 'Update User')
    : loading
    ? t('user.creatingUser', 'Creating User...')
    : t('user.createUser', 'Create User');

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors group focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-md px-1.5 py-1 -ml-1.5"
            aria-label="Back to User Management"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            {t('user.backToUsers', '← Back to User Management')}
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">{pageSubtitle}</p>
          </div>
        </div>

        {/* Global Error Notification */}
        {error && (
          <Alert variant="danger" className="animate-in fade-in slide-in-from-top-2 duration-200">
            {error}
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
                    <User className="w-4 h-4 text-indigo-600" />
                    {t('user.personalInfo', 'Personal Information')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('user.personalInfoDesc', "Enter the user's full name and email address.")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    {t('form.fullName')} <span className="text-red-500">*</span>
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
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm border rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-60 disabled:bg-slate-50 ${
                        errors.fullName
                          ? 'border-red-500 bg-red-50/20 text-slate-900 focus:ring-red-500/20'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:ring-indigo-500/20'
                      }`}
                      placeholder={t('form.fullNamePlaceholder')}
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    />
                  </div>
                  {errors.fullName && (
                    <div id="fullName-error" className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.fullName.message}</span>
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    {t('form.email')} <span className="text-red-500">*</span>
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
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm border rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-60 disabled:bg-slate-50 ${
                        errors.email
                          ? 'border-red-500 bg-red-50/20 text-slate-900 focus:ring-red-500/20'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:ring-indigo-500/20'
                      }`}
                      placeholder={t('form.emailPlaceholder')}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {errors.email && (
                    <div id="email-error" className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.email.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: Security */}
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  {t('user.security', 'Security')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('user.securityDesc', 'Set account password and view security requirements.')}
                </p>
              </div>

              {!id ? (
                /* Create Mode Password Field */
                <div className="space-y-3">
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      {t('form.password')} <span className="text-red-500">*</span>
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
                        className={`w-full pl-10 pr-11 py-2.5 text-sm border rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-60 disabled:bg-slate-50 ${
                          errors.password
                            ? 'border-red-500 bg-red-50/20 text-slate-900 focus:ring-red-500/20'
                            : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:ring-indigo-500/20'
                        }`}
                        placeholder={t('form.passwordPlaceholder')}
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
                    {errors.password && (
                      <div id="password-error" className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium" role="alert">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.password.message}</span>
                      </div>
                    )}
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
                      onChange={(e) => setEnablePasswordEdit(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500/20 border-slate-300 rounded transition"
                    />
                    <span className="ml-2.5">{t('form.changePassword', 'Change Password')}</span>
                  </label>

                  {enablePasswordEdit && (
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={loading}
                        {...register('password')}
                        className="w-full pl-10 pr-11 py-2.5 text-sm border border-slate-300 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-400 bg-white text-slate-900"
                        placeholder={t('form.newPassword', 'Enter new password')}
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
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3: Account Settings */}
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  {t('user.accountSettings', 'Account Settings')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('user.accountSettingsDesc', 'Assign permissions role and active status.')}
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
                    {t('form.role')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <select
                      id="role"
                      disabled={loading}
                      {...register('role')}
                      className={`w-full pl-10 pr-8 py-2.5 text-sm border rounded-xl transition-all focus:outline-none focus:ring-2 cursor-pointer disabled:opacity-60 disabled:bg-slate-50 ${
                        errors.role
                          ? 'border-red-500 bg-red-50/20 text-slate-900 focus:ring-red-500/20'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:ring-indigo-500/20'
                      }`}
                      aria-invalid={!!errors.role}
                      aria-describedby={errors.role ? 'role-error' : undefined}
                    >
                      <option value="">{t('form.selectRole')}</option>
                      {Object.entries(ROLES).map(([key, value]) => (
                        <option key={key} value={value}>
                          {ROLE_LABELS[value] || t(`role.${key.toLowerCase()}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.role && (
                    <div id="role-error" className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.role.message}</span>
                    </div>
                  )}
                </div>

                {/* Status Selector */}
                <div>
                  <label htmlFor="status" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    {t('form.status')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <select
                      id="status"
                      disabled={loading}
                      {...register('status')}
                      className={`w-full pl-10 pr-8 py-2.5 text-sm border rounded-xl transition-all focus:outline-none focus:ring-2 cursor-pointer disabled:opacity-60 disabled:bg-slate-50 ${
                        errors.status
                          ? 'border-red-500 bg-red-50/20 text-slate-900 focus:ring-red-500/20'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:ring-indigo-500/20'
                      }`}
                      aria-invalid={!!errors.status}
                      aria-describedby={errors.status ? 'status-error' : undefined}
                    >
                      <option value="">{t('form.selectStatus')}</option>
                      {Object.entries(USER_STATUS).map(([key, value]) => (
                        <option key={key} value={value}>
                          {value === USER_STATUS.ACTIVE ? '🟢 Active' : '🔴 Inactive'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.status && (
                    <div id="status-error" className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium" role="alert">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.status.message}</span>
                    </div>
                  )}
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
                {t('buttons.cancel')}
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={loading}
                disabled={loading}
                className="w-full sm:w-auto shadow-sm hover:shadow-md hover:shadow-indigo-500/20 transition-all"
              >
                {!loading && <UserPlus className="w-4 h-4 mr-1.5" />}
                {submitButtonText}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}