import { config } from '../config/env.js';

/**
 * Turn off audit log DB persistence for the current process.
 *
 * The backend test suite has no live DB dependency, but services under test
 * call auditLogger.log() which now fires a fire-and-forget `audit_logs` write.
 * Call this at the top of a test file (before any service calls) so those
 * writes never reach the database.
 */
export function disableAuditPersistence() {
  config.auditLog.persistEnabled = false;
}
