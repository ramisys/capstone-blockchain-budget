import crypto from 'node:crypto';
import fs from 'node:fs';
import { config } from '../config/env.js';
import { blockchainProvider } from '../config/blockchain.js';
import { blockchainService } from './blockchainService.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { documentStorage } from './documentStorageService.js';
import { BLOCKCHAIN_RECORD_STATUS } from '../constants/blockchainStatus.js';
import { DOCUMENT_ACTIVITY_ACTIONS } from '../constants/documentActivityActions.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_ACTIONS } from '../constants/auditActions.js';
import { logger } from '../utils/logger.js';
import { toNumber } from '../utils/amountUtils.js';
import { hashStream } from '../utils/fileUtils.js';

/**
 * Blockchain integration for document versions: fail-soft anchoring on upload /
 * replace, on-demand tamper + on-chain verification, and manual re-anchoring.
 *
 * Each document version carries its own SHA-256 file hash, which is anchored on
 * the BudgetLedger contract. Mirrors the allocation blockchain service's
 * response shape ({ verified, integrityOk, onChain, inconclusive }) so the
 * frontend verification card is reusable.
 */
class DocumentBlockchainService {
  /**
   * Fail-soft anchor for a freshly created version (upload / replace). The
   * document lifecycle must never fail because the ledger is down or
   * unconfigured: unconfigured versions stay Pending, node errors mark the
   * version Failed, and both are recoverable later via retryDocumentVersion or
   * the scheduler. Never throws.
   *
   * @param {Object} version - Freshly created DocumentVersion (with sha256Hash)
   * @param {string|Object} actor - User ID or user object triggering the anchor
   * @returns {Promise<Object>} The (possibly updated) version
   */
  async anchorVersion(version, actor) {
    if (!version?.sha256Hash) return version;
    if (version.blockchainStatus === BLOCKCHAIN_RECORD_STATUS.CONFIRMED && version.txHash) {
      return version;
    }

    const actorId = typeof actor === 'string' ? actor : actor?.id;

    if (!blockchainProvider.isConfigured()) {
      return version;
    }

    try {
      const outcome = await blockchainService.anchorUnlessExists(version.sha256Hash);
      const updated = await documentRepository.updateVersion(version.id, {
        txHash: outcome.txHash,
        blockNumber: outcome.blockNumber,
        blockchainStatus: BLOCKCHAIN_RECORD_STATUS.CONFIRMED,
        confirmedAt: outcome.confirmedAt,
        network: config.blockchain.network,
      });

      auditLogger.logSuccess({
        action: AUDIT_ACTIONS.DOCUMENT_ANCHOR_RETRY,
        actor: actorId,
        resource: { type: 'DocumentVersion', id: version.id },
        details: {
          txHash: outcome.txHash ?? null,
          blockNumber: outcome.blockNumber,
          recoveredOnChain: outcome.recovered,
        },
      });

      return updated;
    } catch (error) {
      logger.logEvent(
        `Blockchain anchor failed for document version ${version.id}: ${error?.message || error}`
      );

      const updated = await documentRepository
        .updateVersion(version.id, { blockchainStatus: BLOCKCHAIN_RECORD_STATUS.FAILED })
        .catch(() => null);

      return updated ?? version;
    }
  }

  /**
   * Verify a document version's integrity against its anchored hash.
   *
   * Recomputed SHA-256 of the stored bytes is compared with the hash recorded
   * at upload (local tamper check) and, when a node is reachable, the on-chain
   * ledger is consulted to confirm the anchor exists. A VERIFY activity and
   * audit entry are always recorded.
   *
   * @param {string} id - Document ID
   * @param {number} [versionNumber] - Optional 1-based version number (defaults to current)
   * @param {string|Object} actor - User ID or user object performing the verification
   * @returns {Promise<Object>} Verification result
   */
  async verifyDocument(id, versionNumber, actor) {
    const actorId = typeof actor === 'string' ? actor : actor?.id;
    const document = await documentRepository.findById(id);
    if (!document || document.deletedAt) {
      throw new AppError('Document not found', HTTP_STATUS.NOT_FOUND);
    }

    const version = await this.resolveVersion(document, versionNumber);

    let integrityOk;
    try {
      integrityOk = await this.computeIntegrity(version);
    } catch (error) {
      logger.logEvent(
        `Document integrity check failed for version ${version.id}: ${error?.message || error}`
      );
      throw new AppError('Stored file could not be read for verification', HTTP_STATUS.NOT_FOUND);
    }

    let onChain = null;
    if (blockchainProvider.isConfigured() && version.sha256Hash) {
      try {
        onChain = await blockchainProvider.verify(`0x${version.sha256Hash}`);
      } catch {
        onChain = null;
      }
    }

    const verified = Boolean(integrityOk && onChain?.exists);
    const inconclusive = !verified && integrityOk && onChain === null;

    let message;
    if (verified) {
      message = 'Document verified on the blockchain ledger.';
    } else if (!integrityOk) {
      message = 'Document does not match its anchored hash — possible tampering.';
    } else if (onChain === null) {
      message =
        'On-chain verification is inconclusive — the blockchain node is unreachable, so the anchor could not be confirmed.';
    } else {
      message = 'On-chain record not found; this version has not been anchored on this node.';
    }

    await documentRepository.createActivity({
      documentId: id,
      versionId: version.id,
      actorId,
      action: DOCUMENT_ACTIVITY_ACTIONS.VERIFY,
      details: { verified, integrityOk, onChainExists: Boolean(onChain?.exists), inconclusive },
    });

    auditLogger.logSuccess({
      action: AUDIT_ACTIONS.DOCUMENT_VERIFY,
      actor,
      resource: { type: 'Document', id, code: document.documentCode },
      details: {
        versionNumber: version.versionNumber,
        verified,
        integrityOk,
        onChainExists: Boolean(onChain?.exists),
        inconclusive,
      },
    });

    return {
      verified,
      integrityOk,
      onChain,
      inconclusive,
      message,
      documentCode: document.documentCode,
      version: this.serializeVersion(version),
    };
  }

