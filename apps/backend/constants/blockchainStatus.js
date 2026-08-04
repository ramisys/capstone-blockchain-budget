/**
 * Blockchain record status values used throughout the blockchain module.
 * These mirror the `BlockchainRecordStatus` Prisma enum.
 */
export const BLOCKCHAIN_RECORD_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  FAILED: 'Failed',
};

export const BLOCKCHAIN_RECORD_STATUS_LIST = Object.values(BLOCKCHAIN_RECORD_STATUS);
