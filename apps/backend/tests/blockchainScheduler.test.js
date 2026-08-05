import assert from 'node:assert/strict';
import { BlockchainScheduler } from '../services/blockchainScheduler.js';
import { blockchainProvider } from '../config/blockchain.js';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { blockchainService } from '../services/blockchainService.js';
import { documentBlockchainService } from '../services/documentBlockchainService.js';

const originalMethods = {
  isConfigured: blockchainProvider.isConfigured,
  findUnconfirmed: blockchainRepository.findUnconfirmed,
  findUnconfirmedVersions: documentRepository.findUnconfirmedVersions,
  retryRecord: blockchainService.retryRecord,
  retryVersion: documentBlockchainService.retryVersion,
};

function resetMocks() {
  blockchainProvider.isConfigured = originalMethods.isConfigured;
  blockchainRepository.findUnconfirmed = originalMethods.findUnconfirmed;
  documentRepository.findUnconfirmedVersions = originalMethods.findUnconfirmedVersions;
  blockchainService.retryRecord = originalMethods.retryRecord;
  documentBlockchainService.retryVersion = originalMethods.retryVersion;
  documentRepository.findUnconfirmedVersions = async () => [];
  documentBlockchainService.retryVersion = async (version) => ({ ...version, status: 'Confirmed' });
}

async function runBlockchainSchedulerTests() {
  console.log('🧪 Starting Blockchain Scheduler Unit Tests...\n');
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

  await test('reconcilePendingRecords() returns zero counts when provider is not configured', async () => {
    blockchainProvider.isConfigured = () => false;
    let findUnconfirmedCalled = false;
    blockchainRepository.findUnconfirmed = async () => {
      findUnconfirmedCalled = true;
      return [];
    };

    const scheduler = new BlockchainScheduler();
    const result = await scheduler.reconcilePendingRecords();

    assert.equal(result.processed, 0);
    assert.equal(result.succeeded, 0);
    assert.equal(result.failed, 0);
    assert.equal(findUnconfirmedCalled, false);
  });

  await test('reconcilePendingRecords() retries each unconfirmed record when provider is configured', async () => {
    blockchainProvider.isConfigured = () => true;

    const mockUnconfirmed = [
      { id: 'rec-1', allocationId: 'alloc-1', allocationCode: 'ALC-2026-0001', status: 'Pending' },
      { id: 'rec-2', allocationId: 'alloc-2', allocationCode: 'ALC-2026-0002', status: 'Failed' },
    ];

    blockchainRepository.findUnconfirmed = async () => mockUnconfirmed;

    const retriedAllocations = [];
    blockchainService.retryRecord = async (allocId, actor) => {
      retriedAllocations.push({ allocId, actorRole: actor.role });
      return { id: `rec-retried-${allocId}`, status: 'Confirmed' };
    };

    const scheduler = new BlockchainScheduler();
    const result = await scheduler.reconcilePendingRecords();

    assert.equal(result.processed, 2);
    assert.equal(result.succeeded, 2);
    assert.equal(result.failed, 0);
    assert.equal(retriedAllocations.length, 2);
    assert.equal(retriedAllocations[0].allocId, 'alloc-1');
    assert.equal(retriedAllocations[0].actorRole, 'System');
    assert.equal(retriedAllocations[1].allocId, 'alloc-2');
  });

  await test('reconcilePendingRecords() fail-softs when individual record retries throw', async () => {
    blockchainProvider.isConfigured = () => true;

    const mockUnconfirmed = [
      { id: 'rec-1', allocationId: 'alloc-1', allocationCode: 'ALC-2026-0001', status: 'Pending' },
      { id: 'rec-2', allocationId: 'alloc-2', allocationCode: 'ALC-2026-0002', status: 'Pending' },
    ];

    blockchainRepository.findUnconfirmed = async () => mockUnconfirmed;

    blockchainService.retryRecord = async (allocId) => {
      if (allocId === 'alloc-1') {
        throw new Error('RPC node connection reset');
      }
      return { id: 'rec-2', status: 'Confirmed' };
    };

    const scheduler = new BlockchainScheduler();
    const result = await scheduler.reconcilePendingRecords();

    assert.equal(result.processed, 2);
    assert.equal(result.succeeded, 1);
    assert.equal(result.failed, 1);
  });

  await test('reconcilePendingRecords() also retries unconfirmed document versions', async () => {
    blockchainProvider.isConfigured = () => true;
    blockchainRepository.findUnconfirmed = async () => [];
    documentRepository.findUnconfirmedVersions = async () => [
      { id: 'dv-1', sha256Hash: 'a'.repeat(64), status: 'Pending' },
      { id: 'dv-2', sha256Hash: 'b'.repeat(64), status: 'Failed' },
    ];

    const retried = [];
    documentBlockchainService.retryVersion = async (version, actor) => {
      retried.push({ id: version.id, actorRole: actor.role });
      return { ...version, status: 'Confirmed' };
    };

    const scheduler = new BlockchainScheduler();
    const result = await scheduler.reconcilePendingRecords();

    assert.equal(result.processed, 2);
    assert.equal(result.succeeded, 2);
    assert.equal(result.failed, 0);
    assert.deepEqual(retried.map((r) => r.id), ['dv-1', 'dv-2']);
    assert.equal(retried[0].actorRole, 'System');
  });

  await test('reconcilePendingRecords() fail-softs when a document version retry throws', async () => {
    blockchainProvider.isConfigured = () => true;
    blockchainRepository.findUnconfirmed = async () => [];
    documentRepository.findUnconfirmedVersions = async () => [
      { id: 'dv-1', sha256Hash: 'a'.repeat(64), status: 'Pending' },
      { id: 'dv-2', sha256Hash: 'b'.repeat(64), status: 'Pending' },
    ];
    documentBlockchainService.retryVersion = async (version) => {
      if (version.id === 'dv-1') {
        throw new Error('RPC node connection reset');
      }
      return { ...version, status: 'Confirmed' };
    };

    const scheduler = new BlockchainScheduler();
    const result = await scheduler.reconcilePendingRecords();

    assert.equal(result.processed, 2);
    assert.equal(result.succeeded, 1);
    assert.equal(result.failed, 1);
  });

  await test('reconcilePendingRecords() prevents overlapping concurrent runs', async () => {
    blockchainProvider.isConfigured = () => true;

    const scheduler = new BlockchainScheduler();
    scheduler.isProcessing = true; // Simulate active run

    let findUnconfirmedCalled = false;
    blockchainRepository.findUnconfirmed = async () => {
      findUnconfirmedCalled = true;
      return [];
    };

    const result = await scheduler.reconcilePendingRecords();

    assert.equal(result.processed, 0);
    assert.equal(findUnconfirmedCalled, false);
  });

  await test('start() and stop() manage interval timer lifecycle correctly', async () => {
    const scheduler = new BlockchainScheduler();
    assert.equal(scheduler.timer, null);

    scheduler.start(10000);
    assert.notEqual(scheduler.timer, null);

    // Repeated start should not create duplicate timers
    const firstTimer = scheduler.timer;
    scheduler.start(10000);
    assert.equal(scheduler.timer, firstTimer);

    scheduler.stop();
    assert.equal(scheduler.timer, null);
  });

  console.log(`\nResults: ${passedTests}/${totalTests} tests passed.\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runBlockchainSchedulerTests().catch((error) => {
  console.error('Unhandled test suite failure:', error);
  process.exit(1);
});
