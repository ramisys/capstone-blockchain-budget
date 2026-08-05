import React from 'react';
import { Badge } from '../ui/Badge';
import {
  AUDIT_ANCHOR_STATUS_DOT_COLORS,
  AUDIT_ANCHOR_STATUS_LABELS,
  AUDIT_ANCHOR_STATUS_VARIANTS,
} from '../../constants/audit';
import type { AuditAnchorStatus } from '../../types/audit';

interface AuditAnchorStatusBadgeProps {
  status: AuditAnchorStatus | string;
  className?: string;
}

/**
 * Colored badge for an audit anchor status (Pending / Confirmed / Failed).
 * Colors are centralized in `constants/audit.ts`.
 */
const AuditAnchorStatusBadge: React.FC<AuditAnchorStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const variant = AUDIT_ANCHOR_STATUS_VARIANTS[status] ?? 'secondary';
  const dotColor = AUDIT_ANCHOR_STATUS_DOT_COLORS[status] ?? 'bg-slate-400';

  return (
    <Badge variant={variant} className={className}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {AUDIT_ANCHOR_STATUS_LABELS[status] ?? status}
    </Badge>
  );
};

export { AuditAnchorStatusBadge };
export default AuditAnchorStatusBadge;
