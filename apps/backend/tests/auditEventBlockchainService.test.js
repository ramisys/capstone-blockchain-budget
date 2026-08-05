import assert from 'node:assert/strict';
import { auditEventBlockchainService } from '../services/auditEventBlockchainService.js';
import { blockchainProvider } from '../config/blockchain.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { config } from '../config/env.js';
import { disableAuditPersistence } from './auditTestConfig.js';

disableAuditPersistence();

const originalMethods = {
  isAuditConfigured: blockchainProvider.isAuditConfigured,
  auditVerify: blockchainProvider.auditVerify,
  auditRecord: blockchainProvider.auditRecord,
  updateAnchor: auditLogRepository.updateAnchor,
};

const originalNetwork = config.blockchain.network;

function makeLog(overrides = {}) {
  return {
    id: 'log-1',
    action: 'AUTH_LOGIN',
    result: 'Success',
    eventHash: 'a'.repeat(64),
    anchorStatus: 'Pending',
    txHash: null,
    blockNumber: null,
    network: null,
    confirmedAt: null,
    createdAt: new Date('2026-08-06T08:00:00.000Z'),
    ...overrides,
  };
}

function resetMocks() {
  blockchainProvider.isAuditConfigured = originalMethods.isAuditConfigured;
  blockchainProvider.auditVerify = originalMethods.auditVerify;
  blockchainProvider.auditRecord = originalMethods.auditRecord;
  auditLogRepository.updateAnchor = originalMethods.updateAnchor;
  config.blockchain.network = originalNetwork;
}

