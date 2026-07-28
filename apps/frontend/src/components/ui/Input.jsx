import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    type = 'text',
    id,
    error,
    helpText,
    placeholder,
    className = '',
    ...props
  },
  ref
) {
  const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full px-3.5 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-red-400 bg-red-50/30 text-slate-800 focus:ring-red-500/20'
            : 'border-slate-300 bg-slate-50 text-slate-800 focus:ring-indigo-500/20'
        } ${className}`}
        id={inputId}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        {...props}
      />
      {error && (
        <div id={`${inputId}-error`} className="text-xs text-red-600 mt-1 font-medium" role="alert">
          {error}
        </div>
      )}
      {helpText && !error && (
        <div id={`${inputId}-help`} className="text-xs text-slate-500 mt-1">
          {helpText}
        </div>
      )}
    </div>
  );
});