  /**
   * Verify a user-uploaded file against the ledger WITHOUT storing it. The
   * server streams the inbound temp file (never persisting it), computes its
   * SHA-256, and looks up a matching DocumentVersion by hash. When a match is
   * found the on-chain ledger is consulted; when no stored document matches,
   * the result reports verifiedAgainst: 'none' and is never a false "verified".
   *
   * Mirrors the verifyDocument result shape ({ verified, integrityOk, onChain,
   * inconclusive, message }) plus `matchedVersion` and `verifiedAgainst`
   * ('blockchain' | 'database' | 'none').
   *
   * @param {Object} file - Parsed upload file (from uploadMiddleware)
   * @param {string|Object} actor - User ID or user object performing the check
   * @returns {Promise<Object>} Verification result
   */
  async verifyExternalFile(file, actor) {
    if (!file?.path) {
      throw new AppError('A valid file is required', HTTP_STATUS.BAD_REQUEST);
    }
    const actorId = typeof actor === 'string' ? actor : actor?.id;

    let computed;
    try {
      computed = await hashStream(fs.createReadStream(file.path));
    } catch (error) {
      logger.logEvent(`External file hashing failed: ${error?.message || error}`);
      throw new AppError('Uploaded file could not be read for verification', HTTP_STATUS.NOT_FOUND);
    }

    const matchedVersion = await documentRepository.findVersionByHashWithDocument(
      computed.sha256Hash
    );

    if (!matchedVersion) {
      auditLogger.logSuccess({
        action: AUDIT_ACTIONS.DOCUMENT_VERIFY,
        actor,
        resource: { type: 'Document' },
        details: {
          source: 'external',
          verified: false,
          verifiedAgainst: 'none',
          sha256Hash: computed.sha256Hash,
        },
      });

      return {
        verified: false,
        integrityOk: false,
        onChain: null,
        inconclusive: false,
        message:
          'No document in the system matches this file. It has not been registered or anchored.',
        matchedVersion: null,
        verifiedAgainst: 'none',
      };
    }

    const sha256Hash = matchedVersion.sha256Hash;
    let onChain = null;
    if (blockchainProvider.isConfigured() && sha256Hash) {
      try {
        onChain = await blockchainProvider.verify(`0x${sha256Hash}`);
      } catch {
        onChain = null;
      }
    }

    // Matched by exact hash, so the uploaded bytes agree with the stored hash.
    const integrityOk = true;
    const verified = Boolean(integrityOk && onChain?.exists);
    const inconclusive = !verified && integrityOk && onChain === null;

    let verifiedAgainst;
    let message;
    if (verified) {
      verifiedAgainst = 'blockchain';
      message = 'File verified on the blockchain ledger.';
    } else if (onChain === null) {
      verifiedAgainst = 'database';
      message =
        'The file matches a stored document, but on-chain verification is inconclusive — the blockchain node is unreachable, so the anchor could not be confirmed.';
    } else {
      verifiedAgainst = 'database';
      message =
        'The file matches a stored document, but its hash is not anchored on this node.';
    }

    await documentRepository.createActivity({
      documentId: matchedVersion.documentId,
      versionId: matchedVersion.id,
      actorId,
      action: DOCUMENT_ACTIVITY_ACTIONS.VERIFY,
      details: {
        source: 'external',
        verified,
        integrityOk,
        onChainExists: Boolean(onChain?.exists),
        inconclusive,
      },
    });

    auditLogger.logSuccess({
      action: AUDIT_ACTIONS.DOCUMENT_VERIFY,
      actor,
      resource: {
        type: 'Document',
        id: matchedVersion.documentId,
        code: matchedVersion.document?.documentCode,
      },
      details: {
        source: 'external',
        versionNumber: matchedVersion.versionNumber,
        verified,
        integrityOk,
        onChainExists: Boolean(onChain?.exists),
        inconclusive,
        verifiedAgainst,
      },
    });

    return {
      verified,
      integrityOk,
      onChain,
      inconclusive,
      message,
      matchedVersion: this.serializeVersion(matchedVersion),
      verifiedAgainst,
    };
  }

