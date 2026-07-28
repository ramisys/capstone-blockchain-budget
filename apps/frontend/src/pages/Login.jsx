import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setServerError('');
    setIsLoading(true);

    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to connect to the server. Please try again later.';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" width="48" height="48">
                <rect width="40" height="40" rx="8" fill="#1B3A5C" />
                <path d="M20 6L28 10V18C28 23.5 24.5 28.5 20 30C15.5 28.5 12 23.5 12 18V10L20 6Z" fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M17 20L19.5 22.5L23 17.5" stroke="#D4A843" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <h1 className="login-title">BudgetChain</h1>
            <p className="login-subtitle">
              Budget Allocation and Expense Monitoring System
            </p>
          </div>

          <div className="login-body">
            {serverError && (
              <Alert variant="danger" className="mb-4">
                {serverError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  placeholder="Enter your institutional email"
                  autoComplete="email"
                  autoFocus
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  disabled={isLoading}
                />
                {errors.email && (
                  <div id="email-error" className="invalid-feedback" role="alert">
                    {errors.email.message}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-group">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    id="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {errors.password && (
                  <div id="password-error" className="invalid-feedback" role="alert">
                    {errors.password.message}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    {...register('rememberMe')}
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                    disabled={isLoading}
                  />
                  <label className="form-check-label" htmlFor="rememberMe" style={{ fontSize: 'var(--font-size-sm)' }}>
                    Remember me
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-100"
                size="lg"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>

          <div className="login-footer">
            <p className="mb-0 text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
              Authorized personnel only. All access is monitored and logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
