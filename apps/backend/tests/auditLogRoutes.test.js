import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import auditLogRoutes from '../routes/auditLogRoutes.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { userRepository } from '../repositories/userRepository.js';
import { auditLogService } from '../services/auditLogService.js';
import { signToken } from '../utils/jwt.js';
import { USER_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { disableAuditPersistence } from './auditTestConfig.js';

disableAuditPersistence();

const VALID_UUID = '00000000-0000-4000-8000-000000000000';

const originalFindById = userRepository.findById;
const originalServiceMethods = {
  getLogs: auditLogService.getLogs,
  getLogById: auditLogService.getLogById,
  getSummary: auditLogService.getSummary,
  retryAnchor: auditLogService.retryAnchor,
};

let logsCalls = 0;
let summaryCalls = 0;
let logByIdCalls = 0;
let retryAnchorCalls = 0;

function makeUser(role) {
  return {
    id: `user-${role}`,
    email: `${role}@university.edu`,
    fullName: `${role} User`,
    role,
    status: USER_STATUS.ACTIVE,
  };
}

function tokenFor(role) {
  return signToken(makeUser(role));
}

function resetMocks() {
  logsCalls = 0;
  summaryCalls = 0;
  logByIdCalls = 0;
  retryAnchorCalls = 0;
  userRepository.findById = originalFindById;
  auditLogService.getLogs = originalServiceMethods.getLogs;
  auditLogService.getLogById = originalServiceMethods.getLogById;
  auditLogService.getSummary = originalServiceMethods.getSummary;
  auditLogService.retryAnchor = originalServiceMethods.retryAnchor;
}

function stubService() {
  auditLogService.getLogs = async () => {
    logsCalls++;
    return {
      logs: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  };
  auditLogService.getSummary = async () => {
    summaryCalls++;
    return {
      total: 0,
      successCount: 0,
      failureCount: 0,
      pendingAnchors: 0,
      byAction: [],
    };
  };
  auditLogService.getLogById = async (id) => {
    logByIdCalls++;
    return {
      id,
      action: 'AUTH_LOGIN',
      result: 'Success',
      actorId: 'user-1',
      actorEmail: 'admin@university.edu',
      actorRole: 'Administrator',
      ip: '127.0.0.1',
      userAgent: null,
      resourceType: 'User',
      resourceId: 'user-1',
      resourceCode: null,
      details: {},
      eventHash: 'a'.repeat(64),
      anchorStatus: 'Pending',
      txHash: null,
      blockNumber: null,
      txExplorerUrl: null,
      createdAt: '2026-08-06T08:00:00.000Z',
    };
  };
  auditLogService.retryAnchor = async (id) => {
    retryAnchorCalls++;
    return {
      id,
      action: 'AUTH_LOGIN',
      result: 'Success',
      eventHash: 'a'.repeat(64),
      anchorStatus: 'Confirmed',
      txHash: '0xretry',
      blockNumber: 42,
      txExplorerUrl: 'https://explorer.example/tx/0xretry',
      createdAt: '2026-08-06T08:00:00.000Z',
    };
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/audit-logs', auditLogRoutes);
  app.use(errorHandler);
  return app;
}

let server;
let baseUrl;

async function startServer() {
  const app = buildApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

async function stopServer() {
  await new Promise((resolve) => server.close(resolve));
}

async function request(path, { method = 'GET', token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, { method, headers });
  return { status: res.status, body: await res.json() };
}

async function runAuditLogRouteTests() {
  console.log('🧪 Starting Audit Log Route / RBAC Unit Tests...\n');
  let passedTests = 0;
  let totalTests = 0;

  const test = async (name, testFn) => {
    totalTests++;
    resetMocks();
    try {
      await testFn();
      console.log(`   - ${name}: ✅ PASSED`);
      passedTests++;
    } catch (err) {
      console.error(`   - ${name}: ❌ FAILED`);
      console.error(`     ${err.stack || err}`);
    } finally {
      resetMocks();
    }
  };

  await startServer();

  try {
    console.log('1. Authentication / RBAC Tests:');
    await test('should reject an unauthenticated request with 401', async () => {
      const res = await request('/api/audit-logs');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Authentication token is required');
    });

    await test('should reject a malformed query with 400 and never reach the service', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/audit-logs?limit=0&page=0', {
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(logsCalls, 0, 'getLogs should never be invoked on invalid input');
    });

    await test('should reject an invalid result filter with 400', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/audit-logs?result=Pass', {
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(logsCalls, 0);
    });

    await test('should reject an invalid audit log id param with 400', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/audit-logs/not-a-uuid', {
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(logByIdCalls, 0);
    });

    console.log('\n2. Authorized Happy-Path Tests:');
    await test('should return audit logs for an Administrator', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/audit-logs', {
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(logsCalls, 1);
      assert.equal(res.body.data.logs.length, 0);
    });

    await test('should allow an Auditor to read audit logs', async () => {
      userRepository.findById = async () => makeUser(ROLES.AUDITOR);
      stubService();

      const res = await request('/api/audit-logs', {
        token: tokenFor(ROLES.AUDITOR),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(logsCalls, 1);
    });

    await test('should route /summary to the summary handler, not the :id handler', async () => {
      userRepository.findById = async () => makeUser(ROLES.TREASURER);
      stubService();

      const res = await request('/api/audit-logs/summary', {
        token: tokenFor(ROLES.TREASURER),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(summaryCalls, 1);
      assert.equal(logByIdCalls, 0);
    });

    await test('should return a single audit log by id for a Budget Officer', async () => {
      userRepository.findById = async () => makeUser(ROLES.BUDGET_OFFICER);
      stubService();

      const res = await request(`/api/audit-logs/${VALID_UUID}`, {
        token: tokenFor(ROLES.BUDGET_OFFICER),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(logByIdCalls, 1);
      assert.equal(res.body.data.log.id, VALID_UUID);
    });

    console.log('\n3. Retry Anchor / RBAC Tests:');
    await test('should reject an Auditor retry with 403', async () => {
      userRepository.findById = async () => makeUser(ROLES.AUDITOR);
      stubService();

      const res = await request(`/api/audit-logs/${VALID_UUID}/retry`, {
        method: 'POST',
        token: tokenFor(ROLES.AUDITOR),
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(retryAnchorCalls, 0, 'retryAnchor must not be invoked for an Auditor');
    });

    await test('should reject an invalid id for retry with 400', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/audit-logs/not-a-uuid/retry', {
        method: 'POST',
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(retryAnchorCalls, 0, 'retryAnchor must not be invoked on invalid input');
    });

    await test('should allow an Administrator to retry an anchor', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request(`/api/audit-logs/${VALID_UUID}/retry`, {
        method: 'POST',
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(retryAnchorCalls, 1);
      assert.equal(res.body.data.log.anchorStatus, 'Confirmed');
    });

    await test('should allow a Treasurer to retry an anchor', async () => {
      userRepository.findById = async () => makeUser(ROLES.TREASURER);
      stubService();

      const res = await request(`/api/audit-logs/${VALID_UUID}/retry`, {
        method: 'POST',
        token: tokenFor(ROLES.TREASURER),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(retryAnchorCalls, 1);
    });
  } finally {
    await stopServer();
  }

  console.log(`\n✨ Audit Log Route / RBAC Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAuditLogRouteTests().catch((err) => {
  console.error('❌ Audit Log Route unit test failed:', err);
  process.exit(1);
});
