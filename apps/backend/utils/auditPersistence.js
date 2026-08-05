import { createHash, randomUUID } from 'node:crypto';
import { config } from '../config/env.js';
import { AUDIT_RESULTS } from '../constants/auditActions.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { auditEventBlockchainService } from '../services/auditEventBlockchainService.js';

/**
 * Map the audit logger result constants ('SUCCESS'/'FAILURE') to the Prisma
 * AuditResult enum values ('Success'/'Failure').
 *
 * @param {string} result - Audit result from AUDIT_RESULTS
 * @returns {string} Prisma AuditResult value
 */
export function mapAuditResult(result) {
  return result === AUDIT_RESULTS.FAILURE ? 'Failure' : 'Success';
}

/**
 * Build a canonical, hashable representation of an audit event. Field order is
 * fixed so identical events always produce identical hashes.
 *
 * @param {Object} entry - Audit entry returned by auditLogger.log()
 * @param {string} id - Generated UUID for this log row
 * @returns {Object} Canonical payload
 */
export function buildCanonicalPayload(entry, id) {
  const resource = entry.resource || {};
  const details = entry.details && Object.keys(entry.details).length > 0 ? entry.details : null;

  return {
    id,
    timestamp: entry.timestamp,
    action: entry.action,
    result: mapAuditResult(entry.result),
    actor: {
      id: entry.actor?.id ?? null,
      email: entry.actor?.email ?? null,
      name: entry.actor?.fullName ?? entry.actor?.name ?? null,
      role: entry.actor?.role ?? null,
    },
    ip: entry.ip === 'UNKNOWN' ? null : entry.ip,
    resource: {
      type: resource.type ?? null,
      id: resource.id ?? null,
      code: resource.code ?? null,
    },
    details,
  };
}

/**
 * Compute the SHA-256 event hash of a canonical audit payload.
 *
 * @param {Object} payload - Canonical payload from buildCanonicalPayload
 * @returns {string} Hex SHA-256 digest
 */
export function computeEventHash(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * Map a canonical audit payload to `audit_logs` columns for persistence.
 *
 * @param {Object} payload - Canonical payload from buildCanonicalPayload
 * @returns {Object} Prisma create data
 */
export function buildAuditLogData(payload) {
  return {
    id: payload.id,
    action: payload.action,
    result: payload.result,
    actorId: payload.actor.id,
    actorEmail: payload.actor.email,
    actorName: payload.actor.name,
    actorRole: payload.actor.role,
    ip: payload.ip,
    resourceType: payload.resource.type,
    resourceId: payload.resource.id,
    resourceCode: payload.resource.code,
    details: payload.details,
    eventHash: payload.eventHash,
    anchorStatus: 'Pending',
    createdAt: new Date(payload.timestamp),
  };
}

/**
 * Fire-and-forget persistence sink for structured audit entries.
 *
 * Converts an entry produced by `auditLogger.log()` into an immutable
 * `audit_logs` row (with a SHA-256 event hash) and inserts it. It never throws
 * and never blocks the caller: failures are logged and swallowed so that audit
 * persistence can never take down a request that is otherwise succeeding.
 *
 * @param {Object} entry - Audit entry returned by auditLogger.log()
 * @returns {Promise<void>} Resolves when the write attempt completes
 */
export async function persistAuditEntry(entry) {
  if (!config.auditLog.persistEnabled) {
    return;
  }

  try {
    const id = randomUUID();
    const payload = buildCanonicalPayload(entry, id);
    payload.eventHash = computeEventHash(payload);
    const auditLog = await auditLogRepository.create(buildAuditLogData(payload));

    // Fail-soft on-chain anchoring of the event hash. Runs inside the sink so
    // it never blocks the caller (auditLogger fires `void persistAuditEntry`),
    // and anchorEvent itself never throws. Unconfigured ledgers leave the row
    // Pending for the scheduler / manual retry to pick up.
    await auditEventBlockchainService.anchorEvent(auditLog);
  } catch (err) {
    console.error('[AUDIT-PERSIST] Failed to persist audit log entry:', err.message);
  }
}
