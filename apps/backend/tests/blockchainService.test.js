import assert from 'node:assert/strict';
import { blockchainService } from '../services/blockchainService.js';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { allocationRepository } from '../repositories/allocationRepository.js';
import { blockchainProvider } from '../config/blockchain.js';
import { config } from '../config/env.js';
import { BLOCKCHAIN_RECORD_STATUS } from '../constants/blockchainStatus.js';
import { computeAllocationContentHash } from '../utils/hashUtils.js';

const SAMPLE_ALLOCATION = {
  id: 'alloc-1',
  allocationCode: 'BA-2026-0001',
  fiscalYearId: 'fy-1',
  departmentId: 'dept-1',
  fundSourceId: 'fs-1',
  categoryId: 'cat-1',
  programId: 'prog-1',
  allocatedAmount: 50000,
  description: 'Research equipment',
  status: 'Approved',
  submittedAt: new Date('2026-01-15T08:00:00.000Z'),
  reviewedBy: 'user-2',
  reviewedAt: new Date('2026-01-16T09:30:00.000Z'),
  rejectionReason: null,
  createdAt: new Date('2026-01-14T10:00:00.000Z'),
};

const originalMethods = {
  repoCreateCurrent: blockchainRepository.createCurrent,
  repoFindByHash: blockchainRepository.findByContentHash,
  repoFindByAllocation: blockchainRepository.findByAllocationId,
  repoFindMany: blockchainRepository.findMany,
  repoCount: blockchainRepository.count,
  repoCountByStatus: blockchainRepository.countByStatus,
  repoGetLatest: blockchainRepository.getLatest,
  repoUpdate: blockchainRepository.update,
  allocFindById: allocationRepository.findById,
  providerIsConfigured: blockchainProvider.isConfigured,
  providerRecord: blockchainProvider.record,
  providerVerify: blockchainProvider.verify,
  providerGetStatus: blockchainProvider.getStatus,
  providerHasSigner: blockchainProvider.hasSigner,
  network: config.blockchain.network,
};

function resetMocks() {
  blockchainRepository.createCurrent = originalMethods.repoCreateCurrent;
  blockchainRepository.findByContentHash = originalMethods.repoFindByHash;
  blockchainRepository.findByAllocationId = originalMethods.repoFindByAllocation;
  blockchainRepository.findMany = originalMethods.repoFindMany;
  blockchainRepository.count = originalMethods.repoCount;
  blockchainRepository.countByStatus = originalMethods.repoCountByStatus;
  blockchainRepository.getLatest = originalMethods.repoGetLatest;
  blockchainRepository.update = originalMethods.repoUpdate;
  allocationRepository.findById = originalMethods.allocFindById;
  blockchainProvider.isConfigured = originalMethods.providerIsConfigured;
  blockchainProvider.record = originalMethods.providerRecord;
  blockchainProvider.verify = originalMethods.providerVerify;
  blockchainProvider.getStatus = originalMethods.providerGetStatus;
  blockchainProvider.hasSigner = originalMethods.providerHasSigner;
  config.blockchain.network = originalMethods.network;
}

function record(overrides = {}) {
  return {
    id: 'record-1',
    allocationId: 'alloc-1',
    allocationCode: 'BA-2026-0001',
    contentHash: computeAllocationContentHash(SAMPLE_ALLOCATION),
    txHash: '0xtx1',
    blockNumber: 42,
    network: 'hardhat',
    status: BLOCKCHAIN_RECORD_STATUS.CONFIRMED,
    confirmedAt: new Date('2026-01-16T09:31:00.000Z'),
    supersededAt: null,
    createdBy: 'user-1',
    createdAt: new Date('2026-01-16T09:31:00.000Z'),
    updatedAt: new Date('2026-01-16T09:31:00.000Z'),
    ...overrides,
  };
}

