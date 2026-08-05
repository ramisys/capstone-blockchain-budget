import React from 'react';
import { Badge } from '../ui/Badge';
import {
  AUDIT_RESULT_DOT_COLORS,
  AUDIT_RESULT_LABELS,
  AUDIT_RESULT_VARIANTS,
} from '../../constants/audit';
import type { AuditResult } from '../../types/audit';

interface AuditResultBadgeProps {
  result: AuditResult | string;
  className?: string;
}

/**
 * Colored badge for an audit result (Success / Failure). Colors are
 * centralized in `constants/audit.ts`.
 */
const AuditResultBadge: React.FC<AuditResultBadgeProps> = ({ result, className = '' }) => {
  const variant = AUDIT_RESULT_VARIANTS[result] ?? 'secondary';
  const dotColor = AUDIT_RESULT_DOT_COLORS[result] ?? 'bg-slate-400';

  return (
    <Badge variant={variant} className={className}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {AUDIT_RESULT_LABELS[result] ?? result}
    </Badge>
  );
};

export { AuditResultBadge };
export default AuditResultBadge;
