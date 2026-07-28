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
    <div className="mb-3">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
        id={inputId}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        {...props}
      />
      {error && (
        <div id={`${inputId}-error`} className="invalid-feedback" role="alert">
          {error}
        </div>
      )}
      {helpText && !error && (
        <div id={`${inputId}-help`} className="form-text">
          {helpText}
        </div>
      )}
    </div>
  );
});
