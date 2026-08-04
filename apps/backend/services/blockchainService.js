import { config } from '../config/env.js';
import { blockchainProvider } from '../config/blockchain.js';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { allocationRepository } from '../repositories/allocationRepository.js';
import { computeAllocationContentHash } from '../utils/hashUtils.js';
import { BLOCKCHAIN_RECORD_STATUS } from '../constants/blockchainStatus.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_ACTIONS } from '../constants/auditActions.js';
import { logger } from '../utils/logger.js';
import { toNumber } from '../utils/amountUtils.js';

class BlockchainService {
  /**
   * Anchor an allocation on the ledger and mirror it in the database as the
   * allocation's current record. Any previous live record for the allocation
   * is superseded (kept on-chain and in the DB for audit, but excluded from
   * history and status counts), so repeated approvals after a return-to-draft
   * never accumulate stale duplicate records.
   *
   * Dedupes by content hash: a `Confirmed` record for identical content is
   * reused as-is, while a `Pending`/`Failed` record delegates to `retryRecord`
   * so the anchor is re-attempted instead of silently reusing the stale record.
   *
   * Fail-soft by design: when the ledger is unconfigured or the node is
   * unreachable, a `Pending`/`Failed` record is persisted and the allocation
   * lifecycle still succeeds. Such records can be re-anchored later via
   * `retryRecord`. If even the database mirror cannot be written, `null` is
   * returned (the failure is logged) so the already-committed allocation
   * create/approve still succeeds; the anchor can be recovered via `retryRecord`.
   *
   * @param {Object} allocation - Budget allocation (Prisma shape)
   * @param {string|Object} actor - User ID or user object performing the action
   * @returns {Promise<Object|null>} Blockchain record, or `null` if the DB mirror could not be persisted
   */
  async recordAllocation(allocation, actor) {
    const actorId = typeof actor === 'string' ? actor : actor?.id;

    const contentHash = computeAllocationContentHash(allocation);
    const existing = await blockchainRepository.findByContentHash(contentHash);
    if (existing) {
      if (existing.status === BLOCKCHAIN_RECORD_STATUS.CONFIRMED) {
        return this.serialize(existing);
      }

      try {
        return await this.retryRecord(existing.allocationId, actor);
      } catch (error) {
        logger.logEvent(
          `Blockchain re-anchor failed for ${allocation.allocationCode}: ${error?.message || error}`
        );
        return this.serialize(existing);
      }
    }

    let txHash = null;
    let blockNumber = null;
    let status = BLOCKCHAIN_RECORD_STATUS.PENDING;
    let confirmedAt = null;

    if (blockchainProvider.isConfigured()) {
      try {
        const outcome = await this.anchorUnlessExists(contentHash);
        txHash = outcome.txHash;
        blockNumber = outcome.blockNumber;
        status = BLOCKCHAIN_RECORD_STATUS.CONFIRMED;
        confirmedAt = outcome.confirmedAt;
      } catch (error) {
        status = BLOCKCHAIN_RECORD_STATUS.FAILED;
        logger.logEvent(
          `Blockchain record failed for ${allocation.allocationCode}: ${error?.message || error}`
        );
        auditLogger.logFailure({
          action: AUDIT_ACTIONS.BLOCKCHAIN_RECORD,
          actor: actorId,
          resource: { type: 'Allocation', id: allocation.id, code: allocation.allocationCode },
          details: { reason: error?.message || String(error) },
        });
      }
    }

    try {
      const record = await blockchainRepository.createCurrent({
        allocationId: allocation.id,
        allocationCode: allocation.allocationCode,
        contentHash,
        txHash,
        blockNumber,
        network: config.blockchain.network,
        status,
        confirmedAt,
        createdBy: actorId,
      });

      auditLogger.logSuccess({
        action: AUDIT_ACTIONS.BLOCKCHAIN_RECORD,
        actor: actorId,
        resource: { type: 'Allocation', id: allocation.id, code: allocation.allocationCode },
        details: { status, contentHash, txHash: txHash ?? null },
      });

      return this.serialize(record);
    } catch (error) {
      // Fail-soft mirror: the allocation lifecycle has already committed by the
      // time the anchor is persisted here, so a failed DB write must not turn a
      // successful create/approve into an errored request. The failure is
      // logged for audit and the record can be recovered later via retryRecord.
      logger.logEvent(
        `Blockchain record could not be persisted for ${allocation.allocationCode}: ${error?.message || error}`
      );
      auditLogger.logFailure({
        action: AUDIT_ACTIONS.BLOCKCHAIN_RECORD,
        actor: actorId,
        resource: { type: 'Allocation', id: allocation.id, code: allocation.allocationCode },
        details: { reason: error?.message || String(error) },
      });
      return null;
    }
  }

