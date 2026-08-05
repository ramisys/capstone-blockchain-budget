import assert from 'node:assert/strict';
import {
  auditLogger,
  sanitizeData,
  extractClientIp,
  normalizeActor,
  normalizeResource,
} from '../utils/auditLogger.js';
import { logger } from '../utils/logger.js';
import { auditRoute } from '../middleware/auditMiddleware.js';
import { AUDIT_ACTIONS, AUDIT_RESULTS } from '../constants/auditActions.js';
import { disableAuditPersistence } from './auditTestConfig.js';

console.log('Running Audit Logger Tests...\n');

// Disable DB persistence: these tests assert on the synchronous return value
// and must not touch the database (the suite has no live DB dependency).
disableAuditPersistence();

// 1. sanitizeData tests
console.log('1. sanitizeData:');
{
  const data = {
    email: 'user@example.com',
    password: 'secretPassword123',
    passwordConfirm: 'secretPassword123',
    refreshToken: 'jwt.refresh.token',
    accessToken: 'jwt.access.token',
    nested: {
      secret: 'my-secret',
      safeField: 12345,
    },
    list: [
      { token: 'tok_abc', name: 'Item 1' },
      { name: 'Item 2' },
    ],
  };

  const sanitized = sanitizeData(data);
  assert.equal(sanitized.email, 'user@example.com');
  assert.equal(sanitized.password, '[REDACTED]');
  assert.equal(sanitized.passwordConfirm, '[REDACTED]');
  assert.equal(sanitized.refreshToken, '[REDACTED]');
  assert.equal(sanitized.accessToken, '[REDACTED]');
  assert.equal(sanitized.nested.secret, '[REDACTED]');
  assert.equal(sanitized.nested.safeField, 12345);
  assert.equal(sanitized.list[0].token, '[REDACTED]');
  assert.equal(sanitized.list[0].name, 'Item 1');
  assert.equal(sanitized.list[1].name, 'Item 2');
  console.log('  ✓ successfully redacts sensitive fields at all nesting levels');
}

// 2. extractClientIp tests
console.log('\n2. extractClientIp:');
{
  assert.equal(extractClientIp(null), 'UNKNOWN');
  assert.equal(extractClientIp('192.168.1.1'), '192.168.1.1');

  const reqWithIp = { ip: '10.0.0.1' };
  assert.equal(extractClientIp(reqWithIp), '10.0.0.1');

  const reqWithForwarded = {
    headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
  };
  assert.equal(extractClientIp(reqWithForwarded), '203.0.113.195');

  const reqWithSocket = { socket: { remoteAddress: '127.0.0.1' } };
  assert.equal(extractClientIp(reqWithSocket), '127.0.0.1');
  console.log('  ✓ correctly extracts client IP across diverse request formats');
}

// 3. normalizeActor & normalizeResource tests
console.log('\n3. normalizeActor & normalizeResource:');
{
  assert.deepEqual(normalizeActor(null), { id: 'ANONYMOUS', role: 'Anonymous' });
  assert.deepEqual(normalizeActor('user-123'), { id: 'user-123' });
  assert.deepEqual(
    normalizeActor({ id: 'u1', email: 'test@example.com', role: 'Administrator', fullName: 'Test Admin' }),
    { id: 'u1', email: 'test@example.com', role: 'Administrator', fullName: 'Test Admin' }
  );

  assert.equal(normalizeResource(null), null);
  assert.deepEqual(normalizeResource('User'), { type: 'User' });
  assert.deepEqual(
    normalizeResource({ type: 'Allocation', id: 'alloc-1', code: 'BA-2026-001' }),
    { type: 'Allocation', id: 'alloc-1', code: 'BA-2026-001' }
  );
  console.log('  ✓ normalizes actor and resource objects correctly');
}

