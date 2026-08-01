import React from 'react';
import { Badge } from '../ui/Badge';
import {
  ALLOCATION_STATUS_DOT_COLORS,
  ALLOCATION_STATUS_LABELS,
  ALLOCATION_STATUS_VARIANTS,
} from '../../constants/allocationStatus';
import type { AllocationStatus } from '../../types/allocation';

interface AllocationStatusBadgeProps {
  status: AllocationStatus;
  className?: string;
}

/**
 * Colored badge for an allocation status. Colors are centralized in
 * `constants/allocationStatus.js` so they stay consistent app-wide.
 */
const AllocationStatusBadge: React.FC<AllocationStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const variant = ALLOCATION_STATUS_VARIANTS[status] ?? 'secondary';
  const dotColor = ALLOCATION_STATUS_DOT_COLORS[status] ?? 'bg-slate-400';

  return (
    <Badge variant={variant} className={className}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {ALLOCATION_STATUS_LABELS[status] ?? status}
    </Badge>
  );
};

export { AllocationStatusBadge };
export default AllocationStatusBadge;
