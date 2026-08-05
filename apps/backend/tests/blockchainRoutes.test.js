import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import blockchainRoutes from '../routes/blockchainRoutes.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { userRepository } from '../repositories/userRepository.js';
import { blockchainService } from '../services/blockchainService.js';
import { signToken } from '../utils/jwt.js';
import { USER_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { BLOCKCHAIN_RECORD_STATUS } from '../constants/blockchainStatus.js';
import { disableAuditPersistence } from './auditTestConfig.js';

disableAuditPersistence();

const VALID_UUID = '00000000-0000-4000-8000-000000000000';

const originalFindById = userRepository.findById;
const originalServiceMethods = {
  getBlockchainStatus: blockchainService.getBlockchainStatus,
  getTransactionHistory: blockchainService.getTransactionHistory,
  verifyAllocation: blockchainService.verifyAllocation,
  retryRecord: blockchainService.retryRecord,
};

let statusCalls = 0;
let historyCalls = 0;
let verifyCalls = 0;
let retryCalls = 0;

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
  statusCalls = 0;
  historyCalls = 0;
  verifyCalls = 0;
  retryCalls = 0;
  userRepository.findById = originalFindById;
  blockchainService.getBlockchainStatus = originalServiceMethods.getBlockchainStatus;
  blockchainService.getTransactionHistory = originalServiceMethods.getTransactionHistory;
  blockchainService.verifyAllocation = originalServiceMethods.verifyAllocation;
  blockchainService.retryRecord = originalServiceMethods.retryRecord;
}

function stubService() {
  blockchainService.getBlockchainStatus = async () => {
    statusCalls++;
    return {
      connected: true,
      network: 'hardhat',
      chainId: 31337,
      latestBlock: 42,
      lastSync: '2026-08-04T08:00:00.000Z',
      contractAddress: '0xabc',
      message: 'Blockchain ledger is connected.',
      recordCount: 3,
      confirmedCount: 2,
      pendingCount: 1,
      failedCount: 0,
    };
  };
  blockchainService.getTransactionHistory = async () => {
    historyCalls++;
    return { transactions: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  };
  blockchainService.verifyAllocation = async (id) => {
    verifyCalls++;
    return { verified: true, integrityOk: true, onChain: null, record: null, message: `Verified allocation ${id}` };
  };
  blockchainService.retryRecord = async (id, actor) => {
    retryCalls++;
    return {
      id: 'rec-1',
      allocationId: id,
      allocationCode: 'ALC-2026-0001',
      contentHash: '0xab',
      txHash: '0xdeadbeef',
      blockNumber: 42,
      network: 'hardhat',
      status: BLOCKCHAIN_RECORD_STATUS.CONFIRMED,
      confirmedAt: new Date(),
      createdBy: actor?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/blockchain', blockchainRoutes);
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

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

async function runBlockchainRouteTests() {
  console.log('🧪 Starting Blockchain Route / RBAC Unit Tests...\n');
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
      const res = await request('/api/blockchain/status');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Authentication token is required');
    });

    await test('should reject an Auditor retry with 403 and never reach the service', async () => {
      userRepository.findById = async () => makeUser(ROLES.AUDITOR);
      stubService();

      const res = await request(`/api/blockchain/allocations/${VALID_UUID}/retry`, {
        method: 'POST',
        token: tokenFor(ROLES.AUDITOR),
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.equal(retryCalls, 0, 'retryRecord should never be invoked for an Auditor');
    });

    await test('should reject a malformed query with 400 and never reach the service', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/blockchain/transactions?limit=0', {
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.errors.length, 1);
      assert.equal(historyCalls, 0, 'getTransactionHistory should never be invoked on invalid input');
    });

    await test('should reject an invalid allocation id param with 400', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/blockchain/allocations/not-a-uuid/verify', {
        method: 'POST',
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(verifyCalls, 0);
    });

    console.log('\n2. Authorized Happy-Path Tests:');
    await test('should return ledger status for an Administrator', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/blockchain/status', {
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(statusCalls, 1);
      assert.equal(res.body.data.blockchainStatus.connected, true);
    });

    await test('should allow a Treasurer to re-anchor a record', async () => {
      userRepository.findById = async () => makeUser(ROLES.TREASURER);
      stubService();

      const res = await request(`/api/blockchain/allocations/${VALID_UUID}/retry`, {
        method: 'POST',
        token: tokenFor(ROLES.TREASURER),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(retryCalls, 1);
      assert.equal(res.body.data.record.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    });
  } finally {
    await stopServer();
  }

  console.log(`\n✨ Blockchain Route / RBAC Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runBlockchainRouteTests().catch((err) => {
  console.error('❌ Blockchain Route unit test failed:', err);
  process.exit(1);
});
