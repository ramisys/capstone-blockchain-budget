import { forwardRef } from 'react';

export const Select = forwardRef(({
  children,
  className = '',
  error,
  ...props
}, ref) => {
  return (
    <select
      ref={ref}
      className={`w-full px-3.5 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-800 cursor-pointer ${
        error
          ? 'border-red-400 bg-red-50/30 focus:ring-red-500/20'
          : 'border-slate-300 bg-slate-50 focus:ring-indigo-500/20'
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});