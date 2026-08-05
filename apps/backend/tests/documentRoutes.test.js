import assert from 'node:assert/strict';
import http from 'node:http';
import { Readable } from 'node:stream';
import express from 'express';
import documentRoutes from '../routes/documentRoutes.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { userRepository } from '../repositories/userRepository.js';
import { documentService } from '../services/documentService.js';
import { signToken } from '../utils/jwt.js';
import { USER_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';

const VALID_UUID = '00000000-0000-4000-8000-000000000000';

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

const originalFindById = userRepository.findById;
const originalServiceMethods = {
  getDocuments: documentService.getDocuments,
  getDocumentById: documentService.getDocumentById,
  uploadDocument: documentService.uploadDocument,
  updateDocument: documentService.updateDocument,
  deleteDocument: documentService.deleteDocument,
  getDownloadFile: documentService.getDownloadFile,
  getPreviewFile: documentService.getPreviewFile,
};

const calls = {
  list: 0,
  get: 0,
  upload: 0,
  update: 0,
  remove: 0,
  download: 0,
  preview: 0,
};

const documentFixture = {
  id: 'doc-1',
  documentCode: 'DOC-2026-0001',
  title: 'Purchase Request',
  documentType: 'PurchaseRequest',
  status: 'Active',
  currentVersion: {
    id: 'ver-1',
    versionNumber: 1,
    originalFileName: 'pr.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 12345,
    blockchainStatus: 'Pending',
  },
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

function stubService() {
  documentService.getDocuments = async () => {
    calls.list++;
    return {
      documents: [documentFixture],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
  };
  documentService.getDocumentById = async () => {
    calls.get++;
    return documentFixture;
  };
  documentService.uploadDocument = async (file, metadata) => {
    calls.upload++;
    return { ...documentFixture, title: metadata.title };
  };
  documentService.updateDocument = async () => {
    calls.update++;
    return documentFixture;
  };
  documentService.deleteDocument = async () => {
    calls.remove++;
    return { message: 'Document archived successfully' };
  };
  documentService.getDownloadFile = async (id) => {
    calls.download++;
    return {
      version: documentFixture.currentVersion,
      stream: Readable.from(['file-bytes']),
      originalFileName: 'pr.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 10,
    };
  };
  documentService.getPreviewFile = async () => {
    calls.preview++;
    return {
      version: documentFixture.currentVersion,
      stream: Readable.from(['preview-bytes']),
      mimeType: 'application/pdf',
    };
  };
}

function resetMocks() {
  for (const key of Object.keys(calls)) {
    calls[key] = 0;
  }
  userRepository.findById = originalFindById;
  for (const [method, original] of Object.entries(originalServiceMethods)) {
    documentService[method] = original;
  }
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

async function runDocumentRouteTests() {
  console.log('🧪 Starting Document Route / RBAC Tests...\n');

  await startServer();

  try {
    console.log('1. Authentication / RBAC:');
    await test('rejects an unauthenticated request with 401', async () => {
      const res = await request('/api/documents');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    await test('rejects an Auditor upload with 403 and never reaches the service', async () => {
      userRepository.findById = async () => makeUser(ROLES.AUDITOR);
      stubService();

      const res = await request('/api/documents', {
        method: 'POST',
        token: tokenFor(ROLES.AUDITOR),
        form: makeUploadForm(),
      });

      assert.equal(res.status, 403);
      assert.equal(calls.upload, 0, 'uploadDocument should never be invoked for an Auditor');
    });

    await test('rejects an Auditor metadata update with 403', async () => {
      userRepository.findById = async () => makeUser(ROLES.AUDITOR);
      stubService();

      const res = await request(`/api/documents/${VALID_UUID}`, {
        method: 'PUT',
        token: tokenFor(ROLES.AUDITOR),
        body: { title: 'x' },
      });

      assert.equal(res.status, 403);
      assert.equal(calls.update, 0);
    });

    await test('rejects an Auditor archive with 403', async () => {
      userRepository.findById = async () => makeUser(ROLES.AUDITOR);
      stubService();

      const res = await request(`/api/documents/${VALID_UUID}`, {
        method: 'DELETE',
        token: tokenFor(ROLES.AUDITOR),
      });

      assert.equal(res.status, 403);
      assert.equal(calls.remove, 0);
    });

    await test('allows an Auditor to read the document list', async () => {
      userRepository.findById = async () => makeUser(ROLES.AUDITOR);
      stubService();

      const res = await request('/api/documents', { token: tokenFor(ROLES.AUDITOR) });

      assert.equal(res.status, 200);
      assert.equal(calls.list, 1);
    });

    await test('rejects a malformed list query with 400', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/documents?limit=0', { token: tokenFor(ROLES.ADMINISTRATOR) });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(calls.list, 0);
    });

    await test('rejects an invalid document id param with 400', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/documents/not-a-uuid', { token: tokenFor(ROLES.ADMINISTRATOR) });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(calls.get, 0);
    });

    console.log('\n2. Authorized happy paths:');
    await test('lists documents for an Administrator', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/documents', { token: tokenFor(ROLES.ADMINISTRATOR) });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(calls.list, 1);
      assert.equal(res.body.data.documents[0].documentCode, 'DOC-2026-0001');
    });

    await test('gets a single document by id', async () => {
      userRepository.findById = async () => makeUser(ROLES.TREASURER);
      stubService();

      const res = await request(`/api/documents/${VALID_UUID}`, { token: tokenFor(ROLES.TREASURER) });

      assert.equal(res.status, 200);
      assert.equal(calls.get, 1);
      assert.equal(res.body.data.document.title, 'Purchase Request');
    });

    await test('uploads a valid multipart document as an Administrator', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/documents', {
        method: 'POST',
        token: tokenFor(ROLES.ADMINISTRATOR),
        form: makeUploadForm({ title: 'Lab PR' }),
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(calls.upload, 1);
      assert.equal(res.body.data.document.title, 'Lab PR');
    });

    await test('rejects an upload with an invalid documentType with 400', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request('/api/documents', {
        method: 'POST',
        token: tokenFor(ROLES.ADMINISTRATOR),
        form: makeUploadForm({ documentType: 'Bogus' }),
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(calls.upload, 0);
    });

    await test('updates document metadata', async () => {
      userRepository.findById = async () => makeUser(ROLES.BUDGET_OFFICER);
      stubService();

      const res = await request(`/api/documents/${VALID_UUID}`, {
        method: 'PUT',
        token: tokenFor(ROLES.BUDGET_OFFICER),
        body: { title: 'Updated' },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(calls.update, 1);
    });

    await test('archives a document', async () => {
      userRepository.findById = async () => makeUser(ROLES.ADMINISTRATOR);
      stubService();

      const res = await request(`/api/documents/${VALID_UUID}`, {
        method: 'DELETE',
        token: tokenFor(ROLES.ADMINISTRATOR),
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(calls.remove, 1);
    });

    console.log('\n3. Download / preview:');
    await test('downloads the current version as an attachment', async () => {
      userRepository.findById = async () => makeUser(ROLES.AUDITOR);
      stubService();

      const res = await request(`/api/documents/${VALID_UUID}/download`, {
        token: tokenFor(ROLES.AUDITOR),
      });

      assert.equal(res.status, 200);
      assert.equal(calls.download, 1);
      assert.equal(res.body, 'file-bytes');
      assert.match(res.headers.get('content-disposition'), /attachment/);
      assert.equal(res.headers.get('content-type'), 'application/pdf');
    });

    await test('previews a PDF inline', async () => {
      userRepository.findById = async () => makeUser(ROLES.BUDGET_OFFICER);
      stubService();

      const res = await request(`/api/documents/${VALID_UUID}/preview`, {
        token: tokenFor(ROLES.BUDGET_OFFICER),
      });

      assert.equal(res.status, 200);
      assert.equal(calls.preview, 1);
      assert.equal(res.body, 'preview-bytes');
      assert.match(res.headers.get('content-disposition'), /inline/);
    });
  } finally {
    await stopServer();
  }

  console.log(`\n✨ Document Route / RBAC Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runDocumentRouteTests().catch((err) => {
  console.error('❌ Document Route unit test failed:', err);
  process.exit(1);
});
