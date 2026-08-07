import { X } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  onDismiss?: () => void;
}

function getVariantStyles(variant: string) {
  switch (variant) {
    case 'success':
      return 'bg-[var(--color-success-bg)] border-[var(--color-success)]/20 text-[var(--color-success)]';
    case 'warning':
      return 'bg-[var(--color-warning-bg)] border-[var(--color-warning)]/20 text-[var(--color-warning)]';
    case 'info':
      return 'bg-[var(--color-info-bg)] border-[var(--color-info)]/20 text-[var(--color-info)]';
    case 'primary':
      return 'bg-[var(--color-primary-bg)] border-[var(--color-primary)]/20 text-[var(--color-primary)]';
    case 'danger':
    case 'error':
    default:
      return 'bg-[var(--color-error-bg)] border-[var(--color-error)]/20 text-[var(--color-error)]';
  }
}

export function Alert({ variant = 'danger', children, className = '', icon, onDismiss, ...props }: AlertProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-5 py-4 text-sm ${getVariantStyles(variant)} ${className}`}
      role="alert"
      {...props}
    >
      {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
      <div className="grow">{children}</div>
      {onDismiss && (
        <button
          type="button"
          className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Close"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
