import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] active:bg-[var(--color-primary-dark)] text-[var(--color-text-inverse)] shadow-sm hover:shadow-md focus:ring-[var(--color-primary)]/30';
      case 'secondary':
        return 'bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white shadow-sm focus:ring-slate-800/30';
      case 'outline':
        return 'bg-[var(--color-surface)] hover:bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-sm focus:ring-[var(--color-primary)]/20';
      case 'ghost':
        return 'bg-transparent hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus:ring-[var(--color-primary)]/20';
      case 'danger':
      case 'destructive':
        return 'bg-[var(--color-error)] hover:brightness-95 active:brightness-90 text-[var(--color-text-inverse)] shadow-sm hover:shadow-md focus:ring-[var(--color-error)]/30';
      case 'accent':
        return 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-text-primary)] shadow-sm focus:ring-[var(--color-accent)]/30';
      default:
        return 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-[var(--color-text-inverse)] shadow-sm';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5';
      case 'lg':
        return 'px-5 py-3 text-base font-semibold rounded-xl gap-2.5';
      case 'icon':
        return 'w-9 h-9 p-0 rounded-lg gap-0';
      case 'md':
      default:
        return 'px-4 py-2 text-sm font-medium rounded-xl gap-2';
    }
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}

export default Button;
