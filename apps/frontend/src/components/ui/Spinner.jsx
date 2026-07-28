export function Spinner({ size = 'md', variant = 'primary', className = '' }) {
  const sizeStyles = {
    sm: { width: '1rem', height: '1rem', borderWidth: '1.5px' },
    md: { width: '1.5rem', height: '1.5rem', borderWidth: '2px' },
    lg: { width: '2.5rem', height: '2.5rem', borderWidth: '3px' },
  };

  const colorStyles = {
    primary: { borderColor: 'var(--color-primary)', borderRightColor: 'transparent' },
    light: { borderColor: 'rgba(255,255,255,0.3)', borderRightColor: 'white' },
    muted: { borderColor: 'var(--color-border)', borderRightColor: 'var(--color-text-muted)' },
  };

  return (
    <div
      className={`spinner-border ${className}`}
      role="status"
      style={{ ...sizeStyles[size] || sizeStyles.md, ...colorStyles[variant] || colorStyles.primary }}
    >
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-3 mb-0 text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Loading...</p>
      </div>
    </div>
  );
}
