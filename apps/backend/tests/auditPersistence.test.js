import assert from 'node:assert/strict';
import { config } from '../config/env.js';
import {
  persistAuditEntry,
  mapAuditResult,
  buildCanonicalPayload,
  computeEventHash,
  buildAuditLogData,
} from '../utils/auditPersistence.js';
import { auditLogger } from '../utils/auditLogger.js';
import { AUDIT_ACTIONS } from '../constants/auditActions.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { auditEventBlockchainService } from '../services/auditEventBlockchainService.js';

const originalCreate = auditLogRepository.create;
const originalAnchorEvent = auditEventBlockchainService.anchorEvent;
const originalPersistEnabled = config.auditLog.persistEnabled;

function resetMocks() {
  auditLogRepository.create = originalCreate;
  auditEventBlockchainService.anchorEvent = originalAnchorEvent;
  config.auditLog.persistEnabled = originalPersistEnabled;
}

async function runAuditPersistenceTests() {
  console.log('🧪 Starting Audit Persistence Unit Tests...\n');
  let passedTests = 0;
  let totalTests = 0;

  const test = async (name, testFn) => {
    totalTests += 1;
    resetMocks();
    try {
      await testFn();
      passedTests += 1;
      console.log(`   - ${name}: ✅ PASSED`);
    } catch (error) {
      console.log(`   - ${name}: ❌ FAILED — ${error.message}`);
    } finally {
      resetMocks();
    }
  };

  await test('mapAuditResult() maps logger results to Prisma enum values', () => {
    assert.equal(mapAuditResult('SUCCESS'), 'Success');
    assert.equal(mapAuditResult('FAILURE'), 'Failure');
    assert.equal(mapAuditResult('anything-else'), 'Success');
  });

  await test('buildCanonicalPayload() normalizes actor, resource, ip, and details', () => {
    const entry = {
      timestamp: '2026-01-16T09:31:00.000Z',
      action: 'AUTH_LOGIN',
      result: 'FAILURE',
      actor: { id: 'user-1', email: 'bad@example.com', role: 'BudgetOfficer' },
      ip: '192.168.1.100',
      resource: { type: 'User', id: 'user-1' },
      details: { reason: 'Invalid password' },
    };

    const payload = buildCanonicalPayload(entry, 'log-id');

    assert.equal(payload.id, 'log-id');
    assert.equal(payload.timestamp, entry.timestamp);
    assert.equal(payload.action, 'AUTH_LOGIN');
    assert.equal(payload.result, 'Failure');
    assert.deepEqual(payload.actor, {
      id: 'user-1',
      email: 'bad@example.com',
      name: null,
      role: 'BudgetOfficer',
    });
    assert.equal(payload.ip, '192.168.1.100');
    assert.deepEqual(payload.resource, { type: 'User', id: 'user-1', code: null });
    assert.deepEqual(payload.details, { reason: 'Invalid password' });
  });

  await test('buildCanonicalPayload() maps fullName to name and drops UNKNOWN ip and empty details', () => {
    const entry = {
      timestamp: '2026-01-16T09:31:00.000Z',
      action: 'ALLOCATION_CREATE',
      result: 'SUCCESS',
      actor: { id: 'user-2', email: 'a@example.com', role: 'Administrator', fullName: 'Alice' },
      ip: 'UNKNOWN',
      resource: null,
      details: null,
    };

    const payload = buildCanonicalPayload(entry, 'log-id');

    assert.equal(payload.actor.name, 'Alice');
    assert.equal(payload.ip, null);
    assert.deepEqual(payload.resource, { type: null, id: null, code: null });
    assert.equal(payload.details, null);
  });

  await test('computeEventHash() is deterministic for identical payloads', () => {
    const payload = { id: 'log-1', action: 'AUTH_LOGIN', result: 'Success', timestamp: '2026-01-16T09:31:00.000Z' };

    const hash1 = computeEventHash(payload);
    const hash2 = computeEventHash(payload);

    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64, 'SHA-256 hex digest is 64 chars');
    assert.match(hash1, /^[0-9a-f]{64}$/);
  });

  await test('buildAuditLogData() produces Prisma create data with Pending anchor', () => {
    const entry = {
      timestamp: '2026-01-16T09:31:00.000Z',
      action: 'AUTH_LOGIN',
      result: 'SUCCESS',
      actor: { id: 'user-1', email: 'admin@example.com', role: 'Administrator', fullName: 'Admin' },
      ip: '127.0.0.1',
      resource: { type: 'User', id: 'user-1', code: 'U-1' },
      details: { method: 'password' },
    };

    const payload = buildCanonicalPayload(entry, 'log-id');
    payload.eventHash = computeEventHash(payload);
    const data = buildAuditLogData(payload);

    assert.equal(data.id, 'log-id');
    assert.equal(data.action, 'AUTH_LOGIN');
    assert.equal(data.result, 'Success');
    assert.equal(data.actorId, 'user-1');
    assert.equal(data.actorEmail, 'admin@example.com');
    assert.equal(data.actorName, 'Admin');
    assert.equal(data.actorRole, 'Administrator');
    assert.equal(data.ip, '127.0.0.1');
    assert.equal(data.resourceType, 'User');
    assert.equal(data.resourceId, 'user-1');
    assert.equal(data.resourceCode, 'U-1');
    assert.deepEqual(data.details, { method: 'password' });
    assert.equal(data.anchorStatus, 'Pending');
    assert.equal(data.eventHash, payload.eventHash);
    assert.ok(data.createdAt instanceof Date);
    assert.equal(data.createdAt.toISOString(), '2026-01-16T09:31:00.000Z');
  });

  await test('persistAuditEntry() inserts a hashed, mapped row when enabled', async () => {
    let createData = null;
    auditLogRepository.create = async (data) => {
      createData = data;
      return { id: data.id };
    };
    config.auditLog.persistEnabled = true;

    const entry = {
      timestamp: '2026-01-16T09:31:00.000Z',
      action: 'AUTH_LOGIN',
      result: 'FAILURE',
      actor: null,
      ip: 'UNKNOWN',
      resource: null,
      details: null,
    };

    await persistAuditEntry(entry);

    assert.ok(createData, 'auditLogRepository.create should have been called');
    assert.equal(createData.result, 'Failure');
    assert.equal(createData.actorId, null);
    assert.equal(createData.anchorStatus, 'Pending');
    assert.match(createData.eventHash, /^[0-9a-f]{64}$/);
  });

  await test('persistAuditEntry() skips entirely when persistence is disabled', async () => {
    let createCalled = false;
    auditLogRepository.create = async () => {
      createCalled = true;
      return {};
    };
    config.auditLog.persistEnabled = false;

    await persistAuditEntry({ action: 'AUTH_LOGIN', result: 'SUCCESS' });

    assert.equal(createCalled, false, 'create must not be called when disabled');
  });

  await test('persistAuditEntry() never throws even when the repository write fails', async () => {
    auditLogRepository.create = async () => {
      throw new Error('DB connection refused');
    };
    config.auditLog.persistEnabled = true;

    let resolved = false;
    await persistAuditEntry({ action: 'AUTH_LOGIN', result: 'SUCCESS', actor: null, ip: 'UNKNOWN' }).then(
      () => {
        resolved = true;
      }
    );

    assert.equal(resolved, true, 'persistAuditEntry should resolve even on DB failure');
  });

  await test('persistAuditEntry() hands the created row to the anchoring service', async () => {
    let createdRow = null;
    auditLogRepository.create = async (data) => {
      createdRow = { id: 'log-1', ...data };
      return createdRow;
    };
    config.auditLog.persistEnabled = true;

    let anchoredLog = null;
    auditEventBlockchainService.anchorEvent = async (log) => {
      anchoredLog = log;
      return log;
    };

    await persistAuditEntry({ action: 'AUTH_LOGIN', result: 'SUCCESS', actor: null, ip: 'UNKNOWN' });

    assert.ok(createdRow, 'create should have been called');
    assert.ok(anchoredLog, 'anchorEvent should have been called');
    assert.equal(anchoredLog.id, createdRow.id);
    assert.equal(anchoredLog.eventHash, createdRow.eventHash);
    assert.match(anchoredLog.eventHash, /^[0-9a-f]{64}$/);
  });

  await test('persistAuditEntry() never throws when the anchoring service fails', async () => {
    auditLogRepository.create = async (data) => ({ id: 'log-2', ...data });
    config.auditLog.persistEnabled = true;
    auditEventBlockchainService.anchorEvent = async () => {
      throw new Error('RPC down');
    };

    let resolved = false;
    await persistAuditEntry({ action: 'AUTH_LOGIN', result: 'SUCCESS', actor: null, ip: 'UNKNOWN' }).then(
      () => {
        resolved = true;
      }
    );

    assert.equal(resolved, true, 'persistAuditEntry should resolve even when anchoring throws');
  });

  await test('does not persist AUDIT_ANCHOR_RETRY entries (breaks the anchoring feedback loop)', async () => {
    let createCalled = false;
    auditLogRepository.create = async () => {
      createCalled = true;
      return { id: 'loop-row' };
    };
    config.auditLog.persistEnabled = true;
    auditEventBlockchainService.anchorEvent = async () => {
      throw new Error('should never be reached');
    };

    await persistAuditEntry({
      action: AUDIT_ACTIONS.AUDIT_ANCHOR_RETRY,
      result: 'SUCCESS',
      actor: { id: 'system-scheduler' },
      ip: '127.0.0.1',
      resource: { type: 'AuditLog', id: 'log-1' },
      details: { txHash: '0xtx', blockNumber: 9 },
    });

    assert.equal(createCalled, false, 'anchor-retry bookkeeping must never be re-persisted');
  });

  await test('sanitizer regression: persisted details never contain passwords or tokens', async () => {
    let createData = null;
    auditLogRepository.create = async (data) => {
      createData = data;
      return { id: data.id };
    };
    config.auditLog.persistEnabled = true;
    auditEventBlockchainService.anchorEvent = async () => ({});

    // Drive through the real auditLogger.log() path so sanitizeData runs exactly
    // as it does in production, then flush the fire-and-forget persistence.
    auditLogger.log({
      action: 'AUTH_LOGIN',
      result: 'SUCCESS',
      actor: { id: 'u1', email: 'admin@example.com', role: 'Administrator' },
      ip: '127.0.0.1',
      details: {
        email: 'admin@example.com',
        password: 'SuperSecret123!',
        passwordConfirm: 'SuperSecret123!',
        accessToken: 'jwt.access.token',
        nested: { refreshToken: 'jwt.refresh.token', role: 'Administrator' },
      },
    });

    await new Promise((resolve) => setImmediate(resolve));

    assert.ok(createData, 'persistAuditEntry should have written a row');
    assert.equal(createData.details.password, '[REDACTED]');
    assert.equal(createData.details.passwordConfirm, '[REDACTED]');
    assert.equal(createData.details.accessToken, '[REDACTED]');
    assert.equal(createData.details.nested.refreshToken, '[REDACTED]');
    assert.equal(createData.details.email, 'admin@example.com');
    assert.equal(createData.details.nested.role, 'Administrator');
    assert.equal(JSON.stringify(createData.details).includes('SuperSecret'), false);
    assert.equal(JSON.stringify(createData.details).includes('jwt.'), false);
  });

  console.log(`\n✨ Audit Persistence Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAuditPersistenceTests().catch((err) => {
  console.error('❌ Audit Persistence unit test failed:', err);
  process.exit(1);
});
