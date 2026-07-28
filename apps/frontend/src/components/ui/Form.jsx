import { forwardRef } from 'react';

export const Form = forwardRef(({ onSubmit, children, className = '', ...props }, ref) => {
  return (
    <form
      ref={ref}
      onSubmit={onSubmit}
      className={`${className}`}
      {...props}
    >
      {children}
    </form>
  );
});