import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { Readable } from 'node:stream';
import express from 'express';
import documentRoutes from '../routes/documentRoutes.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { userRepository } from '../repositories/userRepository.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { documentStorage } from '../services/documentStorageService.js';
import { blockchainProvider } from '../config/blockchain.js';
import { blockchainService } from '../services/blockchainService.js';
import { signToken } from '../utils/jwt.js';
import { USER_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { FISCAL_YEAR_STATUS } from '../constants/fiscalYearStatus.js';
import { DOCUMENT_STATUS } from '../constants/documentStatus.js';
import { BLOCKCHAIN_RECORD_STATUS } from '../constants/blockchainStatus.js';
import { disableAuditPersistence } from './auditTestConfig.js';

disableAuditPersistence();

const VALID_UUID = '00000000-0000-4000-8000-000000000000';
const PDF_BYTES = Buffer.from('%PDF-1.4 integration test payload');
const PDF_HASH = crypto.createHash('sha256').update(PDF_BYTES).digest('hex');

const fiscalYear = {
  id: 'fy-2026',
  code: 'FY-2026',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-12-31'),
  status: FISCAL_YEAR_STATUS.ACTIVE,
};

const department = {
  id: 'dept-1',
  code: 'DEPT-1',
  name: 'Engineering',
  status: USER_STATUS.ACTIVE,
};

const currentVersion = {
  id: 'ver-1',
  versionNumber: 1,
  originalFileName: 'pr.pdf',
  storageKey: null,
  mimeType: 'application/pdf',
  fileSizeBytes: 0,
  fileExtension: 'pdf',
  sha256Hash: PDF_HASH,
  blockchainStatus: BLOCKCHAIN_RECORD_STATUS.PENDING,
  txHash: null,
  blockNumber: null,
  network: null,
  confirmedAt: null,
  uploadedBy: 'user-Administrator',
};

function makeUploadedDocument(overrides = {}) {
  return {
    id: VALID_UUID,
    documentCode: 'DOC-2026-0001',
    title: 'Purchase Request',
    description: null,
    documentType: 'PurchaseRequest',
    fiscalYearId: 'fy-2026',
    departmentId: 'dept-1',
    allocationId: null,
    status: DOCUMENT_STATUS.ACTIVE,
    currentVersionId: 'ver-1',
    uploadedBy: 'user-Administrator',
    archivedBy: null,
    archivedAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    currentVersion: { ...currentVersion },
    ...overrides,
  };
}

const originals = {
  userRepository: { findById: userRepository.findById },
  documentRepository: {
    findById: documentRepository.findById,
    findVersionByHash: documentRepository.findVersionByHash,
    createDocumentWithVersion: documentRepository.createDocumentWithVersion,
    createActivity: documentRepository.createActivity,
    updateVersion: documentRepository.updateVersion,
    update: documentRepository.update,
  },
  fiscalYearRepository: { findById: fiscalYearRepository.findById },
  departmentRepository: { findById: departmentRepository.findById },
  documentStorage: {
    storeStream: documentStorage.storeStream,
    openReadStream: documentStorage.openReadStream,
    removeBlob: documentStorage.removeBlob,
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
      ownerName === 'userRepository'
        ? userRepository
        : ownerName === 'documentRepository'
          ? documentRepository
          : ownerName === 'fiscalYearRepository'
            ? fiscalYearRepository
            : ownerName === 'departmentRepository'
              ? departmentRepository
              : ownerName === 'documentStorage'
                ? documentStorage
                : ownerName === 'blockchainProvider'
                  ? blockchainProvider
                  : blockchainService;
    for (const [method, original] of Object.entries(methods)) {
      owner[method] = original;
    }
  }
}

const storedBlobs = new Map();
let uploadedStorageKey = null;

const calls = {
  update: 0,
  createActivity: 0,
};

/**
 * Install the integration boundary mocks: an in-memory storage driver that
 * actually hashes the uploaded bytes, repository stubs that persist the
 * document, and a "configured" ledger that confirms anchors and verifies.
 * The route/controller/service layers run for real.
 */
function setupMocks() {
  storedBlobs.clear();
  uploadedStorageKey = null;
  calls.update = 0;
  calls.createActivity = 0;

  documentStorage.storeStream = async (stream, storageKey) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const buffer = Buffer.concat(chunks);
    storedBlobs.set(storageKey, buffer);
    uploadedStorageKey = storageKey;
    return {
      sizeBytes: buffer.length,
      sha256Hash: crypto.createHash('sha256').update(buffer).digest('hex'),
    };
  };

  documentStorage.openReadStream = (storageKey) => {
    const buffer = storedBlobs.get(storageKey);
    return Readable.from([buffer ? buffer : Buffer.alloc(0)]);
  };

  documentStorage.removeBlob = async (storageKey) => {
    storedBlobs.delete(storageKey);
  };

  fiscalYearRepository.findById = async () => fiscalYear;
  departmentRepository.findById = async () => department;

  documentRepository.findVersionByHash = async () => null;
  documentRepository.createActivity = async () => {
    calls.createActivity++;
  };
  documentRepository.updateVersion = async (id, data) => ({
    ...currentVersion,
    id,
    ...data,
  });
  documentRepository.update = async () => {
    calls.update++;
  };

  documentRepository.createDocumentWithVersion = async (prefix, documentData, versionData) => ({
    ...makeUploadedDocument(),
    documentCode: `${prefix}-0001`,
    title: documentData.title,
    documentType: documentData.documentType,
    fiscalYearId: documentData.fiscalYearId ?? null,
    departmentId: documentData.departmentId ?? null,
    allocationId: documentData.allocationId ?? null,
    uploadedBy: documentData.uploadedBy,
    currentVersion: {
      ...currentVersion,
      originalFileName: versionData.originalFileName,
      storageKey: versionData.storageKey,
      mimeType: versionData.mimeType,
      fileSizeBytes: versionData.fileSizeBytes,
      fileExtension: versionData.fileExtension,
      sha256Hash: versionData.sha256Hash,
      uploadedBy: versionData.uploadedBy,
    },
  });

  documentRepository.findById = async () => {
    const document = makeUploadedDocument();
    document.currentVersion.storageKey = uploadedStorageKey;
    document.currentVersion.blockchainStatus = BLOCKCHAIN_RECORD_STATUS.CONFIRMED;
    document.currentVersion.txHash = '0xanchoredhash';
    document.currentVersion.blockNumber = 7;
    return document;
  };

  blockchainProvider.isConfigured = () => true;
  blockchainProvider.getExplorerTxUrl = () => null;
  blockchainProvider.verify = async () => ({
    exists: true,
    anchoredBy: '0xanchorowner',
    anchoredAt: 1710000000,
    blockNumber: 7,
  });
  blockchainService.anchorUnlessExists = async () => ({
    txHash: '0xanchoredhash',
    blockNumber: 7,
    confirmedAt: new Date('2026-08-05T00:00:00Z'),
    recovered: false,
  });
}

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

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/documents', documentRoutes);
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