async function runBlockchainServiceTests() {
  console.log('🧪 Starting Blockchain Service Unit Tests...\n');
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

  console.log('1. recordAllocation Tests:');
  await test('should reuse an existing record when the content hash is already anchored', async () => {
    const existing = record();
    blockchainRepository.findByContentHash = async () => existing;

    const result = await blockchainService.recordAllocation(SAMPLE_ALLOCATION, 'user-1');

    assert.equal(result.id, 'record-1');
    assert.equal(result.blockNumber, 42);
    assert.equal(result.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
  });

  await test('should record on-chain and persist a Confirmed record', async () => {
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.hasSigner = () => true;
    blockchainProvider.verify = async () => ({ exists: false, anchoredBy: '', anchoredAt: 0, blockNumber: 0 });
    blockchainProvider.record = async () => ({ txHash: '0xtx9', blockNumber: 100 });
    blockchainRepository.findByContentHash = async () => null;
    let created;
    blockchainRepository.createCurrent = async (data) => {
      created = data;
      return record({ ...data, id: 'record-new' });
    };

    const result = await blockchainService.recordAllocation(SAMPLE_ALLOCATION, 'user-1');

    assert.equal(created.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    assert.equal(created.txHash, '0xtx9');
    assert.equal(created.blockNumber, 100);
    assert.equal(created.network, config.blockchain.network);
    assert.equal(created.createdBy, 'user-1');
    assert.equal(created.contentHash, computeAllocationContentHash(SAMPLE_ALLOCATION));
    assert.ok(created.confirmedAt instanceof Date);
    assert.equal(result.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
  });

  await test('should persist a Pending record when the ledger is not configured', async () => {
    blockchainProvider.isConfigured = () => false;
    blockchainRepository.findByContentHash = async () => null;
    let created;
    blockchainRepository.createCurrent = async (data) => {
      created = data;
      return record({ ...data, id: 'record-pending' });
    };

    await blockchainService.recordAllocation(SAMPLE_ALLOCATION, 'user-1');

    assert.equal(created.status, BLOCKCHAIN_RECORD_STATUS.PENDING);
    assert.equal(created.txHash, null);
    assert.equal(created.blockNumber, null);
    assert.equal(created.confirmedAt, null);
  });

  await test('should fail soft and persist a Failed record when the node rejects the write', async () => {
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.hasSigner = () => true;
    blockchainProvider.verify = async () => ({ exists: false, anchoredBy: '', anchoredAt: 0, blockNumber: 0 });
    blockchainProvider.record = async () => {
      throw new Error('node unreachable');
    };
    blockchainRepository.findByContentHash = async () => null;
    let created;
    blockchainRepository.createCurrent = async (data) => {
      created = data;
      return record({ ...data, id: 'record-failed' });
    };

    await blockchainService.recordAllocation(SAMPLE_ALLOCATION, 'user-1');

    assert.equal(created.status, BLOCKCHAIN_RECORD_STATUS.FAILED);
    assert.equal(created.txHash, null);
  });

  await test('should fail soft and return null when the database mirror cannot be persisted', async () => {
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.hasSigner = () => true;
    blockchainProvider.verify = async () => ({ exists: false, anchoredBy: '', anchoredAt: 0, blockNumber: 0 });
    blockchainProvider.record = async () => ({ txHash: '0xtx9', blockNumber: 100 });
    blockchainRepository.findByContentHash = async () => null;
    blockchainRepository.createCurrent = async () => {
      throw new Error('db unavailable');
    };

    const result = await blockchainService.recordAllocation(SAMPLE_ALLOCATION, 'user-1');

    assert.equal(result, null, 'recordAllocation should resolve null instead of throwing');
  });

  await test('should mark Confirmed from on-chain verification when the hash is already anchored', async () => {
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.hasSigner = () => true;
    blockchainProvider.verify = async () => ({
      exists: true,
      anchoredBy: '0xowner',
      anchoredAt: 1700000000,
      blockNumber: 88,
    });
    let recordCalled = false;
    blockchainProvider.record = async () => {
      recordCalled = true;
      return { txHash: '0xtx', blockNumber: 1 };
    };
    blockchainRepository.findByContentHash = async () => null;
    let created;
    blockchainRepository.createCurrent = async (data) => {
      created = data;
      return record({ ...data, id: 'record-recovered' });
    };

    const result = await blockchainService.recordAllocation(SAMPLE_ALLOCATION, 'user-1');

    assert.equal(recordCalled, false);
    assert.equal(created.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    assert.equal(created.blockNumber, 88);
    assert.equal(created.txHash, null);
    assert.equal(created.confirmedAt.toISOString(), new Date(1700000000 * 1000).toISOString());
    assert.equal(result.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    assert.equal(result.blockNumber, 88);
  });

  await test('should supersede the previous live record when a new state is anchored', async () => {
    blockchainProvider.isConfigured = () => false;
    blockchainRepository.findByContentHash = async () => null;
    const previous = record({ id: 'record-h1', txHash: '0xh1', blockNumber: 10 });
    let superseded = null;
    blockchainRepository.createCurrent = async (data) => {
      superseded = previous;
      previous.supersededAt = new Date();
      return record({
        ...data,
        id: 'record-h2',
        status: BLOCKCHAIN_RECORD_STATUS.PENDING,
        txHash: null,
        blockNumber: null,
        confirmedAt: null,
      });
    };

    const result = await blockchainService.recordAllocation(SAMPLE_ALLOCATION, 'user-1');

    assert.equal(result.id, 'record-h2');
    assert.equal(result.status, BLOCKCHAIN_RECORD_STATUS.PENDING);
    assert.ok(superseded.supersededAt instanceof Date, 'previous record should be superseded');
  });

  console.log('\n2. verifyAllocation Tests:');
  await test('should throw 404 when the allocation does not exist', async () => {
    allocationRepository.findById = async () => null;

    await assert.rejects(
      () => blockchainService.verifyAllocation('missing', 'user-1'),
      (err) => err.statusCode === 404
    );
  });

  await test('should throw 404 when the allocation is soft-deleted', async () => {
    allocationRepository.findById = async () => ({
      ...SAMPLE_ALLOCATION,
      deletedAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    await assert.rejects(
      () => blockchainService.verifyAllocation('alloc-1', 'user-1'),
      (err) => err.statusCode === 404
    );
  });

  await test('should report unverified when no record exists', async () => {
    allocationRepository.findById = async () => SAMPLE_ALLOCATION;
    blockchainRepository.findByAllocationId = async () => null;

    const result = await blockchainService.verifyAllocation('alloc-1', 'user-1');

    assert.equal(result.verified, false);
    assert.equal(result.record, null);
    assert.ok(result.message.includes('No blockchain record'));
  });

  await test('should detect tampering when the recomputed hash differs', async () => {
    allocationRepository.findById = async () => ({
      ...SAMPLE_ALLOCATION,
      allocatedAmount: 99999,
    });
    blockchainRepository.findByAllocationId = async () => record();
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => ({
      exists: true,
      anchoredBy: '0xowner',
      anchoredAt: 1700000000,
      blockNumber: 42,
    });

    const result = await blockchainService.verifyAllocation('alloc-1', 'user-1');

    assert.equal(result.integrityOk, false);
    assert.equal(result.verified, false);
    assert.ok(result.message.includes('tampering'));
  });

  await test('should verify successfully when hashes match and the hash is on-chain', async () => {
    allocationRepository.findById = async () => SAMPLE_ALLOCATION;
    blockchainRepository.findByAllocationId = async () => record();
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => ({
      exists: true,
      anchoredBy: '0xowner',
      anchoredAt: 1700000000,
      blockNumber: 42,
    });

    const result = await blockchainService.verifyAllocation('alloc-1', 'user-1');

    assert.equal(result.integrityOk, true);
    assert.equal(result.onChain.exists, true);
    assert.equal(result.verified, true);
    assert.equal(result.record.blockNumber, 42);
  });

  await test('should report inconclusive when the node is unreachable', async () => {
    allocationRepository.findById = async () => SAMPLE_ALLOCATION;
    blockchainRepository.findByAllocationId = async () => record();
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => {
      throw new Error('node down');
    };

    const result = await blockchainService.verifyAllocation('alloc-1', 'user-1');

    assert.equal(result.integrityOk, true);
    assert.equal(result.onChain, null);
    assert.equal(result.verified, false);
    assert.equal(result.inconclusive, true);
    assert.ok(result.message.includes('inconclusive'));
    assert.ok(!result.message.includes('not been anchored'));
  });

  await test('should report not anchored when the hash is absent on-chain', async () => {
    allocationRepository.findById = async () => SAMPLE_ALLOCATION;
    blockchainRepository.findByAllocationId = async () => record();
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => ({
      exists: false,
      anchoredBy: '',
      anchoredAt: 0,
      blockNumber: 0,
    });

    const result = await blockchainService.verifyAllocation('alloc-1', 'user-1');

    assert.equal(result.integrityOk, true);
    assert.equal(result.onChain.exists, false);
    assert.equal(result.verified, false);
    assert.equal(result.inconclusive, false);
    assert.ok(result.message.includes('not been anchored'));
  });

  console.log('\n3. getTransactionHistory Tests:');
  await test('should return transactions with pagination', async () => {
    blockchainRepository.findMany = async () => [record(), record({ id: 'record-2' })];
    blockchainRepository.count = async () => 12;

    const result = await blockchainService.getTransactionHistory({}, { page: 2, limit: 2 }, {});

    assert.equal(result.transactions.length, 2);
    assert.deepEqual(result.pagination, { total: 12, page: 2, limit: 2, totalPages: 6 });
    assert.equal(result.transactions[0].blockNumber, 42);
  });

  console.log('\n4. getBlockchainStatus Tests:');
  await test('should merge provider status with record counts and last sync', async () => {
    blockchainProvider.getStatus = async () => ({
      connected: true,
      network: 'hardhat',
      chainId: 31337,
      latestBlock: 200,
      lastSync: null,
      contractAddress: '0xabc',
      message: 'Blockchain ledger is connected.',
    });
    blockchainRepository.countByStatus = async () => [
      { status: BLOCKCHAIN_RECORD_STATUS.CONFIRMED, _count: 5 },
      { status: BLOCKCHAIN_RECORD_STATUS.PENDING, _count: 2 },
      { status: BLOCKCHAIN_RECORD_STATUS.FAILED, _count: 1 },
    ];
    blockchainRepository.getLatest = async () => ({
      createdAt: new Date('2026-01-16T09:31:00.000Z'),
    });

    const result = await blockchainService.getBlockchainStatus();

    assert.equal(result.connected, true);
    assert.equal(result.recordCount, 8);
    assert.equal(result.confirmedCount, 5);
    assert.equal(result.pendingCount, 2);
    assert.equal(result.failedCount, 1);
    assert.equal(result.lastSync, '2026-01-16T09:31:00.000Z');
  });

  console.log('\n5. retryRecord Tests:');
  await test('should throw 404 when the allocation does not exist', async () => {
    allocationRepository.findById = async () => null;

    await assert.rejects(
      () => blockchainService.retryRecord('missing', { id: 'user-1', role: 'Administrator' }),
      (err) => err.statusCode === 404
    );
  });

  await test('should throw 404 when the allocation is soft-deleted', async () => {
    allocationRepository.findById = async () => ({
      ...SAMPLE_ALLOCATION,
      deletedAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    await assert.rejects(
      () => blockchainService.retryRecord('alloc-1', { id: 'user-1', role: 'Administrator' }),
      (err) => err.statusCode === 404
    );
  });

  await test('should return an already-confirmed record without re-anchoring', async () => {
    allocationRepository.findById = async () => SAMPLE_ALLOCATION;
    blockchainRepository.findByAllocationId = async () => record();
    let providerCalled = false;
    blockchainProvider.record = async () => {
      providerCalled = true;
      return { txHash: '0x', blockNumber: 1 };
    };

    const result = await blockchainService.retryRecord('alloc-1', { id: 'user-2', role: 'Administrator' });

    assert.equal(result.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    assert.equal(providerCalled, false);
  });

  await test('should re-anchor a Pending record and mark it Confirmed', async () => {
    allocationRepository.findById = async () => SAMPLE_ALLOCATION;
    blockchainRepository.findByAllocationId = async () => record({ status: BLOCKCHAIN_RECORD_STATUS.PENDING, txHash: null, blockNumber: null });
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.hasSigner = () => true;
    blockchainProvider.verify = async () => ({ exists: false, anchoredBy: '', anchoredAt: 0, blockNumber: 0 });
    blockchainProvider.record = async () => ({ txHash: '0xretry', blockNumber: 77 });
    let updatedData;
    blockchainRepository.update = async (id, data) => {
      updatedData = data;
      return record({ ...data, id });
    };

    const result = await blockchainService.retryRecord('alloc-1', { id: 'user-2', role: 'Treasurer' });

    assert.equal(updatedData.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    assert.equal(updatedData.txHash, '0xretry');
    assert.equal(updatedData.blockNumber, 77);
    assert.equal(result.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
  });

  await test('should recover an on-chain hash without re-submitting when verify finds it', async () => {
    allocationRepository.findById = async () => SAMPLE_ALLOCATION;
    blockchainRepository.findByAllocationId = async () => record({ status: BLOCKCHAIN_RECORD_STATUS.FAILED, txHash: null, blockNumber: null });
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => ({
      exists: true,
      anchoredBy: '0xowner',
      anchoredAt: 1700000000,
      blockNumber: 88,
    });
    let recordCalled = false;
    blockchainProvider.record = async () => {
      recordCalled = true;
      return { txHash: '0xtx', blockNumber: 1 };
    };
    let updatedData;
    blockchainRepository.update = async (id, data) => {
      updatedData = data;
      return record({ ...data, id });
    };

    const result = await blockchainService.retryRecord('alloc-1', { id: 'user-2', role: 'Administrator' });

    assert.equal(recordCalled, false);
    assert.equal(updatedData.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    assert.equal(updatedData.blockNumber, 88);
    assert.equal(updatedData.txHash, null);
    assert.equal(updatedData.confirmedAt.toISOString(), new Date(1700000000 * 1000).toISOString());
    assert.equal(result.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    assert.equal(result.blockNumber, 88);
  });

  await test('should throw 503 when re-anchoring fails', async () => {
    allocationRepository.findById = async () => SAMPLE_ALLOCATION;
    blockchainRepository.findByAllocationId = async () => record({ status: BLOCKCHAIN_RECORD_STATUS.PENDING, txHash: null, blockNumber: null });
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.hasSigner = () => true;
    blockchainProvider.verify = async () => ({ exists: false, anchoredBy: '', anchoredAt: 0, blockNumber: 0 });
    blockchainProvider.record = async () => {
      throw new Error('revert');
    };

    await assert.rejects(
      () => blockchainService.retryRecord('alloc-1', { id: 'user-2', role: 'Administrator' }),
      (err) => err.statusCode === 503
    );
  });

  await test('should throw 503 when no record exists and the mirror write fails', async () => {
    allocationRepository.findById = async () => SAMPLE_ALLOCATION;
    blockchainRepository.findByAllocationId = async () => null;
    blockchainRepository.findByContentHash = async () => null;
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => ({ exists: false, anchoredBy: '', anchoredAt: 0, blockNumber: 0 });
    blockchainProvider.record = async () => ({ txHash: '0xretry', blockNumber: 77 });
    blockchainRepository.createCurrent = async () => {
      throw new Error('db unavailable');
    };

    await assert.rejects(
      () => blockchainService.retryRecord('alloc-1', { id: 'user-2', role: 'Administrator' }),
      (err) => err.statusCode === 503
    );
  });

  console.log(`\n✨ Blockchain Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runBlockchainServiceTests().catch((err) => {
  console.error('❌ Blockchain Service unit test failed:', err);
  process.exit(1);
});
