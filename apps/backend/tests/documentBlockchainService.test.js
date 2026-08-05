import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import crypto from 'node:crypto';
import { documentBlockchainService } from '../services/documentBlockchainService.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { documentStorage } from '../services/documentStorageService.js';
import { blockchainProvider } from '../config/blockchain.js';
import { blockchainService } from '../services/blockchainService.js';
import { config } from '../config/env.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { BLOCKCHAIN_RECORD_STATUS } from '../constants/blockchainStatus.js';
import { DOCUMENT_ACTIVITY_ACTIONS } from '../constants/documentActivityActions.js';

const SYSTEM_ACTOR = { id: 'system-scheduler', role: 'System' };

const PAYLOAD = Buffer.from('PDF integrity payload for document blockchain tests');
const PAYLOAD_HASH = crypto.createHash('sha256').update(PAYLOAD).digest('hex');

const originals = {
  documentRepository: {
    findById: documentRepository.findById,
    findVersionByDocumentAndNumber: documentRepository.findVersionByDocumentAndNumber,
    updateVersion: documentRepository.updateVersion,
    createActivity: documentRepository.createActivity,
  },
  documentStorage: {
    openReadStream: documentStorage.openReadStream,
  },
  blockchainProvider: {
    isConfigured: blockchainProvider.isConfigured,
    verify: blockchainProvider.verify,
    getExplorerTxUrl: blockchainProvider.getExplorerTxUrl,
  },
  blockchainService: {
    anchorUnlessExists: blockchainService.anchorUnlessExists,
  },
};

function resetMocks() {
  for (const [ownerName, methods] of Object.entries(originals)) {
    const owner =
      ownerName === 'documentRepository'
        ? documentRepository
        : ownerName === 'documentStorage'
          ? documentStorage
          : ownerName === 'blockchainProvider'
            ? blockchainProvider
            : blockchainService;
    for (const [method, original] of Object.entries(methods)) {
      owner[method] = original;
    }
  }

  documentStorage.openReadStream = () => Readable.from([PAYLOAD]);
  blockchainProvider.isConfigured = () => false;
  blockchainProvider.getExplorerTxUrl = () => null;
}

function version(overrides = {}) {
  return {
    id: 'ver-1',
    versionNumber: 1,
    originalFileName: 'invoice.pdf',
    storageKey: 'abc-123.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 10n,
    fileExtension: 'pdf',
    sha256Hash: PAYLOAD_HASH,
    blockchainStatus: BLOCKCHAIN_RECORD_STATUS.PENDING,
    txHash: null,
    blockNumber: null,
    network: null,
    confirmedAt: null,
    uploadedBy: 'user-1',
    ...overrides,
  };
}

function document(overrides = {}) {
  return {
    id: 'doc-1',
    documentCode: 'DOC-2026-0001',
    deletedAt: null,
    currentVersion: version(),
    ...overrides,
  };
}

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

