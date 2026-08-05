import { config } from '../config/env.js';
import { blockchainProvider } from '../config/blockchain.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { AUDIT_ANCHOR_STATUS } from '../constants/auditAnchorStatus.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_ACTIONS } from '../constants/auditActions.js';
import { logger } from '../utils/logger.js';

/**
 * Blockchain anchoring for persisted audit log entries.
 *
 * Each audit log row carries a SHA-256 `eventHash` of its canonical payload.
 * This service anchors that hash on the AuditLedger contract, fail-soft:
 * unconfigured ledgers leave the row Pending, node errors mark it Failed, and
 * both are recoverable later via `retryEvent` or the scheduler. Mirrors the
 * allocation/document blockchain services' response shapes and recovery
 * behaviour (verify-before-record) so a crash-window duplicate can never
 * surface as a contract revert.
 */
class AuditEventBlockchainService {
  /**
   * Fail-soft anchor for a freshly persisted audit log entry. The audit write
   * must never fail because the ledger is down or unconfigured: unconfigured
   * entries stay Pending, node errors mark the entry Failed, and both are
   * recoverable later via `retryEvent` or the scheduler. Never throws.
   *
   * @param {Object} auditLog - Persisted audit log row (with eventHash + action)
   * @returns {Promise<Object>} The (possibly updated) audit log row
   */
  async anchorEvent(auditLog) {
    if (!auditLog?.eventHash) return auditLog;
    if (
      auditLog.anchorStatus === AUDIT_ANCHOR_STATUS.CONFIRMED &&
      auditLog.txHash
    ) {
      return auditLog;
    }

    if (!blockchainProvider.isAuditConfigured()) {
      return auditLog;
    }

    try {
      const outcome = await this.anchorUnlessExists(auditLog.eventHash, auditLog.action);
      const updated = await auditLogRepository.updateAnchor(auditLog.id, {
        anchorStatus: AUDIT_ANCHOR_STATUS.CONFIRMED,
        txHash: outcome.txHash,
        blockNumber: outcome.blockNumber,
        network: config.blockchain.network,
        confirmedAt: outcome.confirmedAt,
      });

      auditLogger.logSuccess({
        action: AUDIT_ACTIONS.AUDIT_ANCHOR_RETRY,
        actor: auditLog.actorId ?? 'system-scheduler',
        resource: { type: 'AuditLog', id: auditLog.id },
        details: {
          txHash: outcome.txHash ?? null,
          blockNumber: outcome.blockNumber,
          recoveredOnChain: outcome.recovered,
        },
      });

      return updated;
    } catch (error) {
      logger.logEvent(
        `Audit event anchor failed for audit log ${auditLog.id}: ${error?.message || error}`
      );

      const updated = await auditLogRepository
        .updateAnchor(auditLog.id, { anchorStatus: AUDIT_ANCHOR_STATUS.FAILED })
        .catch(() => null);

      return updated ?? auditLog;
    }
  }

  /**
   * Re-anchor a single audit log entry on the AuditLedger contract (shared by
   * the retry endpoint and the scheduler). Already-confirmed entries are
   * returned as-is; unconfigured ledgers and anchor failures throw 503 so
   * callers can decide how to fail.
   *
   * @param {Object} auditLog - Audit log row to re-anchor
   * @param {string|Object} actor - User ID, user object, or system actor
   * @returns {Promise<Object>} Updated audit log row
   */
  async retryEvent(auditLog, actor) {
    const actorId = typeof actor === 'string' ? actor : actor?.id;

    if (auditLog.anchorStatus === AUDIT_ANCHOR_STATUS.CONFIRMED && auditLog.txHash) {
      return auditLog;
    }

    if (!blockchainProvider.isAuditConfigured()) {
      throw new AppError('Blockchain ledger is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    try {
      const outcome = await this.anchorUnlessExists(auditLog.eventHash, auditLog.action);
      const updated = await auditLogRepository.updateAnchor(auditLog.id, {
        anchorStatus: AUDIT_ANCHOR_STATUS.CONFIRMED,
        txHash: outcome.txHash,
        blockNumber: outcome.blockNumber,
        network: config.blockchain.network,
        confirmedAt: outcome.confirmedAt,
      });

      auditLogger.logSuccess({
        action: AUDIT_ACTIONS.AUDIT_ANCHOR_RETRY,
        actor: actorId,
        resource: { type: 'AuditLog', id: auditLog.id },
        details: {
          txHash: outcome.txHash ?? null,
          blockNumber: outcome.blockNumber,
          recoveredOnChain: outcome.recovered,
        },
      });

      return updated;
    } catch (error) {
      auditLogger.logFailure({
        action: AUDIT_ACTIONS.AUDIT_ANCHOR_RETRY,
        actor: actorId,
        resource: { type: 'AuditLog', id: auditLog.id },
        details: { reason: error?.message || String(error) },
      });
      throw new AppError(
        `Failed to anchor audit event on the blockchain: ${error?.message || String(error)}`,
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Anchor an event hash unless it is already on the AuditLedger contract.
   *
   * When a previous write succeeded but the database mirror was never updated
   * (crash / DB failure), re-submitting would make the contract revert with
   * `EventAlreadyRecorded`. Recover the anchoring data from the ledger instead,
   * marking the entry Confirmed from on-chain data.
   *
   * @private
   * @param {string} eventHash - SHA-256 event hash (no 0x prefix)
   * @param {string} category - Event category (the audit action)
   * @returns {Promise<{txHash: string|null, blockNumber: number|null, confirmedAt: Date, recovered: boolean}>}
   */
  async anchorUnlessExists(eventHash, category) {
    const hexHash = `0x${eventHash}`;

    let verification = null;
    try {
      verification = await blockchainProvider.auditVerify(hexHash);
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

    const confirmation = await blockchainProvider.auditRecord(hexHash, category);
    return {
      txHash: confirmation.txHash,
      blockNumber: confirmation.blockNumber,
      confirmedAt: new Date(),
      recovered: false,
    };
  }

  /**
   * Normalize an audit log entry for API responses (BigInt -> number).
   *
   * @private
   * @param {Object|null} auditLog - Entry from Prisma
   * @returns {Object|null} Serialized entry
   */
  serialize(auditLog) {
    if (!auditLog) return auditLog;
    return {
      ...auditLog,
      blockNumber:
        auditLog.blockNumber !== null && auditLog.blockNumber !== undefined
          ? Number(auditLog.blockNumber)
          : null,
      txExplorerUrl: blockchainProvider.getExplorerTxUrl(auditLog.txHash),
    };
  }
}

export const auditEventBlockchainService = new AuditEventBlockchainService();
