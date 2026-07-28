export function Alert({ variant = 'danger', children, className = '', onDismiss, ...props }) {
  return (
    <div
      className={`alert alert-${variant} d-flex align-items-start gap-2 ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex-grow-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          className="btn-close btn-close-sm"
          aria-label="Close"
          onClick={onDismiss}
          style={{ fontSize: '0.75rem' }}
        />
      )}
    </div>
  );
}