async function request(path, { method = 'GET', token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const options = { method, headers };
  if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  } else if (form) {
    options.body = form;
  }
  const res = await fetch(`${baseUrl}${path}`, options);
  const contentType = res.headers.get('content-type') || '';
  let parsedBody = null;
  if (contentType.includes('application/json')) {
    parsedBody = await res.json();
  } else {
    parsedBody = await res.text();
  }
  return { status: res.status, headers: res.headers, body: parsedBody };
}

function makeUploadForm(overrides = {}) {
  const form = new FormData();
  form.append('file', new Blob([PDF_BYTES]), overrides.fileName || 'pr.pdf');
  form.append('title', overrides.title || 'Purchase Request');
  form.append('documentType', overrides.documentType || 'PurchaseRequest');
  if (overrides.extra) {
    for (const [key, value] of Object.entries(overrides.extra)) {
      form.append(key, value);
    }
  }
  return form;
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

async function runDocumentIntegrationTests() {
  console.log('🧪 Starting Document Integration Tests (real routes/controller/service)...\n');

  await startServer();

  try {
    console.log('1. Upload → Verify happy path:');
    await test('uploads a document and verifies it on-chain end-to-end', async () => {
      setupMocks();
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);

      const upload = await request('/api/documents', {
        method: 'POST',
        token: tokenFor(ROLES.ADMINISTRATOR),
        form: makeUploadForm({
          title: 'Lab Purchase Request',
          extra: { fiscalYearId: 'fy-2026', departmentId: 'dept-1' },
        }),
      });

      assert.equal(upload.status, 201);
      assert.equal(upload.body.success, true);
      const doc = upload.body.data.document;
      assert.equal(doc.documentCode, 'DOC-2026-0001');
      assert.equal(doc.title, 'Lab Purchase Request');
      assert.equal(doc.fiscalYearId, 'fy-2026');
      assert.equal(doc.departmentId, 'dept-1');
      assert.equal(doc.currentVersion.blockchainStatus, BLOCKCHAIN_RECORD_STATUS.CONFIRMED);
      assert.equal(doc.currentVersion.txHash, '0xanchoredhash');

      userRepository.findById = async () => makeUser(ROLES.AUDITOR);

      const verify = await request(`/api/documents/${VALID_UUID}/verify`, {
        token: tokenFor(ROLES.AUDITOR),
      });

      assert.equal(verify.status, 200);
      assert.equal(verify.body.success, true);
      assert.equal(verify.body.data.verified, true);
      assert.equal(verify.body.data.integrityOk, true);
      assert.equal(verify.body.data.onChain.exists, true);
      assert.equal(verify.body.data.documentCode, 'DOC-2026-0001');
      assert.equal(calls.createActivity, 2, 'one UPLOAD activity and one VERIFY activity expected');
    });

    console.log('\n2. Ownership RBAC at the service layer:');
    await test('rejects a Treasurer updating a document they did not upload with 403', async () => {
      setupMocks();
      userRepository.findById = async () => makeUser(ROLES.TREASURER);

      const res = await request(`/api/documents/${VALID_UUID}`, {
        method: 'PUT',
        token: tokenFor(ROLES.TREASURER),
        body: { title: 'Unapproved Edit' },
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /only modify documents you uploaded/i);
      assert.equal(calls.update, 0, 'update should never reach the repository for a non-owner');
    });
  } finally {
    await stopServer();
  }

  console.log(`\n✨ Document Integration Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runDocumentIntegrationTests().catch((err) => {
  console.error('❌ Document Integration test failed:', err);
  process.exit(1);
});
