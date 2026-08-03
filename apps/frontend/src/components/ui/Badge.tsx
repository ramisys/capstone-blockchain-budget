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
        return 'bg-red-50 text-red-700 border-red-200/80 hover:bg-red-100/80';
      case 'treasurer':
      case 'primary':
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/80';
      case 'budget_officer':
      case 'budgetofficer':
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100/80';
      case 'auditor':
      case 'warning':
      case 'orange':
        return 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/80';
      case 'active':
      case 'success':
      case 'green':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/80';
      case 'inactive':
      case 'secondary':
      case 'gray':
        return 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
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
          isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
        }`}
      />
      {status || 'Unknown'}
    </Badge>
  );
}