async function runDocumentBlockchainTests() {
  console.log('🧪 Starting Document Blockchain Service Tests...\n');

  console.log('1. anchorVersion (fail-soft anchoring):');
  await test('leaves a version Pending when the ledger is not configured', async () => {
    let updated = false;
    documentRepository.updateVersion = async () => {
      updated = true;
    };

    const result = await documentBlockchainService.anchorVersion(version(), 'user-1');

    assert.equal(result.blockchainStatus, BLOCKCHAIN_RECORD_STATUS.PENDING);
    assert.equal(updated, false);
  });

  await test('confirms the version when the anchor succeeds', async () => {
    blockchainProvider.isConfigured = () => true;
    blockchainService.anchorUnlessExists = async () => ({
      txHash: '0x123',
      blockNumber: 5,
      confirmedAt: new Date('2026-08-05T00:00:00Z'),
      recovered: false,
    });
    let updateArgs = null;
    documentRepository.updateVersion = async (id, data) => {
      updateArgs = { id, data };
      return { id, ...data };
    };

    const result = await documentBlockchainService.anchorVersion(version(), 'user-1');

    assert.equal(updateArgs.id, 'ver-1');
    assert.equal(updateArgs.data.blockchainStatus, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    assert.equal(updateArgs.data.txHash, '0x123');
    assert.equal(updateArgs.data.blockNumber, 5);
    assert.equal(updateArgs.data.network, config.blockchain.network);
    assert.equal(result.blockchainStatus, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
  });

  await test('marks the version Failed when the node rejects the write', async () => {
    blockchainProvider.isConfigured = () => true;
    blockchainService.anchorUnlessExists = async () => {
      throw new Error('node unreachable');
    };
    let statusData = null;
    documentRepository.updateVersion = async (id, data) => {
      statusData = data;
      return { id, ...data };
    };

    const result = await documentBlockchainService.anchorVersion(version(), 'user-1');

    assert.equal(statusData.blockchainStatus, BLOCKCHAIN_RECORD_STATUS.FAILED);
    assert.equal(result.blockchainStatus, BLOCKCHAIN_RECORD_STATUS.FAILED);
  });

  await test('skips already-confirmed versions without re-writing', async () => {
    blockchainProvider.isConfigured = () => true;
    let updated = false;
    documentRepository.updateVersion = async () => {
      updated = true;
    };

    const confirmed = version({
      blockchainStatus: BLOCKCHAIN_RECORD_STATUS.CONFIRMED,
      txHash: '0xabc',
    });
    const result = await documentBlockchainService.anchorVersion(confirmed, 'user-1');

    assert.equal(updated, false);
    assert.equal(result.txHash, '0xabc');
  });

  console.log('\n2. verifyDocument:');
  await test('throws 404 for a missing document', async () => {
    documentRepository.findById = async () => null;

    await assert.rejects(
      () => documentBlockchainService.verifyDocument('doc-x', undefined, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('throws 404 for a soft-deleted document', async () => {
    documentRepository.findById = async () => document({ deletedAt: new Date() });

    await assert.rejects(
      () => documentBlockchainService.verifyDocument('doc-1', undefined, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('reports verified when integrity and the on-chain anchor agree', async () => {
    documentRepository.findById = async () => document();
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => ({
      exists: true,
      anchoredBy: '0xabc',
      anchoredAt: 1710000000,
      blockNumber: 1,
    });
    let activity = null;
    documentRepository.createActivity = async (data) => {
      activity = data;
      return data;
    };

    const result = await documentBlockchainService.verifyDocument('doc-1', undefined, 'user-1');

    assert.equal(result.verified, true);
    assert.equal(result.integrityOk, true);
    assert.equal(result.inconclusive, false);
    assert.equal(result.onChain.exists, true);
    assert.equal(activity.action, DOCUMENT_ACTIVITY_ACTIONS.VERIFY);
    assert.equal(activity.actorId, 'user-1');
    assert.equal(activity.details.verified, true);
  });

  await test('reports inconclusive when the node is unreachable', async () => {
    documentRepository.findById = async () => document();
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => {
      throw new Error('node unreachable');
    };
    documentRepository.createActivity = async (data) => data;

    const result = await documentBlockchainService.verifyDocument('doc-1', undefined, 'user-1');

    assert.equal(result.integrityOk, true);
    assert.equal(result.onChain, null);
    assert.equal(result.inconclusive, true);
    assert.equal(result.verified, false);
  });

  await test('reports tampering when the stored bytes do not match the hash', async () => {
    documentRepository.findById = async () => document();
    documentStorage.openReadStream = () => Readable.from([Buffer.from('tampered bytes')]);
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => ({
      exists: true,
      anchoredBy: '0xabc',
      anchoredAt: 1,
      blockNumber: 1,
    });
    documentRepository.createActivity = async (data) => data;

    const result = await documentBlockchainService.verifyDocument('doc-1', undefined, 'user-1');

    assert.equal(result.integrityOk, false);
    assert.equal(result.verified, false);
    assert.match(result.message, /tampering/i);
  });

  await test('resolves a specific version by number', async () => {
    documentRepository.findById = async () => document();
    const v2 = version({ id: 'ver-2', versionNumber: 2 });
    documentRepository.findVersionByDocumentAndNumber = async (documentId, versionNumber) => {
      assert.equal(documentId, 'doc-1');
      assert.equal(versionNumber, 2);
      return v2;
    };
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => ({
      exists: true,
      anchoredBy: '0xabc',
      anchoredAt: 1,
      blockNumber: 1,
    });
    documentRepository.createActivity = async (data) => data;

    const result = await documentBlockchainService.verifyDocument('doc-1', 2, 'user-1');

    assert.equal(result.version.id, 'ver-2');
    assert.equal(result.version.versionNumber, 2);
  });

  await test('throws 404 when the stored file is missing', async () => {
    documentRepository.findById = async () => document();
    documentStorage.openReadStream = () => {
      throw new AppError('Stored file not found', HTTP_STATUS.NOT_FOUND);
    };

    await assert.rejects(
      () => documentBlockchainService.verifyDocument('doc-1', undefined, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n3. retryDocumentVersion:');
  await test('throws 503 when the ledger is not configured', async () => {
    documentRepository.findById = async () => document();
    blockchainProvider.isConfigured = () => false;

    await assert.rejects(
      () => documentBlockchainService.retryDocumentVersion('doc-1', undefined, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  });

  await test('confirms the version and records an ANCHOR_RETRY activity', async () => {
    documentRepository.findById = async () => document();
    blockchainProvider.isConfigured = () => true;
    blockchainService.anchorUnlessExists = async () => ({
      txHash: '0x123',
      blockNumber: 5,
      confirmedAt: new Date(),
      recovered: false,
    });
    documentRepository.updateVersion = async (id, data) => ({ id, ...data });
    let activity = null;
    documentRepository.createActivity = async (data) => {
      activity = data;
      return data;
    };

    const result = await documentBlockchainService.retryDocumentVersion('doc-1', undefined, 'user-1');

    assert.equal(result.blockchainStatus, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    assert.equal(result.txHash, '0x123');
    assert.equal(activity.action, DOCUMENT_ACTIVITY_ACTIONS.ANCHOR_RETRY);
    assert.equal(activity.details.status, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
  });

  await test('throws 503 when the anchor fails', async () => {
    documentRepository.findById = async () => document();
    blockchainProvider.isConfigured = () => true;
    blockchainService.anchorUnlessExists = async () => {
      throw new Error('node unreachable');
    };

    await assert.rejects(
      () => documentBlockchainService.retryDocumentVersion('doc-1', undefined, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  });

  await test('returns an already-confirmed version as-is and logs the retry activity', async () => {
    documentRepository.findById = async () =>
      document({
        currentVersion: version({
          blockchainStatus: BLOCKCHAIN_RECORD_STATUS.CONFIRMED,
          txHash: '0xabc',
        }),
      });
    let updated = false;
    documentRepository.updateVersion = async () => {
      updated = true;
    };
    let activity = null;
    documentRepository.createActivity = async (data) => {
      activity = data;
      return data;
    };

    const result = await documentBlockchainService.retryDocumentVersion('doc-1', undefined, 'user-1');

    assert.equal(updated, false);
    assert.equal(result.blockchainStatus, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
    assert.equal(activity.action, DOCUMENT_ACTIVITY_ACTIONS.ANCHOR_RETRY);
  });

  await test('throws 404 when the document does not exist', async () => {
    documentRepository.findById = async () => null;

    await assert.rejects(
      () => documentBlockchainService.retryDocumentVersion('doc-x', undefined, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n4. retryVersion (scheduler path):');
  await test('throws 503 for the scheduler when the ledger is not configured', async () => {
    blockchainProvider.isConfigured = () => false;

    await assert.rejects(
      () => documentBlockchainService.retryVersion(version(), SYSTEM_ACTOR),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  });

  await test('recovers an already-recorded hash from on-chain data', async () => {
    blockchainProvider.isConfigured = () => true;
    blockchainService.anchorUnlessExists = async () => ({
      txHash: null,
      blockNumber: 7,
      confirmedAt: new Date('2026-08-01T00:00:00Z'),
      recovered: true,
    });
    let updateData = null;
    documentRepository.updateVersion = async (id, data) => {
      updateData = data;
      return { id, ...data };
    };

    const result = await documentBlockchainService.retryVersion(version(), SYSTEM_ACTOR);

    assert.equal(updateData.txHash, null);
    assert.equal(updateData.blockNumber, 7);
    assert.equal(result.blockchainStatus, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
  });

  await test('serializes BigInt block numbers and adds an explorer link', async () => {
    blockchainProvider.getExplorerTxUrl = (txHash) =>
      txHash ? `https://explorer/tx/${txHash}` : null;

    const serialized = documentBlockchainService.serializeVersion(
      version({ blockchainStatus: BLOCKCHAIN_RECORD_STATUS.CONFIRMED, txHash: '0xabc', blockNumber: 42n })
    );

    assert.equal(serialized.blockNumber, 42);
    assert.equal(serialized.fileSizeBytes, 10);
    assert.equal(serialized.txExplorerUrl, 'https://explorer/tx/0xabc');
  });

  console.log(`\n✨ Document Blockchain Service Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runDocumentBlockchainTests().catch((err) => {
  console.error('❌ Document Blockchain Service test failed:', err);
  process.exit(1);
});
