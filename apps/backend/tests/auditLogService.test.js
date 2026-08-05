import assert from 'node:assert/strict';
import { auditLogService } from '../services/auditLogService.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { config } from '../config/env.js';
import { disableAuditPersistence } from './auditTestConfig.js';

disableAuditPersistence();

const originalMethods = {
  findMany: auditLogRepository.findMany,
  count: auditLogRepository.count,
  findById: auditLogRepository.findById,
  countByAction: auditLogRepository.countByAction,
  countByResult: auditLogRepository.countByResult,
};

const originalExplorerUrl = config.blockchain.explorerUrl;

function resetMocks() {
  auditLogRepository.findMany = originalMethods.findMany;
  auditLogRepository.count = originalMethods.count;
  auditLogRepository.findById = originalMethods.findById;
  auditLogRepository.countByAction = originalMethods.countByAction;
  auditLogRepository.countByResult = originalMethods.countByResult;
  config.blockchain.explorerUrl = originalExplorerUrl;
}

function entry(overrides = {}) {
  return {
    id: 'log-1',
    action: 'AUTH_LOGIN',
    result: 'Success',
    actorId: 'user-1',
    actorEmail: 'admin@university.edu',
    actorRole: 'Administrator',
    ip: '127.0.0.1',
    userAgent: 'vitest',
    resourceType: 'User',
    resourceId: 'user-1',
    resourceCode: null,
    details: { foo: 'bar' },
    eventHash: 'a'.repeat(64),
    anchorStatus: 'Confirmed',
    txHash: '0xdeadbeef',
    blockNumber: 42n,
    createdAt: new Date('2026-08-06T08:00:00.000Z'),
    ...overrides,
  };
}

async function runAuditLogServiceTests() {
  console.log('🧪 Starting Audit Log Service Unit Tests...\n');
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

  console.log('1. getLogs Tests:');
  await test('should return logs and pagination, serializing BigInt block numbers', async () => {
    config.blockchain.explorerUrl = 'https://explorer.example';
    auditLogRepository.findMany = async () => [entry(), entry({ id: 'log-2', blockNumber: 7n, txHash: null })];
    auditLogRepository.count = async () => 23;

    const result = await auditLogService.getLogs({}, { page: 2, limit: 2 }, {});

    assert.equal(result.logs.length, 2);
    assert.deepEqual(result.pagination, { total: 23, page: 2, limit: 2, totalPages: 12 });
    assert.equal(result.logs[0].blockNumber, 42);
    assert.equal(typeof result.logs[0].blockNumber, 'number');
    assert.equal(result.logs[0].txExplorerUrl, 'https://explorer.example/tx/0xdeadbeef');
    assert.equal(result.logs[1].txExplorerUrl, null);
  });

  await test('should pass filters, pagination, and ordering to the repository', async () => {
    let captured = null;
    auditLogRepository.findMany = async (filters, pagination, ordering) => {
      captured = { filters, pagination, ordering };
      return [entry()];
    };
    auditLogRepository.count = async () => 1;

    const filters = { search: 'login', action: 'AUTH_LOGIN', result: 'Success', actorId: 'user-1', dateFrom: '2026-08-01' };
    await auditLogService.getLogs(filters, { page: 1, limit: 10 }, { sortBy: 'newest' });

    assert.deepEqual(captured.filters, filters);
    assert.deepEqual(captured.pagination, { page: 1, limit: 10 });
    assert.deepEqual(captured.ordering, { sortBy: 'newest' });
  });

  await test('should return an empty page with zero pagination when no logs exist', async () => {
    auditLogRepository.findMany = async () => [];
    auditLogRepository.count = async () => 0;

    const result = await auditLogService.getLogs({}, {}, {});

    assert.deepEqual(result.logs, []);
    assert.deepEqual(result.pagination, { total: 0, page: 1, limit: 10, totalPages: 0 });
  });

  console.log('\n2. getLogById Tests:');
  await test('should return a serialized entry when it exists', async () => {
    config.blockchain.explorerUrl = 'https://explorer.example';
    auditLogRepository.findById = async () => entry({ blockNumber: 100n });

    const result = await auditLogService.getLogById('log-1');

    assert.equal(result.id, 'log-1');
    assert.equal(result.blockNumber, 100);
    assert.equal(result.txExplorerUrl, 'https://explorer.example/tx/0xdeadbeef');
  });

  await test('should throw 404 when the entry does not exist', async () => {
    auditLogRepository.findById = async () => null;

    await assert.rejects(
      () => auditLogService.getLogById('missing'),
      (err) => err.statusCode === 404 && err.message.includes('not found')
    );
  });

  console.log('\n3. getSummary Tests:');
  await test('should aggregate counts by action and result with pending anchors', async () => {
    auditLogRepository.countByAction = async () => [
      { action: 'ALLOCATION_CREATE', _count: 5 },
      { action: 'AUTH_LOGIN', _count: 3 },
    ];
    auditLogRepository.countByResult = async () => [
      { result: 'Success', _count: 7 },
      { result: 'Failure', _count: 1 },
    ];
    auditLogRepository.count = async () => 4;

    const result = await auditLogService.getSummary();

    assert.equal(result.total, 8);
    assert.equal(result.successCount, 7);
    assert.equal(result.failureCount, 1);
    assert.equal(result.pendingAnchors, 4);
    assert.deepEqual(result.byAction, [
      { action: 'ALLOCATION_CREATE', count: 5 },
      { action: 'AUTH_LOGIN', count: 3 },
    ]);
  });

  await test('should return zeroes when there are no logs', async () => {
    auditLogRepository.countByAction = async () => [];
    auditLogRepository.countByResult = async () => [];
    auditLogRepository.count = async () => 0;

    const result = await auditLogService.getSummary();

    assert.equal(result.total, 0);
    assert.equal(result.successCount, 0);
    assert.equal(result.failureCount, 0);
    assert.equal(result.pendingAnchors, 0);
    assert.deepEqual(result.byAction, []);
  });

  console.log('\n4. getTxExplorerUrl Tests:');
  await test('should return null when no explorer is configured', async () => {
    config.blockchain.explorerUrl = null;

    const result = await auditLogService.getTxExplorerUrl('0xabc');

    assert.equal(result, null);
  });

  await test('should return null when the tx hash is missing', async () => {
    const result = await auditLogService.getTxExplorerUrl(null);

    assert.equal(result, null);
  });

  await test('should strip trailing slashes from the explorer base URL', async () => {
    config.blockchain.explorerUrl = 'https://explorer.example/';

    const result = await auditLogService.getTxExplorerUrl('0xabc');

    assert.equal(result, 'https://explorer.example/tx/0xabc');
  });

  console.log(`\n✨ Audit Log Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAuditLogServiceTests().catch((err) => {
  console.error('❌ Audit Log Service unit test failed:', err);
  process.exit(1);
});
