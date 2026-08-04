import React from 'react';
import { Badge } from '../ui/Badge';
import {
  BLOCKCHAIN_RECORD_STATUS_DOT_COLORS,
  BLOCKCHAIN_RECORD_STATUS_LABELS,
  BLOCKCHAIN_RECORD_STATUS_VARIANTS,
} from '../../constants/blockchainStatus';
import type { BlockchainRecordStatus } from '../../types/blockchain';

interface BlockchainStatusBadgeProps {
  status: BlockchainRecordStatus | string;
  className?: string;
}

/**
 * Colored badge for a blockchain record status (Pending / Confirmed / Failed).
 * Colors are centralized in `constants/blockchainStatus.ts`.
 */
const BlockchainStatusBadge: React.FC<BlockchainStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const variant = BLOCKCHAIN_RECORD_STATUS_VARIANTS[status] ?? 'secondary';
  const dotColor = BLOCKCHAIN_RECORD_STATUS_DOT_COLORS[status] ?? 'bg-slate-400';

  return (
    <Badge variant={variant} className={className}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {BLOCKCHAIN_RECORD_STATUS_LABELS[status] ?? status}
    </Badge>
  );
};

export { BlockchainStatusBadge };
export default BlockchainStatusBadge;
