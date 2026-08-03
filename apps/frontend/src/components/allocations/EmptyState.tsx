import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Friendly empty state used when a list or panel has no data.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  const isComponent = typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon);
  const IconComponent = isComponent ? (icon as LucideIcon) : null;

  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-16 ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          {IconComponent ? (
            <IconComponent className="w-8 h-8 text-slate-400" />
          ) : (
            (icon as React.ReactNode)
          )}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export { EmptyState };
export default EmptyState;
