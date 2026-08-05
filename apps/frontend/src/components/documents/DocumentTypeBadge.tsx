import React from 'react';
import { Badge } from '../ui/Badge';
import { DOCUMENT_TYPE_LABELS } from '../../constants/documentType';
import type { DocumentType } from '../../types/document';

interface DocumentTypeBadgeProps {
  type: DocumentType | string;
  className?: string;
}

/**
 * Neutral badge showing a document's category label (e.g. Purchase Request).
 */
const DocumentTypeBadge: React.FC<DocumentTypeBadgeProps> = ({ type, className = '' }) => {
  const label = DOCUMENT_TYPE_LABELS[type] ?? type;

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  );
};

export { DocumentTypeBadge };
export default DocumentTypeBadge;
