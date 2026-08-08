import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

/**
 * Resolve the most useful message out of a rejected request.
 *
 * React Query surfaces the raw `AxiosError`, whose `message` is the generic
 * "Request failed with status code 500". The API's own `message` field is more
 * informative, so it wins when present — this preserves the wording the
 * dashboard showed before it moved onto React Query.
 */
export function resolveErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const apiMessage = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (apiMessage) return apiMessage;

  const nativeMessage = (error as { message?: string })?.message;
  return nativeMessage || fallback;
}

interface DashboardSectionProps {
  /** Optional visible section heading. */
  title?: string;
  /** Element id for the heading, used to name the section for assistive tech. */
  titleId?: string;
  /** Optional control rendered opposite the heading (e.g. a link). */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Layout wrapper for one dashboard band. Owns the vertical rhythm between
 * bands so individual grids no longer carry their own bottom margins.
 */
export function DashboardSection({
  title,
  titleId,
  action,
  className = '',
  children,
}: DashboardSectionProps) {
  return (
    <section
      className={`mb-6 ${className}`}
      aria-labelledby={title && titleId ? titleId : undefined}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 id={titleId} className="text-xl font-bold text-slate-900">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

interface DashboardStateBoundaryProps {
  /** Omit when the wrapped cards render their own skeletons. */
  isLoading?: boolean;
  isError: boolean;
  error?: unknown;
  /** Re-runs the failed request. Renders a Retry button when supplied. */
  onRetry?: () => void;
  /** Rendered while loading. Falls back to a centred spinner. */
  loadingFallback?: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  /** Message used when neither the API nor the error object provides one. */
  errorFallbackMessage?: string;
  children: React.ReactNode;
}

/**
 * Single loading / error / empty renderer for a dashboard band.
 *
 * One boundary wraps everything fed by one query, so a failed request produces
 * exactly one error state with a Retry action instead of repeating the same
 * message inside every card the query happened to feed.
 */
export function DashboardStateBoundary({
  isLoading = false,
  isError,
  error,
  onRetry,
  loadingFallback,
  isEmpty = false,
  emptyMessage = 'No data available',
  errorFallbackMessage,
  children,
}: DashboardStateBoundaryProps) {
  if (isLoading) {
    return (
      <>
        {loadingFallback ?? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        )}
      </>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger" icon={<AlertTriangle className="w-4 h-4" />}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>{resolveErrorMessage(error, errorFallbackMessage)}</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </Alert>
    );
  }

  if (isEmpty) {
    return <p className="text-center text-slate-500 py-4">{emptyMessage}</p>;
  }

  return <>{children}</>;
}

export default DashboardSection;
