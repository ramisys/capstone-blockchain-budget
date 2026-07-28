export function Button({
  children,
  variant = 'primary',
  size = '',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'btn',
    variant === 'primary' ? 'btn-primary' :
    variant === 'secondary' ? 'btn-secondary' :
    variant === 'outline' ? 'btn-outline-primary' :
    variant === 'ghost' ? 'btn-ghost' :
    variant === 'danger' ? 'btn-danger' :
    variant === 'accent' ? 'btn-accent' : `btn-${variant}`,
    size ? `btn-${size}` : '',
    loading ? 'position-relative' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
