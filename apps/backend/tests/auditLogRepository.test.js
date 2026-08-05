import assert from 'node:assert/strict';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import prisma from '../models/prismaClient.js';

const originalMethods = {
  create: prisma.auditLog.create,
  findUnique: prisma.auditLog.findUnique,
  findMany: prisma.auditLog.findMany,
  count: prisma.auditLog.count,
  groupBy: prisma.auditLog.groupBy,
};

function resetMocks() {
  prisma.auditLog.create = originalMethods.create;
  prisma.auditLog.findUnique = originalMethods.findUnique;
  prisma.auditLog.findMany = originalMethods.findMany;
  prisma.auditLog.count = originalMethods.count;
  prisma.auditLog.groupBy = originalMethods.groupBy;
}

async function runAuditLogRepositoryTests() {
  console.log('🧪 Starting Audit Log Repository Unit Tests...\n');
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

  await test('create() inserts a new audit log row with provided data', async () => {
    let createArgs = null;
    prisma.auditLog.create = async (args) => {
      createArgs = args;
      return { id: 'log-1', ...args.data };
    };

    const data = {
      action: 'AUTH_LOGIN',
      result: 'Success',
      actorId: 'user-1',
      actorEmail: 'admin@example.com',
      ip: '127.0.0.1',
      resourceType: 'User',
      resourceId: 'user-1',
      eventHash: 'a'.repeat(64),
      anchorStatus: 'Pending',
    };

    const result = await auditLogRepository.create(data);

    assert.deepEqual(createArgs.data, data);
    assert.equal(result.id, 'log-1');
  });

  await test('findById() looks up by primary key', async () => {
    let captured = null;
    prisma.auditLog.findUnique = async (args) => {
      captured = args;
      return { id: 'log-1', action: 'AUTH_LOGIN' };
    };

    const result = await auditLogRepository.findById('log-1');

    assert.deepEqual(captured.where, { id: 'log-1' });
    assert.equal(result.action, 'AUTH_LOGIN');
  });

  await test('findByEventHash() looks up by the unique event hash', async () => {
    let captured = null;
    prisma.auditLog.findUnique = async (args) => {
      captured = args;
      return { id: 'log-1', eventHash: 'a'.repeat(64) };
    };

    const hash = 'a'.repeat(64);
    const result = await auditLogRepository.findByEventHash(hash);

    assert.deepEqual(captured.where, { eventHash: hash });
    assert.equal(result.id, 'log-1');
  });

  await test('findMany() builds filters, pagination, and ordering', async () => {
    let captured = null;
    prisma.auditLog.findMany = async (args) => {
      captured = args;
      return [];
    };

    await auditLogRepository.findMany(
      { action: 'AUTH_LOGIN', result: 'Failure', dateFrom: '2026-01-01' },
      { page: 2, limit: 20 },
      { sortBy: 'newest' }
    );

    assert.equal(captured.where.action, 'AUTH_LOGIN');
    assert.equal(captured.where.result, 'Failure');
    assert.ok(captured.where.createdAt.gte instanceof Date);
    assert.equal(captured.skip, 20);
    assert.equal(captured.take, 20);
    assert.deepEqual(captured.orderBy, { createdAt: 'desc' });
  });

  await test('findMany() caps the limit and supports search across fields', async () => {
    let captured = null;
    prisma.auditLog.findMany = async (args) => {
      captured = args;
      return [];
    };

    await auditLogRepository.findMany({ search: 'admin@example.com' }, { limit: 999 }, {});

    assert.equal(captured.take, 100);
    assert.deepEqual(captured.where.OR, [
      { action: { contains: 'admin@example.com' } },
      { actorEmail: { contains: 'admin@example.com' } },
      { resourceCode: { contains: 'admin@example.com' } },
    ]);
  });

  await test('count() reuses the same where clause as findMany()', async () => {
    let captured = null;
    prisma.auditLog.count = async (args) => {
      captured = args;
      return 7;
    };

    const result = await auditLogRepository.count({ anchorStatus: 'Pending' });

    assert.equal(captured.where.anchorStatus, 'Pending');
    assert.equal(result, 7);
  });

  await test('countByAction() groups by action', async () => {
    let captured = null;
    prisma.auditLog.groupBy = async (args) => {
      captured = args;
      return [{ action: 'AUTH_LOGIN', _count: 5 }];
    };

    const result = await auditLogRepository.countByAction();

    assert.deepEqual(captured.by, ['action']);
    assert.equal(result[0]._count, 5);
  });

  await test('countByResult() groups by success/failure', async () => {
    let captured = null;
    prisma.auditLog.groupBy = async (args) => {
      captured = args;
      return [{ result: 'Failure', _count: 2 }];
    };

    const result = await auditLogRepository.countByResult();

    assert.deepEqual(captured.by, ['result']);
    assert.equal(result[0]._count, 2);
  });

  await test('findUnconfirmed() returns pending anchors oldest first', async () => {
    let captured = null;
    prisma.auditLog.findMany = async (args) => {
      captured = args;
      return [{ id: 'log-old', anchorStatus: 'Pending' }];
    };

    const result = await auditLogRepository.findUnconfirmed();

    assert.equal(captured.where.anchorStatus, 'Pending');
    assert.deepEqual(captured.orderBy, { createdAt: 'asc' });
    assert.equal(captured.take, 50);
    assert.equal(result[0].anchorStatus, 'Pending');
  });

  console.log(
    `\n✨ Audit Log Repository Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`
  );
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAuditLogRepositoryTests().catch((err) => {
  console.error('❌ Audit Log Repository unit test failed:', err);
  process.exit(1);
});
