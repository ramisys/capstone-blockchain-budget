import assert from 'node:assert/strict';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import prisma from '../models/prismaClient.js';

const recordData = {
  allocationId: 'alloc-1',
  allocationCode: 'BA-2026-0001',
  contentHash: 'a'.repeat(64),
  txHash: '0xtx1',
  blockNumber: 42,
  network: 'hardhat',
  status: 'Confirmed',
  confirmedAt: new Date('2026-01-16T09:31:00.000Z'),
  createdBy: 'user-1',
};

const originalMethods = {
  transaction: prisma.$transaction,
  updateMany: prisma.blockchainRecord.updateMany,
  create: prisma.blockchainRecord.create,
  findFirst: prisma.blockchainRecord.findFirst,
  findMany: prisma.blockchainRecord.findMany,
  count: prisma.blockchainRecord.count,
  groupBy: prisma.blockchainRecord.groupBy,
};

function resetMocks() {
  prisma.$transaction = originalMethods.transaction;
  prisma.blockchainRecord.updateMany = originalMethods.updateMany;
  prisma.blockchainRecord.create = originalMethods.create;
  prisma.blockchainRecord.findFirst = originalMethods.findFirst;
  prisma.blockchainRecord.findMany = originalMethods.findMany;
  prisma.blockchainRecord.count = originalMethods.count;
  prisma.blockchainRecord.groupBy = originalMethods.groupBy;
}

async function runBlockchainRepositoryTests() {
  console.log('🧪 Starting Blockchain Repository Unit Tests...\n');
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

  await test('createCurrent() supersedes prior records and creates the new one in one transaction', async () => {
    let updateArgs = null;
    let createArgs = null;
    let transactionUsed = false;

    prisma.blockchainRecord.updateMany = async (args) => {
      updateArgs = args;
      return { count: 1 };
    };
    prisma.blockchainRecord.create = async (args) => {
      createArgs = args;
      return { id: 'record-new', ...args.data };
    };
    prisma.$transaction = async (cb) => {
      transactionUsed = true;
      return cb(prisma);
    };

    const result = await blockchainRepository.createCurrent(recordData);

    assert.equal(transactionUsed, true, 'supersede + create must share one transaction');
    assert.equal(updateArgs.where.allocationId, 'alloc-1');
    assert.equal(updateArgs.where.supersededAt, null, 'only live records are superseded');
    assert.ok(updateArgs.data.supersededAt instanceof Date);
    assert.deepEqual(createArgs.data, recordData);
    assert.equal(result.id, 'record-new');
  });

  await test('findByAllocationId() returns only the current (non-superseded) record', async () => {
    let captured = null;
    prisma.blockchainRecord.findFirst = async (args) => {
      captured = args;
      return { id: 'record-current', allocationId: 'alloc-1' };
    };

    const result = await blockchainRepository.findByAllocationId('alloc-1');

    assert.equal(captured.where.allocationId, 'alloc-1');
    assert.equal(captured.where.supersededAt, null);
    assert.deepEqual(captured.orderBy, { createdAt: 'desc' });
    assert.equal(result.id, 'record-current');
  });

  await test('findMany() excludes superseded records by default', async () => {
    let captured = null;
    prisma.blockchainRecord.findMany = async (args) => {
      captured = args;
      return [];
    };

    await blockchainRepository.findMany({ status: 'Confirmed' }, { page: 1, limit: 10 }, {});

    assert.equal(captured.where.supersededAt, null);
    assert.equal(captured.where.status, 'Confirmed');
  });

  await test('count() excludes superseded records by default', async () => {
    let captured = null;
    prisma.blockchainRecord.count = async (args) => {
      captured = args;
      return 4;
    };

    const result = await blockchainRepository.count({ allocationId: 'alloc-1' });

    assert.equal(captured.where.supersededAt, null);
    assert.equal(captured.where.allocationId, 'alloc-1');
    assert.equal(result, 4);
  });

  await test('countByStatus() excludes superseded records so dashboard counts stay live', async () => {
    let captured = null;
    prisma.blockchainRecord.groupBy = async (args) => {
      captured = args;
      return [{ status: 'Confirmed', _count: 3 }];
    };

    const result = await blockchainRepository.countByStatus();

    assert.equal(captured.where.supersededAt, null);
    assert.deepEqual(captured.by, ['status']);
    assert.equal(result[0]._count, 3);
  });

  await test('getLatest() returns the latest non-superseded record', async () => {
    let captured = null;
    prisma.blockchainRecord.findFirst = async (args) => {
      captured = args;
      return { id: 'record-latest' };
    };

    const result = await blockchainRepository.getLatest();

    assert.equal(captured.where.supersededAt, null);
    assert.equal(result.id, 'record-latest');
  });

  console.log(
    `\n✨ Blockchain Repository Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`
  );
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runBlockchainRepositoryTests().catch((err) => {
  console.error('❌ Blockchain Repository unit test failed:', err);
  process.exit(1);
});
