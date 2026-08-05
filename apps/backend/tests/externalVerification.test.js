import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import verificationRoutes from '../routes/verificationRoutes.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { documentBlockchainService } from '../services/documentBlockchainService.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { blockchainProvider } from '../config/blockchain.js';
import { userRepository } from '../repositories/userRepository.js';
import { signToken } from '../utils/jwt.js';
import { USER_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { BLOCKCHAIN_RECORD_STATUS } from '../constants/blockchainStatus.js';
import { DOCUMENT_ACTIVITY_ACTIONS } from '../constants/documentActivityActions.js';
import { AppError } from '../errors/appError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { disableAuditPersistence } from './auditTestConfig.js';

disableAuditPersistence();

const PAYLOAD = Buffer.from('External file verification payload for M6');
const PAYLOAD_HASH = crypto.createHash('sha256').update(PAYLOAD).digest('hex');

const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'budgetchain-verify-test-'));

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

const originals = {
  documentRepository: {
    findVersionByHashWithDocument: documentRepository.findVersionByHashWithDocument,
    createActivity: documentRepository.createActivity,
  },
  blockchainProvider: {
    isConfigured: blockchainProvider.isConfigured,
    verify: blockchainProvider.verify,
    getExplorerTxUrl: blockchainProvider.getExplorerTxUrl,
  },
  documentBlockchainService: {
    verifyExternalFile: documentBlockchainService.verifyExternalFile,
  },
};

function resetMocks() {
  for (const [ownerName, methods] of Object.entries(originals)) {
    const owner =
      ownerName === 'documentRepository'
        ? documentRepository
        : ownerName === 'blockchainProvider'
          ? blockchainProvider
          : documentBlockchainService;
    for (const [method, original] of Object.entries(methods)) {
      owner[method] = original;
    }
  }

  blockchainProvider.isConfigured = () => false;
  blockchainProvider.getExplorerTxUrl = () => null;
  documentRepository.createActivity = async (data) => data;
}

function matchedVersion(overrides = {}) {
  return {
    id: 'ver-1',
    documentId: 'doc-1',
    versionNumber: 1,
    originalFileName: 'invoice.pdf',
    storageKey: 'abc-123.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 10n,
    fileExtension: 'pdf',
    sha256Hash: PAYLOAD_HASH,
    blockchainStatus: BLOCKCHAIN_RECORD_STATUS.CONFIRMED,
    txHash: '0xabc',
    blockNumber: 1n,
    network: 'hardhat',
    confirmedAt: new Date('2026-08-06T00:00:00Z'),
    uploadedAt: new Date('2026-08-06T00:00:00Z'),
    uploadedBy: 'user-1',
    document: {
      id: 'doc-1',
      documentCode: 'DOC-2026-0001',
      title: 'Invoice',
      documentType: 'Invoice',
      status: 'Active',
    },
    ...overrides,
  };
}