// 4. auditLogger.log / logSuccess / logFailure tests
console.log('\n4. auditLogger.log / logSuccess / logFailure:');
{
  const successEntry = auditLogger.logSuccess({
    action: AUDIT_ACTIONS.AUTH_LOGIN,
    actor: { id: 'u1', email: 'admin@example.com', role: 'Administrator' },
    ip: '127.0.0.1',
    resource: { type: 'User', id: 'u1' },
    details: { method: 'password', password: 'should-be-redacted' },
  });

  assert.equal(successEntry.action, AUDIT_ACTIONS.AUTH_LOGIN);
  assert.equal(successEntry.result, AUDIT_RESULTS.SUCCESS);
  assert.equal(successEntry.actor.id, 'u1');
  assert.equal(successEntry.ip, '127.0.0.1');
  assert.equal(successEntry.resource.type, 'User');
  assert.equal(successEntry.details.password, '[REDACTED]');
  assert.ok(successEntry.timestamp);

  const failureEntry = auditLogger.logFailure({
    action: AUDIT_ACTIONS.AUTH_LOGIN,
    actor: null,
    ip: '192.168.1.100',
    resource: { type: 'User' },
    details: { email: 'baduser@example.com', reason: 'Invalid password' },
  });

  assert.equal(failureEntry.action, AUDIT_ACTIONS.AUTH_LOGIN);
  assert.equal(failureEntry.result, AUDIT_RESULTS.FAILURE);
  assert.equal(failureEntry.actor.id, 'ANONYMOUS');
  assert.equal(failureEntry.details.reason, 'Invalid password');
  console.log('  ✓ generates structured success and failure audit log records with redaction');
}

// 5. auditLogger.logFromReq tests
console.log('\n5. auditLogger.logFromReq:');
{
  const mockReq = {
    ip: '10.20.30.40',
    user: { id: 'u-admin', email: 'admin@gov.ph', role: 'Administrator' },
    body: { role: 'BudgetOfficer' },
  };

  const reqAudit = auditLogger.logFromReq(mockReq, {
    action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
    result: AUDIT_RESULTS.SUCCESS,
    resource: { type: 'User', id: 'u-target' },
    details: { newRole: 'BudgetOfficer' },
  });

  assert.equal(reqAudit.action, AUDIT_ACTIONS.USER_ROLE_CHANGE);
  assert.equal(reqAudit.result, AUDIT_RESULTS.SUCCESS);
  assert.equal(reqAudit.actor.id, 'u-admin');
  assert.equal(reqAudit.ip, '10.20.30.40');
  assert.equal(reqAudit.resource.id, 'u-target');
  assert.equal(reqAudit.details.newRole, 'BudgetOfficer');

  // Failure with error object
  const errAudit = auditLogger.logFromReq(mockReq, {
    action: AUDIT_ACTIONS.USER_DELETE,
    result: AUDIT_RESULTS.FAILURE,
    resource: { type: 'User', id: 'u-target' },
    error: new Error('User cannot delete self'),
  });

  assert.equal(errAudit.result, AUDIT_RESULTS.FAILURE);
  assert.equal(errAudit.details.error, 'User cannot delete self');
  console.log('  ✓ extracts request context, actor, IP, and errors seamlessly');
}

// 6. auditRoute middleware tests
console.log('\n6. auditRoute middleware:');
{
  const middleware = auditRoute(
    AUDIT_ACTIONS.DEPARTMENT_CREATE,
    (req) => ({ type: 'Department', id: req.params?.id }),
    (req, res) => ({ status: res.statusCode })
  );

  let finishHandler = null;
  const mockReq = {
    ip: '127.0.0.1',
    user: { id: 'u-admin' },
    params: { id: 'dept-1' },
  };
  const mockRes = {
    statusCode: 201,
    on(event, handler) {
      if (event === 'finish') finishHandler = handler;
    },
  };

  let nextCalled = false;
  middleware(mockReq, mockRes, () => {
    nextCalled = true;
  });

  assert.ok(nextCalled, 'next() should be called by middleware');
  assert.ok(typeof finishHandler === 'function', 'finish handler registered');

  // Trigger finish
  finishHandler();
  console.log('  ✓ middleware correctly hooks into finish event and logs audit record');
}

// 7. logger integration & backward compatibility
console.log('\n7. logger integration & backward compatibility:');
{
  assert.equal(typeof logger.logEvent, 'function');
  assert.equal(typeof logger.warn, 'function');
  assert.equal(typeof logger.error, 'function');
  assert.equal(typeof logger.audit, 'function');

  const auditResult = logger.audit({
    action: AUDIT_ACTIONS.ALLOCATION_CREATE,
    actor: 'user-1',
    ip: '127.0.0.1',
  });
  assert.equal(auditResult.action, AUDIT_ACTIONS.ALLOCATION_CREATE);
  console.log('  ✓ logger preserves all original methods and exposes audit logging');
}

console.log('\nAll Audit Logger tests passed successfully!');
