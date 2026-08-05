import React from 'react';
import { Badge } from '../ui/Badge';
import {
  DOCUMENT_STATUS_DOT_COLORS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_VARIANTS,
} from '../../constants/documentStatus';
import type { DocumentStatus } from '../../types/document';

interface DocumentStatusBadgeProps {
  status: DocumentStatus | string;
  className?: string;
}

/**
 * Colored badge for a document lifecycle status (Active / Archived).
 * Colors are centralized in `constants/documentStatus.ts`.
 */
const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const variant = DOCUMENT_STATUS_VARIANTS[status] ?? 'secondary';
  const dotColor = DOCUMENT_STATUS_DOT_COLORS[status] ?? 'bg-slate-400';

  return (
    <Badge variant={variant} className={className}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {DOCUMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
};

export { DocumentStatusBadge };
export default DocumentStatusBadge;