function makeUploadFile() {
  const filePath = path.join(TEMP_DIR, crypto.randomUUID());
  fs.writeFileSync(filePath, PAYLOAD);
  return { path: filePath };
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

async function runExternalVerificationServiceTests() {
  console.log('🧪 Starting External File Verification Service Tests...\n');

  await test('throws 400 when no file is provided', async () => {
    await assert.rejects(
      () => documentBlockchainService.verifyExternalFile(null, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.BAD_REQUEST
    );
  });

  await test('reports verifiedAgainst none when no stored version matches', async () => {
    documentRepository.findVersionByHashWithDocument = async () => null;

    const result = await documentBlockchainService.verifyExternalFile(
      makeUploadFile(),
      'user-1'
    );

    assert.equal(result.verified, false);
    assert.equal(result.integrityOk, false);
    assert.equal(result.verifiedAgainst, 'none');
    assert.equal(result.inconclusive, false);
    assert.equal(result.matchedVersion, null);
    assert.match(result.message, /No document in the system matches/i);
  });

  await test('reports verified when the match is anchored on-chain', async () => {
    documentRepository.findVersionByHashWithDocument = async () => matchedVersion();
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

    const result = await documentBlockchainService.verifyExternalFile(
      makeUploadFile(),
      'user-1'
    );

    assert.equal(result.verified, true);
    assert.equal(result.integrityOk, true);
    assert.equal(result.verifiedAgainst, 'blockchain');
    assert.equal(result.onChain.exists, true);
    assert.equal(result.matchedVersion.document.documentCode, 'DOC-2026-0001');
    assert.equal(activity.action, DOCUMENT_ACTIVITY_ACTIONS.VERIFY);
    assert.equal(activity.documentId, 'doc-1');
    assert.equal(activity.details.source, 'external');
  });

  await test('reports inconclusive when the node is unreachable', async () => {
    documentRepository.findVersionByHashWithDocument = async () => matchedVersion();
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => {
      throw new Error('node unreachable');
    };
    documentRepository.createActivity = async (data) => data;

    const result = await documentBlockchainService.verifyExternalFile(
      makeUploadFile(),
      'user-1'
    );

    assert.equal(result.integrityOk, true);
    assert.equal(result.onChain, null);
    assert.equal(result.inconclusive, true);
    assert.equal(result.verified, false);
    assert.equal(result.verifiedAgainst, 'database');
    assert.match(result.message, /inconclusive/i);
  });

  await test('reports not verified when the hash is not anchored on-chain', async () => {
    documentRepository.findVersionByHashWithDocument = async () => matchedVersion({
      blockchainStatus: BLOCKCHAIN_RECORD_STATUS.PENDING,
      txHash: null,
      blockNumber: null,
    });
    blockchainProvider.isConfigured = () => true;
    blockchainProvider.verify = async () => ({
      exists: false,
      anchoredBy: '0x0',
      anchoredAt: 0,
      blockNumber: 0,
    });
    documentRepository.createActivity = async (data) => data;

    const result = await documentBlockchainService.verifyExternalFile(
      makeUploadFile(),
      'user-1'
    );

    assert.equal(result.verified, false);
    assert.equal(result.integrityOk, true);
    assert.equal(result.inconclusive, false);
    assert.equal(result.verifiedAgainst, 'database');
    assert.match(result.message, /not anchored/i);
  });

  await test('reports inconclusive when the ledger is not configured', async () => {
    documentRepository.findVersionByHashWithDocument = async () => matchedVersion();
    blockchainProvider.isConfigured = () => false;
    documentRepository.createActivity = async (data) => data;

    const result = await documentBlockchainService.verifyExternalFile(
      makeUploadFile(),
      'user-1'
    );

    assert.equal(result.verified, false);
    assert.equal(result.integrityOk, true);
    assert.equal(result.onChain, null);
    assert.equal(result.inconclusive, true);
    assert.equal(result.verifiedAgainst, 'database');
  });

  await test('never records a document activity when nothing matches', async () => {
    documentRepository.findVersionByHashWithDocument = async () => null;
    let activity = null;
    documentRepository.createActivity = async (data) => {
      activity = data;
      return data;
    };

    await documentBlockchainService.verifyExternalFile(makeUploadFile(), 'user-1');

    assert.equal(activity, null);
  });

  console.log(
    `\n✨ External File Verification Service Tests Completed: ${passedTests}/${totalTests} Passed!\n`
  );
}

let routePassed = 0;
let routeTotal = 0;

const routeTest = async (name, testFn) => {
  routeTotal++;
  resetRouteMocks();
  try {
    await testFn();
    console.log(`   - ${name}: ✅ PASSED`);
    routePassed++;
  } catch (err) {
    console.error(`   - ${name}: ❌ FAILED`);
    console.error(`     ${err.stack || err}`);
  } finally {
    resetRouteMocks();
  }
};

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

const originalFindById = userRepository.findById;
let verifyCalls = 0;

function stubService() {
  documentBlockchainService.verifyExternalFile = async () => {
    verifyCalls++;
    return {
      verified: true,
      integrityOk: true,
      onChain: { exists: true, anchoredBy: '0xabc', anchoredAt: 1710000000, blockNumber: 1 },
      inconclusive: false,
      message: 'File verified on the blockchain ledger.',
      matchedVersion: {
        id: 'ver-1',
        documentId: 'doc-1',
        versionNumber: 1,
        document: { id: 'doc-1', documentCode: 'DOC-2026-0001', title: 'Invoice', documentType: 'Invoice', status: 'Active' },
      },
      verifiedAgainst: 'blockchain',
    };
  };
}

function resetRouteMocks() {
  resetMocks();
  verifyCalls = 0;
  userRepository.findById = originalFindById;
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/verification', verificationRoutes);
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

async function request(path, { method = 'GET', token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const options = { method, headers };
  if (form) options.body = form;
  const res = await fetch(`${baseUrl}${path}`, options);
  const contentType = res.headers.get('content-type') || '';
  let parsedBody = null;
  if (contentType.includes('application/json')) {
    parsedBody = await res.json();
  } else {
    parsedBody = await res.text();
  }
  return { status: res.status, body: parsedBody };
}

function makeForm() {
  const form = new FormData();
  form.append('file', new Blob([PDF_BYTES]), 'copy.pdf');
  return form;
}

async function runExternalVerificationRouteTests() {
  console.log('🧪 Starting External Verification Route / RBAC Tests...\n');

  await startServer();

  try {
    await routeTest('rejects an unauthenticated request with 401', async () => {
      const res = await request('/api/verification/documents', { method: 'POST', form: makeForm() });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    await routeTest('allows an Auditor to verify a file', async () => {
      userRepository.findById = async () => makeUser(ROLES.AUDITOR);
      stubService();

      const res = await request('/api/verification/documents', {
        method: 'POST',
        token: tokenFor(ROLES.AUDITOR),
        form: makeForm(),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(verifyCalls, 1);
      assert.equal(res.body.data.verified, true);
      assert.equal(res.body.data.verifiedAgainst, 'blockchain');
    });

    await routeTest('allows an Administrator to verify a file', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/verification/documents', {
        method: 'POST',
        token: tokenFor(ROLES.ADMINISTRATOR),
        form: makeForm(),
      });

      assert.equal(res.status, 200);
      assert.equal(verifyCalls, 1);
    });

    await routeTest('rejects a request with no file', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const form = new FormData();
      const res = await request('/api/verification/documents', {
        method: 'POST',
        token: tokenFor(ROLES.ADMINISTRATOR),
        form,
      });

      assert.equal(res.status, 400);
      assert.equal(verifyCalls, 0);
    });

    await routeTest('rejects an unsupported file type with 415', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const form = new FormData();
      form.append('file', new Blob([new Uint8Array([0x7f, 0x45, 0x4c, 0x46])]), 'bad.exe');

      const res = await request('/api/verification/documents', {
        method: 'POST',
        token: tokenFor(ROLES.ADMINISTRATOR),
        form,
      });

      assert.equal(res.status, 415);
      assert.equal(verifyCalls, 0);
    });

    await routeTest('allows a Treasurer and Budget Officer to verify a file', async () => {
      for (const role of [ROLES.TREASURER, ROLES.BUDGET_OFFICER]) {
        resetRouteMocks();
        userRepository.findById = async () => makeUser(role);
        stubService();

        const res = await request('/api/verification/documents', {
          method: 'POST',
          token: tokenFor(role),
          form: makeForm(),
        });

        assert.equal(res.status, 200);
        assert.equal(verifyCalls, 1);
      }
    });
  } finally {
    await stopServer();
  }

  console.log(
    `\n✨ External Verification Route Tests Completed: ${routePassed}/${routeTotal} Passed!\n`
  );
}

async function main() {
  await runExternalVerificationServiceTests();
  await runExternalVerificationRouteTests();

  const allPassed = passedTests === totalTests && routePassed === routeTotal;
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ External file verification test failed:', err);
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  process.exit(1);
});
