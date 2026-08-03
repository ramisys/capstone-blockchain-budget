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
        return 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm hover:shadow-md hover:shadow-indigo-500/20 focus:ring-indigo-500/30';
      case 'secondary':
        return 'bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white shadow-sm focus:ring-slate-800/30';
      case 'outline':
        return 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus:ring-slate-400/20';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-400/20';
      case 'danger':
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm hover:shadow-md hover:shadow-red-500/20 focus:ring-red-500/30';
      case 'accent':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm focus:ring-amber-500/30';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm';
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
