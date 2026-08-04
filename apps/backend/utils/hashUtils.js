import crypto from 'node:crypto';
import { toNumber } from './amountUtils.js';

/**
 * Build a canonical content hash for a budget allocation.
 *
 * The hash covers every field that can change the meaning of a budget record
 * (references, amount, description, status, and workflow timestamps). Any edit
 * to these fields changes the digest, so a verified record whose on-chain hash
 * no longer matches the recomputed hash signals tampering.
 *
 * @param {Object} allocation - Budget allocation (Prisma or serialized shape)
 * @returns {string} Hex-encoded SHA-256 digest (32 bytes)
 */
export function computeAllocationContentHash(allocation) {
  const canonical = {
    allocationCode: allocation.allocationCode,
    fiscalYearId: allocation.fiscalYearId,
    departmentId: allocation.departmentId,
    fundSourceId: allocation.fundSourceId,
    categoryId: allocation.categoryId,
    programId: allocation.programId,
    allocatedAmount: toNumber(allocation.allocatedAmount),
    description: allocation.description ?? null,
    status: allocation.status,
    submittedAt: allocation.submittedAt ? new Date(allocation.submittedAt).toISOString() : null,
    reviewedBy: allocation.reviewedBy ?? null,
    reviewedAt: allocation.reviewedAt ? new Date(allocation.reviewedAt).toISOString() : null,
    rejectionReason: allocation.rejectionReason ?? null,
    createdAt: new Date(allocation.createdAt).toISOString(),
  };

  const json = JSON.stringify(canonical, Object.keys(canonical).sort());
  return crypto.createHash('sha256').update(json).digest('hex');
}