  /**
   * Verify that an allocation matches its anchored blockchain record.
   *
   * Compares the recomputed content hash against the stored hash (local
   * integrity) and, when a node is reachable, confirms the hash is anchored
   * on-chain.
   *
   * @param {string} allocationId - Allocation ID
   * @param {string|Object} actor - User ID or user object performing the action
   * @returns {Promise<Object>} Verification result
   */
  async verifyAllocation(allocationId, actor) {
    const actorId = typeof actor === 'string' ? actor : actor?.id;
    const allocation = await allocationRepository.findById(allocationId);
    if (!allocation || allocation.deletedAt) {
      throw new AppError('Allocation not found', HTTP_STATUS.NOT_FOUND);
    }

    const record = await blockchainRepository.findByAllocationId(allocationId);
    if (!record) {
      return {
        verified: false,
        integrityOk: null,
        onChain: null,
        record: null,
        message: 'No blockchain record exists for this allocation.',
      };
    }

    const currentHash = computeAllocationContentHash(allocation);
    const integrityOk = currentHash === record.contentHash;

    let onChain = null;
    if (blockchainProvider.isConfigured() && record.contentHash) {
      try {
        onChain = await blockchainProvider.verify(`0x${record.contentHash}`);
      } catch (error) {
        onChain = null;
      }
    }

    const verified = Boolean(integrityOk && onChain?.exists);

    auditLogger.logSuccess({
      action: AUDIT_ACTIONS.BLOCKCHAIN_VERIFY,
      actor: actorId,
      resource: { type: 'Allocation', id: allocation.id, code: allocation.allocationCode },
      details: { verified, integrityOk, onChainExists: Boolean(onChain?.exists) },
    });

    const inconclusive = !verified && integrityOk && onChain === null;

    let message;
    if (verified) {
      message = 'Allocation verified on the blockchain ledger.';
    } else if (!integrityOk) {
      message = 'Allocation does not match its anchored record — possible tampering.';
    } else if (onChain === null) {
      message =
        'On-chain verification is inconclusive — the blockchain node is unreachable, so the anchor could not be confirmed.';
    } else {
      message = 'On-chain record not found; the allocation has not been anchored on this node.';
    }

    return {
      verified,
      integrityOk,
      onChain,
      inconclusive,
      record: this.serialize(record),
      message,
    };
  }