  /**
   * Re-anchor a single version on the ledger (shared by the retry endpoint and
   * the scheduler). Already-confirmed versions are returned as-is; unconfigured
   * ledgers and anchor failures throw 503 so callers can decide how to fail.
   *
   * @param {Object} version - DocumentVersion to re-anchor
   * @param {string|Object} actor - User ID, user object, or system actor
   * @returns {Promise<Object>} Updated version
   */
  async retryVersion(version, actor) {
    const actorId = typeof actor === 'string' ? actor : actor?.id;

    if (version.blockchainStatus === BLOCKCHAIN_RECORD_STATUS.CONFIRMED && version.txHash) {
      return version;
    }

    if (!blockchainProvider.isConfigured()) {
      throw new AppError('Blockchain ledger is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    try {
      const outcome = await blockchainService.anchorUnlessExists(version.sha256Hash);
      const updated = await documentRepository.updateVersion(version.id, {
        txHash: outcome.txHash,
        blockNumber: outcome.blockNumber,
        blockchainStatus: BLOCKCHAIN_RECORD_STATUS.CONFIRMED,
        confirmedAt: outcome.confirmedAt,
        network: config.blockchain.network,
      });

      auditLogger.logSuccess({
        action: AUDIT_ACTIONS.DOCUMENT_ANCHOR_RETRY,
        actor: actorId,
        resource: { type: 'DocumentVersion', id: version.id },
        details: {
          txHash: outcome.txHash ?? null,
          blockNumber: outcome.blockNumber,
          recoveredOnChain: outcome.recovered,
        },
      });

      return updated;
    } catch (error) {
      auditLogger.logFailure({
        action: AUDIT_ACTIONS.DOCUMENT_ANCHOR_RETRY,
        actor: actorId,
        resource: { type: 'DocumentVersion', id: version.id },
        details: { reason: error?.message || String(error) },
      });
      throw new AppError(
        `Failed to anchor document on the blockchain: ${error?.message || String(error)}`,
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Re-anchor a document's version through the API: resolves the document and
   * version, delegates to retryVersion, and records an ANCHOR_RETRY activity.
   *
   * @param {string} id - Document ID
   * @param {number} [versionNumber] - Optional 1-based version number (defaults to current)
   * @param {string|Object} actor - Authenticated user performing the retry
   * @returns {Promise<Object>} Updated version
   */
  async retryDocumentVersion(id, versionNumber, actor) {
    const actorId = typeof actor === 'string' ? actor : actor?.id;
    const document = await documentRepository.findById(id);
    if (!document || document.deletedAt) {
      throw new AppError('Document not found', HTTP_STATUS.NOT_FOUND);
    }

    const version = await this.resolveVersion(document, versionNumber);
    const updated = await this.retryVersion(version, actorId);

    await documentRepository.createActivity({
      documentId: id,
      versionId: version.id,
      actorId,
      action: DOCUMENT_ACTIVITY_ACTIONS.ANCHOR_RETRY,
      details: {
        versionNumber: version.versionNumber,
        status: updated.blockchainStatus,
        txHash: updated.txHash ?? null,
      },
    });

    return this.serializeVersion(updated);
  }

  /**
   * Resolve the version to verify/retry for a document.
   *
   * @private
   * @param {Object} document - Live document (with currentVersion included)
   * @param {number} [versionNumber] - Optional 1-based version number
   * @returns {Promise<Object>} Resolved version
   */
  async resolveVersion(document, versionNumber) {
    if (!versionNumber) {
      if (!document.currentVersion) {
        throw new AppError('Document has no current version', HTTP_STATUS.NOT_FOUND);
      }
      return document.currentVersion;
    }

    const version = await documentRepository.findVersionByDocumentAndNumber(
      document.id,
      versionNumber
    );
    if (!version) {
      throw new AppError('Document version not found', HTTP_STATUS.NOT_FOUND);
    }
    return version;
  }

  /**
   * Recompute the SHA-256 of a version's stored bytes and compare it with the
   * hash recorded at upload time. A mismatch signals tampering or corruption.
   *
   * @private
   * @param {Object} version - DocumentVersion (with storageKey and sha256Hash)
   * @returns {Promise<boolean>} Whether the stored bytes match the recorded hash
   */
  computeIntegrity(version) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = documentStorage.openReadStream(version.storageKey);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex') === version.sha256Hash));
      stream.on('error', reject);
    });
  }

  /**
   * Normalize a document version for API responses (BigInt -> number, plus a
   * block explorer link when a transaction hash is present).
   *
   * @private
   * @param {Object|null} version - Version from Prisma
   * @returns {Object|null} Serialized version
   */
  serializeVersion(version) {
    if (!version) return version;
    return {
      ...version,
      fileSizeBytes: toNumber(version.fileSizeBytes),
      blockNumber: version.blockNumber != null ? Number(version.blockNumber) : null,
      txExplorerUrl: blockchainProvider.getExplorerTxUrl(version.txHash),
    };
  }
}

export const documentBlockchainService = new DocumentBlockchainService();
