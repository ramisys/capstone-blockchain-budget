import { forwardRef } from 'react';

export const Select = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <select
      ref={ref}
      className={`form-select ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});