  /**
   * Get paginated blockchain transaction history.
   *
   * @param {Object} filters - Filter criteria (search, status, allocationId,
   *                           dateFrom, dateTo)
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} ordering - Ordering options (sortBy, sortOrder)
   * @returns {Promise<Object>} Transactions list and pagination info
   */
  async getTransactionHistory(filters = {}, pagination = {}, ordering = {}) {
    const [records, totalCount] = await Promise.all([
      blockchainRepository.findMany(filters, pagination, ordering),
      blockchainRepository.count(filters),
    ]);

    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      transactions: this.serializeMany(records),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get the blockchain ledger status for the status dashboard.
   *
   * @returns {Promise<Object>} Status summary
   */
  async getBlockchainStatus() {
    const providerStatus = await blockchainProvider.getStatus();
    const [statusCounts, latest] = await Promise.all([
      blockchainRepository.countByStatus(),
      blockchainRepository.getLatest(),
    ]);

    const recordCount = statusCounts.reduce((sum, group) => sum + group._count, 0);
    const confirmedCount = statusCounts.find(
      (g) => g.status === BLOCKCHAIN_RECORD_STATUS.CONFIRMED
    )?._count ?? 0;
    const pendingCount = statusCounts.find((g) => g.status === BLOCKCHAIN_RECORD_STATUS.PENDING)?._count ?? 0;
    const failedCount = statusCounts.find((g) => g.status === BLOCKCHAIN_RECORD_STATUS.FAILED)?._count ?? 0;

    return {
      ...providerStatus,
      recordCount,
      confirmedCount,
      pendingCount,
      failedCount,
      lastSync: latest?.createdAt?.toISOString() ?? providerStatus.lastSync,
    };
  }

  /**
   * Re-anchor a Pending or Failed record for an allocation. If no record
   * exists yet, one is created.
   *
   * @param {string} allocationId - Allocation ID
   * @param {Object} actor - Authenticated user performing the action
   * @returns {Promise<Object>} Updated blockchain record
   */
  async retryRecord(allocationId, actor) {
    const allocation = await allocationRepository.findById(allocationId);
    if (!allocation || allocation.deletedAt) {
      throw new AppError('Allocation not found', HTTP_STATUS.NOT_FOUND);
    }

    const existing = await blockchainRepository.findByAllocationId(allocationId);
    if (!existing) {
      const created = await this.recordAllocation(allocation, actor);
      if (!created) {
        throw new AppError(
          'Failed to persist blockchain record on the ledger',
          HTTP_STATUS.SERVICE_UNAVAILABLE
        );
      }
      return created;
    }

    if (existing.status === BLOCKCHAIN_RECORD_STATUS.CONFIRMED && existing.txHash) {
      return this.serialize(existing);
    }

    if (!blockchainProvider.isConfigured()) {
      throw new AppError('Blockchain ledger is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    try {
      const outcome = await this.anchorUnlessExists(existing.contentHash);
      const updated = await blockchainRepository.update(existing.id, {
        txHash: outcome.txHash,
        blockNumber: outcome.blockNumber,
        status: BLOCKCHAIN_RECORD_STATUS.CONFIRMED,
        confirmedAt: outcome.confirmedAt,
        network: config.blockchain.network,
      });

      auditLogger.logSuccess({
        action: AUDIT_ACTIONS.BLOCKCHAIN_RETRY,
        actor,
        resource: { type: 'Allocation', id: allocation.id, code: allocation.allocationCode },
        details: {
          txHash: outcome.txHash ?? null,
          blockNumber: outcome.blockNumber,
          recoveredOnChain: outcome.recovered,
        },
      });

      return this.serialize(updated);
    } catch (error) {
      auditLogger.logFailure({
        action: AUDIT_ACTIONS.BLOCKCHAIN_RETRY,
        actor,
        resource: { type: 'Allocation', id: allocation.id, code: allocation.allocationCode },
        details: { reason: error?.message || String(error) },
      });
      throw new AppError(
        `Failed to anchor allocation on the blockchain: ${error?.message || String(error)}`,
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Anchor a content hash unless it is already on the ledger.
   *
   * When a previous write succeeded but the database mirror was never
   * persisted (crash / DB failure), re-submitting would make the contract
   * revert with `HashAlreadyRecorded`. Recover the anchoring data from the
   * ledger instead, marking the record Confirmed from on-chain data.
   *
   * @private
   * @param {string} contentHash - SHA-256 content hash (no 0x prefix)
   * @returns {Promise<{txHash: string|null, blockNumber: number|null, confirmedAt: Date, recovered: boolean}>}
   */
  async anchorUnlessExists(contentHash) {
    const hexHash = `0x${contentHash}`;

    let verification = null;
    try {
      verification = await blockchainProvider.verify(hexHash);
    } catch {
      verification = null;
    }

    if (verification?.exists) {
      return {
        txHash: null,
        blockNumber: verification.blockNumber,
        confirmedAt: new Date(verification.anchoredAt * 1000),
        recovered: true,
      };
    }

    const confirmation = await blockchainProvider.record(hexHash);
    return {
      txHash: confirmation.txHash,
      blockNumber: confirmation.blockNumber,
      confirmedAt: new Date(),
      recovered: false,
    };
  }

  /**
   * Normalize a blockchain record for API responses (BigInt -> number,
   * Decimal -> number).
   *
   * @private
   * @param {Object|null} record - Record from Prisma
   * @returns {Object|null} Serialized record
   */
  serialize(record) {
    if (!record) return record;
    return {
      ...record,
      blockNumber: record.blockNumber !== null ? Number(record.blockNumber) : null,
      txExplorerUrl: blockchainProvider.getExplorerTxUrl(record.txHash),
      allocation: record.allocation
        ? {
            ...record.allocation,
            allocatedAmount: toNumber(record.allocation.allocatedAmount),
          }
        : undefined,
    };
  }

  /**
   * Normalize a list of blockchain records for API responses.
   *
   * @private
   * @param {Array<Object>} records - Records from Prisma
   * @returns {Array<Object>} Serialized records
   */
  serializeMany(records) {
    return records.map((record) => this.serialize(record));
  }
}

export const blockchainService = new BlockchainService();