async function runAuditEventBlockchainServiceTests() {
  console.log('🧪 Starting Audit Event Blockchain Service Unit Tests...\n');
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

  console.log('1. anchorEvent (fail-soft) Tests:');
  await test('should return the log as-is when it has no event hash', async () => {
    const log = makeLog({ eventHash: null });
    const result = await auditEventBlockchainService.anchorEvent(log);
    assert.equal(result, log);
  });

  await test('should return the log as-is when it is already Confirmed with a tx hash', async () => {
    const log = makeLog({ anchorStatus: 'Confirmed', txHash: '0xtx', blockNumber: 5n });
    const result = await auditEventBlockchainService.anchorEvent(log);
    assert.equal(result, log);
  });

  await test('should leave the log Pending when the audit ledger is not configured', async () => {
    blockchainProvider.isAuditConfigured = () => false;
    let updateCalled = false;
    auditLogRepository.updateAnchor = async () => {
      updateCalled = true;
      return {};
    };

    const log = makeLog();
    const result = await auditEventBlockchainService.anchorEvent(log);

    assert.equal(result, log);
    assert.equal(updateCalled, false, 'no DB update should happen when unconfigured');
  });

  await test('should mark the log Confirmed on a successful anchor', async () => {
    blockchainProvider.isAuditConfigured = () => true;
    blockchainProvider.auditVerify = async () => ({ exists: false });
    blockchainProvider.auditRecord = async () => ({ txHash: '0xtx', blockNumber: 9 });
    config.blockchain.network = 'hardhat-local';

    let updateData = null;
    auditLogRepository.updateAnchor = async (id, data) => {
      updateData = { id, data };
      return { id, ...data, blockNumber: data.blockNumber };
    };

    const result = await auditEventBlockchainService.anchorEvent(makeLog());

    assert.ok(updateData, 'updateAnchor should have been called');
    assert.equal(updateData.id, 'log-1');
    assert.equal(updateData.data.anchorStatus, 'Confirmed');
    assert.equal(updateData.data.txHash, '0xtx');
    assert.equal(updateData.data.blockNumber, 9);
    assert.equal(updateData.data.network, 'hardhat-local');
    assert.ok(updateData.data.confirmedAt instanceof Date);
    assert.equal(result.anchorStatus, 'Confirmed');
  });

  await test('should mark the log Failed when the anchor write rejects', async () => {
    blockchainProvider.isAuditConfigured = () => true;
    blockchainProvider.auditVerify = async () => ({ exists: false });
    blockchainProvider.auditRecord = async () => {
      throw new Error('RPC node connection reset');
    };

    let updateData = null;
    auditLogRepository.updateAnchor = async (id, data) => {
      updateData = data;
      return { id, ...data };
    };

    const result = await auditEventBlockchainService.anchorEvent(makeLog());

    assert.equal(updateData.anchorStatus, 'Failed');
    assert.equal(result.anchorStatus, 'Failed');
  });

  await test('should never throw even when the Failed status update also fails', async () => {
    blockchainProvider.isAuditConfigured = () => true;
    blockchainProvider.auditVerify = async () => ({ exists: false });
    blockchainProvider.auditRecord = async () => {
      throw new Error('RPC down');
    };
    auditLogRepository.updateAnchor = async () => {
      throw new Error('DB down too');
    };

    const log = makeLog();
    let resolved = false;
    await auditEventBlockchainService.anchorEvent(log).then(() => {
      resolved = true;
    });

    assert.equal(resolved, true, 'anchorEvent must resolve even on total failure');
  });

  await test('should recover from an on-chain-existing event instead of re-recording', async () => {
    blockchainProvider.isAuditConfigured = () => true;
    blockchainProvider.auditVerify = async () => ({
      exists: true,
      category: 'AUTH_LOGIN',
      anchoredBy: '0xowner',
      anchoredAt: 1700000000,
      blockNumber: 88,
    });
    let recordCalled = false;
    blockchainProvider.auditRecord = async () => {
      recordCalled = true;
      return { txHash: '0xtx', blockNumber: 99 };
    };

    auditLogRepository.updateAnchor = async (id, data) => ({ id, ...data });

    const result = await auditEventBlockchainService.anchorEvent(makeLog());

    assert.equal(recordCalled, false, 'should not call auditRecord when the event already exists');
    assert.equal(result.anchorStatus, 'Confirmed');
    assert.equal(result.txHash, null);
    assert.equal(result.blockNumber, 88);
  });

  console.log('\n2. retryEvent Tests:');
  await test('should return the log as-is when already Confirmed', async () => {
    const log = makeLog({ anchorStatus: 'Confirmed', txHash: '0xtx' });
    const result = await auditEventBlockchainService.retryEvent(log, 'user-1');
    assert.equal(result, log);
  });

  await test('should throw 503 when the audit ledger is not configured', async () => {
    blockchainProvider.isAuditConfigured = () => false;

    await assert.rejects(
      () => auditEventBlockchainService.retryEvent(makeLog(), 'user-1'),
      (err) => err.statusCode === 503 && err.message.includes('not configured')
    );
  });

  await test('should mark the log Confirmed on a successful retry', async () => {
    blockchainProvider.isAuditConfigured = () => true;
    blockchainProvider.auditVerify = async () => ({ exists: false });
    blockchainProvider.auditRecord = async () => ({ txHash: '0xretry', blockNumber: 42 });
    config.blockchain.network = 'hardhat-local';

    let updateData = null;
    auditLogRepository.updateAnchor = async (id, data) => {
      updateData = data;
      return { id, ...data };
    };

    const result = await auditEventBlockchainService.retryEvent(makeLog(), 'user-1');

    assert.equal(updateData.anchorStatus, 'Confirmed');
    assert.equal(updateData.txHash, '0xretry');
    assert.equal(result.anchorStatus, 'Confirmed');
  });

  await test('should log a failure and throw 503 when the retry rejects', async () => {
    blockchainProvider.isAuditConfigured = () => true;
    blockchainProvider.auditVerify = async () => ({ exists: false });
    blockchainProvider.auditRecord = async () => {
      throw new Error('node unreachable');
    };

    await assert.rejects(
      () => auditEventBlockchainService.retryEvent(makeLog(), 'user-1'),
      (err) => err.statusCode === 503 && err.message.includes('node unreachable')
    );
  });

  console.log('\n3. anchorUnlessExists Tests:');
  await test('should recover from the ledger when the event is already anchored', async () => {
    blockchainProvider.auditVerify = async () => ({ exists: true, anchoredAt: 1700000000, blockNumber: 77 });
    let recordCalled = false;
    blockchainProvider.auditRecord = async () => {
      recordCalled = true;
      return { txHash: '0x', blockNumber: 1 };
    };

    const outcome = await auditEventBlockchainService.anchorUnlessExists('b'.repeat(64), 'AUTH_LOGIN');

    assert.equal(recordCalled, false);
    assert.equal(outcome.recovered, true);
    assert.equal(outcome.txHash, null);
    assert.equal(outcome.blockNumber, 77);
    assert.equal(outcome.confirmedAt.toISOString(), new Date(1700000000 * 1000).toISOString());
  });

  await test('should record the event when it is not anchored yet', async () => {
    blockchainProvider.auditVerify = async () => ({ exists: false });
    blockchainProvider.auditRecord = async () => ({ txHash: '0xnew', blockNumber: 10 });

    const outcome = await auditEventBlockchainService.anchorUnlessExists('c'.repeat(64), 'AUTH_LOGOUT');

    assert.equal(outcome.recovered, false);
    assert.equal(outcome.txHash, '0xnew');
    assert.equal(outcome.blockNumber, 10);
  });

  await test('should record the event when verification is inconclusive (node hiccup)', async () => {
    blockchainProvider.auditVerify = async () => {
      throw new Error('timeout');
    };
    blockchainProvider.auditRecord = async () => ({ txHash: '0xfallback', blockNumber: 5 });

    const outcome = await auditEventBlockchainService.anchorUnlessExists('d'.repeat(64), 'AUTH_LOGIN');

    assert.equal(outcome.recovered, false);
    assert.equal(outcome.txHash, '0xfallback');
  });

  console.log('\n4. serialize Tests:');
  await test('should convert BigInt block numbers to plain numbers', () => {
    const serialized = auditEventBlockchainService.serialize(makeLog({ blockNumber: 42n }));
    assert.equal(serialized.blockNumber, 42);
    assert.equal(typeof serialized.blockNumber, 'number');
  });

  await test('should return null for missing logs', () => {
    assert.equal(auditEventBlockchainService.serialize(null), null);
  });

  console.log(
    `\n✨ Audit Event Blockchain Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`
  );
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAuditEventBlockchainServiceTests().catch((err) => {
  console.error('❌ Audit Event Blockchain Service unit test failed:', err);
  process.exit(1);
});
