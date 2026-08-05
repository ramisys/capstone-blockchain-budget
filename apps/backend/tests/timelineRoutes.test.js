import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import dashboardRoutes from '../routes/dashboardRoutes.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { userRepository } from '../repositories/userRepository.js';
import { timelineService } from '../services/timelineService.js';
import { signToken } from '../utils/jwt.js';
import { USER_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { disableAuditPersistence } from './auditTestConfig.js';

disableAuditPersistence();

const originalFindById = userRepository.findById;
const originalGetTimeline = timelineService.getTimeline;

let timelineCalls = 0;

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
  timelineCalls = 0;
  userRepository.findById = originalFindById;
  timelineService.getTimeline = originalGetTimeline;
}

function stubTimeline() {
  timelineService.getTimeline = async (filters, pagination) => {
    timelineCalls++;
    return {
      timeline: [],
      pagination: {
        total: 0,
        page: parseInt(pagination.page) || 1,
        limit: parseInt(pagination.limit) || 20,
        totalPages: 0,
      },
    };
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/dashboard', dashboardRoutes);
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

async function runTimelineRouteTests() {
  console.log('🧪 Starting Timeline Route / RBAC Unit Tests...\n');
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
      const res = await request('/api/dashboard/timeline');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Authentication token is required');
    });

    await test('should reject an invalid kind filter with 400 and never reach the service', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubTimeline();

      const res = await request('/api/dashboard/timeline?kind=Expense', {
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(timelineCalls, 0, 'getTimeline should never be invoked on invalid input');
    });

    await test('should reject a malformed limit with 400', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubTimeline();

      const res = await request('/api/dashboard/timeline?limit=0', {
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(timelineCalls, 0);
    });

    console.log('\n2. Authorized Happy-Path Tests:');
    await test('should return the timeline for an Administrator', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubTimeline();

      const res = await request('/api/dashboard/timeline', {
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(timelineCalls, 1);
      assert.deepEqual(res.body.data.pagination, { total: 0, page: 1, limit: 20, totalPages: 0 });
    });

    await test('should allow an Auditor to read the timeline', async () => {
      userRepository.findById = async () => makeUser(ROLES.AUDITOR);
      stubTimeline();

      const res = await request('/api/dashboard/timeline', {
        token: tokenFor(ROLES.AUDITOR),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(timelineCalls, 1);
    });

    await test('should allow a Budget Officer to filter by kind', async () => {
      userRepository.findById = async () => makeUser(ROLES.BUDGET_OFFICER);
      stubTimeline();

      const res = await request('/api/dashboard/timeline?kind=AuditLog&page=2&limit=5', {
        token: tokenFor(ROLES.BUDGET_OFFICER),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(timelineCalls, 1);
      assert.deepEqual(res.body.data.pagination, { total: 0, page: 2, limit: 5, totalPages: 0 });
    });
  } finally {
    await stopServer();
  }

  console.log(`\n✨ Timeline Route / RBAC Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTimelineRouteTests().catch((err) => {
  console.error('❌ Timeline Route unit test failed:', err);
  process.exit(1);
});
