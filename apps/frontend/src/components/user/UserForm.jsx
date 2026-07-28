import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Form } from '../ui/Form';
import { FormField } from '../ui/FormField';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { USER_STATUS } from '../../constants/status';
import api from '../../api/apiClient';
import { useTranslation } from 'react-i18next';

export function UserForm() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  // Check if user is admin
  const isAdmin = user?.role === ROLES.ADMINISTRATOR;

  // Form validation schema
  const validationSchema = yup.object({
    fullName: yup.string().required(t('validation.fullNameRequired')),
    email: yup.string().email(t('validation.emailInvalid')).required(t('validation.emailRequired')),
    password: userId ? yup.string().min(8, t('validation.passwordMinLength')).notRequired() : yup.string().min(8, t('validation.passwordMinLength')).required(t('validation.passwordRequired')),
    role: yup.string().required(t('validation.roleRequired')),
    status: yup.string().required(t('validation.statusRequired')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: 'onBlur',
  });

  // Fetch user data for edit mode
  useEffect(() => {
    if (userId) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/users/${userId}`);
          setInitialData(response.data.user);

          // Set form values
          reset({
            fullName: response.data.user.fullName,
            email: response.data.user.email,
            role: response.data.user.role,
            status: response.data.user.status,
          });
        } catch (err) {
          setError(err.response?.data?.message || t('errors.fetchUserFailed'));
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [userId, reset, setValue, t]);

  const onSubmit = async (data) => {
    if (!isAdmin) {
      setError(t('errors.accessDenied'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (userId) {
        // Update existing user
        const response = await api.put(`/users/${userId}`, {
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          status: data.status,
          // Only include password if it was provided
          ...(data.password && { password: data.password }),
        });

        // Redirect with toast notification
        navigate('/users', {
          state: { toastMessage: 'User updated successfully.' },
        });
      } else {
        // Create new user
        const response = await api.post('/users', {
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
      <div className="p-6">
        <Alert variant="warning">{t('errors.accessDenied')}</Alert>
      </div>
    );
  }

  const formTitle = userId ? t('user.editUser') : t('user.addNewUser');
  const submitButtonText = userId ? t('user.updateUser') : t('user.createUser');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">{formTitle}</h1>
        <Button variant="outline" onClick={() => navigate('/users')} className="mr-2">
          {t('buttons.backToList')}
        </Button>
      </div>

      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      <Form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField>
          <label className="block text-sm font-medium mb-2">{t('form.fullName')}</label>
          <input
            {...register('fullName')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.fullName ? 'border-red-500' : ''
            }`}
            placeholder={t('form.fullNamePlaceholder')}
            defaultValue={initialData?.fullName || ''}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </FormField>

        <FormField>
          <label className="block text-sm font-medium mb-2">{t('form.email')}</label>
          <input
            {...register('email')}
            type="email"
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : ''
            }`}
            placeholder={t('form.emailPlaceholder')}
            defaultValue={initialData?.email || ''}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </FormField>

        {!userId && (
          <FormField>
            <label className="block text-sm font-medium mb-2">{t('form.password')}</label>
            <input
              {...register('password')}
              type="password"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : ''
              }`}
              placeholder={t('form.passwordPlaceholder')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {t('form.passwordHint')}
            </p>
          </FormField>
        )}

        {userId && (
          <FormField>
            <label className="flex items-center text-sm font-medium mb-2">
              <input
                type="checkbox"
                id="change-password"
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span>{t('form.changePassword')}</span>
            </label>
            <input
              type="password"
              id="password-field"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('form.newPassword')}
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">
              {t('form.passwordHint')}
            </p>
          </FormField>
        )}

        <FormField>
          <label className="block text-sm font-medium mb-2">{t('form.role')}</label>
          <select
            {...register('role')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('form.selectRole')}</option>
            {Object.entries(ROLES).map(([key, value]) => (
              <option key={key} value={value}>
                {t(`role.${key.toLowerCase()}`)}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </FormField>

        <FormField>
          <label className="block text-sm font-medium mb-2">{t('form.status')}</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('form.selectStatus')}</option>
            {Object.entries(USER_STATUS).map(([key, value]) => (
              <option key={key} value={value}>
                {t(`status.${key.toLowerCase()}`)}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </FormField>
      </Form>

      <div className="mt-6 flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => navigate('/users')}
        >
          {t('buttons.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? t('buttons.saving') : submitButtonText}
        </Button>
      </div>
    </div>
  );
}