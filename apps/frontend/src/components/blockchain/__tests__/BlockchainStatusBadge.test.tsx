import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '../../../test/test-utils';
import { BlockchainStatusBadge } from '../BlockchainStatusBadge';
import {
  BLOCKCHAIN_RECORD_STATUS,
  BLOCKCHAIN_RECORD_STATUS_LABELS,
} from '../../../constants/blockchainStatus';

describe('BlockchainStatusBadge', () => {
  it('renders a Confirmed label for confirmed records', () => {
    render(<BlockchainStatusBadge status={BLOCKCHAIN_RECORD_STATUS.CONFIRMED} />);
    expect(screen.getByText(BLOCKCHAIN_RECORD_STATUS_LABELS[BLOCKCHAIN_RECORD_STATUS.CONFIRMED])).toBeInTheDocument();
  });

  it('renders a Pending label for pending records', () => {
    render(<BlockchainStatusBadge status={BLOCKCHAIN_RECORD_STATUS.PENDING} />);
    expect(screen.getByText(BLOCKCHAIN_RECORD_STATUS_LABELS[BLOCKCHAIN_RECORD_STATUS.PENDING])).toBeInTheDocument();
  });

  it('renders a Failed label for failed records', () => {
    render(<BlockchainStatusBadge status={BLOCKCHAIN_RECORD_STATUS.FAILED} />);
    expect(screen.getByText(BLOCKCHAIN_RECORD_STATUS_LABELS[BLOCKCHAIN_RECORD_STATUS.FAILED])).toBeInTheDocument();
  });
});
