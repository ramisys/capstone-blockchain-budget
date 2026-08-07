import React from 'react';
import { ShieldCheck, Landmark, PieChart, FileCheck, User } from 'lucide-react';
import { ROLES } from '../../constants/roles';

export function Badge({ variant = 'primary', children, className = '', ...props }) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'administrator':
      case 'admin':
      case 'danger':
      case 'red':
        return 'bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error)]/20';
      case 'treasurer':
      case 'primary':
      case 'blue':
        return 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] border-[var(--color-primary)]/20';
      case 'budget_officer':
      case 'budgetofficer':
      case 'purple':
        return 'bg-[var(--color-secondary-bg)] text-[var(--color-secondary)] border-[var(--color-secondary)]/20';
      case 'auditor':
      case 'warning':
      case 'orange':
        return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]/20';
      case 'active':
      case 'success':
      case 'green':
        return 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/20';
      case 'inactive':
      case 'secondary':
      case 'gray':
        return 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]';
      default:
        return 'bg-[var(--color-bg)] text-[var(--color-text-primary)] border-[var(--color-border)]';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${getVariantStyles()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function RoleBadge({ role, showIcon = true, className = '' }) {
  let variant = 'gray';
  let label = role || 'User';
  let Icon = User;

  if (role === ROLES.ADMINISTRATOR || role === 'Administrator') {
    variant = 'administrator';
    label = 'Administrator';
    Icon = ShieldCheck;
  } else if (role === ROLES.TREASURER || role === 'Treasurer') {
    variant = 'treasurer';
    label = 'Treasurer';
    Icon = Landmark;
  } else if (role === ROLES.BUDGET_OFFICER || role === 'Budget Officer' || role === 'BudgetOfficer') {
    variant = 'budget_officer';
    label = 'Budget Officer';
    Icon = PieChart;
  } else if (role === ROLES.AUDITOR || role === 'Auditor') {
    variant = 'auditor';
    label = 'Auditor';
    Icon = FileCheck;
  }

  return (
    <Badge variant={variant} className={className}>
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </Badge>
  );
}

export function StatusBadge({ status, className = '' }) {
  const isActive = status === 'Active';

  return (
    <Badge variant={isActive ? 'active' : 'inactive'} className={className}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive
            ? 'bg-[var(--color-success)] animate-pulse'
            : 'bg-[var(--color-text-muted)]'
        }`}
      />
      {status || 'Unknown'}
    </Badge>
  );
}

