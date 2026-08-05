import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { documentService } from '../services/documentService.js';
import { documentBlockchainService } from '../services/documentBlockchainService.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { allocationRepository } from '../repositories/allocationRepository.js';
import { documentStorage } from '../services/documentStorageService.js';
import { AppError } from '../errors/appError.js';
import { ForbiddenError, ValidationError } from '../errors/apiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { FISCAL_YEAR_STATUS } from '../constants/fiscalYearStatus.js';
import { USER_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { DOCUMENT_STATUS } from '../constants/documentStatus.js';
import { DOCUMENT_ACTIVITY_ACTIONS } from '../constants/documentActivityActions.js';

const originals = {
  documentRepository: {
    findById: documentRepository.findById,
    findVersionByHash: documentRepository.findVersionByHash,
    createDocumentWithVersion: documentRepository.createDocumentWithVersion,
    replaceCurrentVersion: documentRepository.replaceCurrentVersion,
    findVersionsByDocumentId: documentRepository.findVersionsByDocumentId,
    findActivities: documentRepository.findActivities,
    createActivity: documentRepository.createActivity,
    update: documentRepository.update,
    softDelete: documentRepository.softDelete,
    findVersionByDocumentAndNumber: documentRepository.findVersionByDocumentAndNumber,
  },
  fiscalYearRepository: { findById: fiscalYearRepository.findById },
  departmentRepository: { findById: departmentRepository.findById },
  allocationRepository: { findById: allocationRepository.findById },
  documentStorage: {
    storeStream: documentStorage.storeStream,
    openReadStream: documentStorage.openReadStream,
    removeBlob: documentStorage.removeBlob,
  },
  documentBlockchainService: {
    anchorVersion: documentBlockchainService.anchorVersion,
  },
};

function resetMocks() {
  for (const [ownerName, methods] of Object.entries(originals)) {
    const owner =
      ownerName === 'documentRepository'
        ? documentRepository
        : ownerName === 'fiscalYearRepository'
          ? fiscalYearRepository
          : ownerName === 'departmentRepository'
            ? departmentRepository
            : ownerName === 'allocationRepository'
              ? allocationRepository
              : ownerName === 'documentBlockchainService'
                ? documentBlockchainService
                : documentStorage;
    for (const [method, original] of Object.entries(methods)) {
      owner[method] = original;
    }
  }
  documentBlockchainService.anchorVersion = async (version) => version;
}

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

const allocation = {
  id: 'alloc-1',
  allocationCode: 'ALC-2026-0001',
  deletedAt: null,
};

const currentVersion = {
  id: 'ver-1',
  versionNumber: 1,
  originalFileName: 'invoice.pdf',
  storageKey: 'abc-123.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 12345n,
  fileExtension: 'pdf',
  sha256Hash: 'b'.repeat(64),
  blockchainStatus: 'Pending',
  uploadedBy: 'user-1',
};

function makeDocument(overrides = {}) {
  return {
    id: 'doc-1',
    documentCode: 'DOC-2026-0001',
    title: 'Invoice',
    description: null,
    documentType: 'Invoice',
    fiscalYearId: 'fy-2026',
    departmentId: 'dept-1',
    allocationId: 'alloc-1',
    status: DOCUMENT_STATUS.ACTIVE,
    currentVersionId: 'ver-1',
    uploadedBy: 'user-1',
    archivedBy: null,
    archivedAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    currentVersion,
    ...overrides,
  };
}

const uploadFile = {
  path: path.join(os.tmpdir(), `documentService-inbound-${Date.now()}.pdf`),
  safeName: 'invoice.pdf',
  extension: 'pdf',
  detectedMime: 'application/pdf',
  storageKey: 'server-generated-key.pdf',
};

fs.writeFileSync(uploadFile.path, '%PDF-1.4 test payload');

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

async function runServiceTests() {
  console.log('🧪 Starting Document Service Tests...\n');

  console.log('1. uploadDocument:');
  await test('streams the file, creates document+version, and records activity', async () => {
    let storedKey = null;
    let storedMeta = null;
    fiscalYearRepository.findById = async () => fiscalYear;
    departmentRepository.findById = async () => department;
    allocationRepository.findById = async () => ({ id: 'alloc-1', allocationCode: 'ALC-2026-0001' });
    documentStorage.storeStream = async (stream, storageKey) => {
      stream.resume();
      storedKey = storageKey;
      return { sha256Hash: 'c'.repeat(64), sizeBytes: 12345 };
    };
    documentRepository.findVersionByHash = async () => null;
    documentRepository.createDocumentWithVersion = async (prefix, data, versionData) => {
      storedMeta = { prefix, data, versionData };
      return makeDocument();
    };
    documentRepository.createActivity = async (data) => data;

    const document = await documentService.uploadDocument(uploadFile, {
      title: 'Invoice',
      documentType: 'Invoice',
      fiscalYearId: 'fy-2026',
      departmentId: 'dept-1',
      allocationId: 'alloc-1',
    }, 'user-1');

    assert.equal(storedKey, uploadFile.storageKey);
    assert.equal(storedMeta.prefix, 'DOC-2026');
    assert.equal(storedMeta.data.title, 'Invoice');
    assert.equal(storedMeta.data.uploadedBy, 'user-1');
    assert.equal(storedMeta.versionData.storageKey, uploadFile.storageKey);
    assert.equal(storedMeta.versionData.mimeType, 'application/pdf');
    assert.equal(storedMeta.versionData.versionNumber, undefined);
    assert.equal(storedMeta.versionData.sha256Hash, 'c'.repeat(64));
    assert.equal(document.documentCode, 'DOC-2026-0001');
    assert.equal(document.currentVersion.fileSizeBytes, 12345);
  });

  await test('uses the bare DOC prefix when no fiscal year is linked', async () => {
    documentStorage.storeStream = async (stream) => {
      stream.resume();
      return { sha256Hash: 'd'.repeat(64), sizeBytes: 10 };
    };
    documentRepository.findVersionByHash = async () => null;
    let usedPrefix = null;
    documentRepository.createDocumentWithVersion = async (prefix, data) => {
      usedPrefix = prefix;
      return makeDocument();
    };
    documentRepository.createActivity = async () => ({});

    await documentService.uploadDocument(uploadFile, {
      title: 'Invoice',
      documentType: 'Invoice',
    }, 'user-1');

    assert.equal(usedPrefix, 'DOC');
  });

  await test('rejects a duplicate file by hash and removes the stored blob', async () => {
    let removed = false;
    let created = false;
    documentStorage.storeStream = async (stream) => {
      stream.resume();
      return { sha256Hash: 'e'.repeat(64), sizeBytes: 10 };
    };
    documentStorage.removeBlob = async () => {
      removed = true;
    };
    documentRepository.findVersionByHash = async () => ({ id: 'ver-other', documentId: 'doc-other' });
    documentRepository.createDocumentWithVersion = async () => {
      created = true;
      return makeDocument();
    };

    await assert.rejects(
      () => documentService.uploadDocument(uploadFile, { title: 'Invoice', documentType: 'Invoice' }, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
    assert.equal(removed, true);
    assert.equal(created, false);
  });

  await test('removes the blob when the metadata write fails', async () => {
    let removed = false;
    documentStorage.storeStream = async (stream) => {
      stream.resume();
      return { sha256Hash: 'f'.repeat(64), sizeBytes: 10 };
    };
    documentStorage.removeBlob = async () => {
      removed = true;
    };
    documentRepository.findVersionByHash = async () => null;
    documentRepository.createDocumentWithVersion = async () => {
      throw new Error('db down');
    };

    await assert.rejects(
      () => documentService.uploadDocument(uploadFile, { title: 'Invoice', documentType: 'Invoice' }, 'user-1'),
      /db down/
    );
    assert.equal(removed, true);
  });

  await test('validates references before storing any bytes', async () => {
    let stored = false;
    documentStorage.storeStream = async () => {
      stored = true;
      return { sha256Hash: 'a'.repeat(64), sizeBytes: 10 };
    };
    allocationRepository.findById = async () => null;

    await assert.rejects(
      () => documentService.uploadDocument(uploadFile, {
        title: 'Invoice',
        documentType: 'Invoice',
        allocationId: 'missing-alloc',
      }, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
    assert.equal(stored, false);
  });

  await test('rejects an archived fiscal year reference', async () => {
    fiscalYearRepository.findById = async () => ({
      ...fiscalYear,
      status: FISCAL_YEAR_STATUS.ARCHIVED,
    });

    await assert.rejects(
      () => documentService.uploadDocument(uploadFile, {
        title: 'Invoice',
        documentType: 'Invoice',
        fiscalYearId: 'fy-archived',
      }, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('rejects an inactive department reference', async () => {
    departmentRepository.findById = async () => ({
      ...department,
      status: 'Inactive',
    });

    await assert.rejects(
      () => documentService.uploadDocument(uploadFile, {
        title: 'Invoice',
        documentType: 'Invoice',
        departmentId: 'dept-inactive',
      }, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('rejects a missing upload file', async () => {
    await assert.rejects(
      () => documentService.uploadDocument(null, { title: 'Invoice', documentType: 'Invoice' }, 'user-1'),
      (err) => err instanceof ValidationError
    );
  });

  await test('reflects a Confirmed anchor in the returned document', async () => {
    documentStorage.storeStream = async (stream) => {
      stream.resume();
      return { sha256Hash: 'k'.repeat(64), sizeBytes: 10 };
    };
    documentRepository.findVersionByHash = async () => null;
    documentRepository.createDocumentWithVersion = async () => makeDocument();
    documentRepository.createActivity = async () => ({});
    documentBlockchainService.anchorVersion = async (version) => ({
      ...version,
      blockchainStatus: 'Confirmed',
      txHash: '0xabc',
    });

    const document = await documentService.uploadDocument(
      uploadFile,
      { title: 'Invoice', documentType: 'Invoice' },
      'user-1'
    );

    assert.equal(document.currentVersion.blockchainStatus, 'Confirmed');
    assert.equal(document.currentVersion.txHash, '0xabc');
  });

  await test('does not try to remove the blob when the storage write itself fails', async () => {
    let removed = false;
    documentStorage.storeStream = async (stream) => {
      stream.on('error', () => {});
      stream.resume();
      throw new Error('disk full');
    };
    documentStorage.removeBlob = async () => {
      removed = true;
    };

    await assert.rejects(
      () => documentService.uploadDocument(uploadFile, { title: 'Invoice', documentType: 'Invoice' }, 'user-1'),
      /disk full/
    );
    assert.equal(removed, false);
  });

  console.log('\n2. getDocumentById / getDocuments:');
  await test('returns a serialized document', async () => {
    documentRepository.findById = async () => makeDocument();

    const document = await documentService.getDocumentById('doc-1');
    assert.equal(document.documentCode, 'DOC-2026-0001');
    assert.equal(document.currentVersion.fileSizeBytes, 12345);
  });

  await test('throws 404 for a soft-deleted document', async () => {
    documentRepository.findById = async () => makeDocument({ deletedAt: new Date() });

    await assert.rejects(
      () => documentService.getDocumentById('doc-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('throws 404 when the document does not exist', async () => {
    documentRepository.findById = async () => null;

    await assert.rejects(
      () => documentService.getDocumentById('doc-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('computes pagination from findMany/count', async () => {
    documentRepository.findMany = async () => [makeDocument()];
    documentRepository.count = async () => 25;

    const result = await documentService.getDocuments({}, { page: 3, limit: 10 }, {});
    assert.equal(result.documents.length, 1);
    assert.equal(result.pagination.total, 25);
    assert.equal(result.pagination.page, 3);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 3);
  });

  console.log('\n3. updateDocument:');
  await test('updates metadata and records a METADATA_UPDATE activity', async () => {
    documentRepository.findById = async () => makeDocument();
    let updatedData = null;
    let activity = null;
    documentRepository.update = async (_id, data) => {
      updatedData = data;
      return makeDocument({ title: 'Updated' });
    };
    documentRepository.createActivity = async (data) => {
      activity = data;
      return data;
    };

    await documentService.updateDocument('doc-1', { title: 'Updated' }, { id: 'user-1', role: ROLES.BUDGET_OFFICER });

    assert.deepEqual(updatedData, { title: 'Updated' });
    assert.equal(activity.action, DOCUMENT_ACTIVITY_ACTIONS.METADATA_UPDATE);
    assert.equal(activity.actorId, 'user-1');
  });

  await test('forbids a Budget Officer from editing another user\'s document', async () => {
    documentRepository.findById = async () => makeDocument({ uploadedBy: 'other-user' });

    await assert.rejects(
      () => documentService.updateDocument('doc-1', { title: 'x' }, { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      (err) => err instanceof ForbiddenError
    );
  });

  await test('allows an Administrator to edit any document', async () => {
    documentRepository.findById = async () => makeDocument({ uploadedBy: 'other-user' });
    documentRepository.update = async (_id, data) => makeDocument({ ...data });
    documentRepository.createActivity = async (data) => data;

    await documentService.updateDocument('doc-1', { title: 'x' }, { id: 'admin-1', role: ROLES.ADMINISTRATOR });
  });

  await test('rejects editing an archived document', async () => {
    documentRepository.findById = async () => makeDocument({ status: DOCUMENT_STATUS.ARCHIVED });

    await assert.rejects(
      () => documentService.updateDocument('doc-1', { title: 'x' }, { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('validates references when a link changes', async () => {
    documentRepository.findById = async () => makeDocument({ departmentId: 'dept-1' });
    let referencesChecked = false;
    documentRepository.update = async (_id, data) => makeDocument({ ...data });
    documentRepository.createActivity = async (data) => data;
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.findById = async () => ({ id: 'alloc-1', allocationCode: 'ALC-2026-0001' });
    departmentRepository.findById = async (id) => {
      referencesChecked = true;
      assert.equal(id, 'dept-2');
      return { ...department, id: 'dept-2' };
    };

    await documentService.updateDocument('doc-1', { departmentId: 'dept-2' }, { id: 'user-1', role: ROLES.BUDGET_OFFICER });
    assert.equal(referencesChecked, true);
  });

  await test('unlinks a reference when an empty string is passed', async () => {
    documentRepository.findById = async () => makeDocument({ allocationId: 'alloc-1' });
    let updatedData = null;
    documentRepository.update = async (_id, data) => {
      updatedData = data;
      return makeDocument();
    };
    documentRepository.createActivity = async (data) => data;
    fiscalYearRepository.findById = async () => fiscalYear;
    departmentRepository.findById = async () => department;
    allocationRepository.findById = async () => ({ id: 'alloc-1', allocationCode: 'ALC-2026-0001' });

    await documentService.updateDocument('doc-1', { allocationId: null }, { id: 'user-1', role: ROLES.BUDGET_OFFICER });
    assert.equal(updatedData.allocationId, null);
  });

  console.log('\n4. deleteDocument:');
  await test('archives and soft-deletes, then records activity', async () => {
    documentRepository.findById = async () => makeDocument();
    let deleted = false;
    let activity = null;
    documentRepository.softDelete = async (id, actorId) => {
      deleted = true;
      assert.equal(actorId, 'admin-1');
      return makeDocument({ status: DOCUMENT_STATUS.ARCHIVED });
    };
    documentRepository.createActivity = async (data) => {
      activity = data;
      return data;
    };

    const result = await documentService.deleteDocument('doc-1', { id: 'admin-1', role: ROLES.ADMINISTRATOR });
    assert.equal(deleted, true);
    assert.equal(activity.action, DOCUMENT_ACTIVITY_ACTIONS.ARCHIVE);
    assert.equal(result.message, 'Document archived successfully');
  });

  await test('allows an Administrator to archive another user\'s document', async () => {
    documentRepository.findById = async () => makeDocument({ uploadedBy: 'other-user' });
    documentRepository.softDelete = async () => makeDocument();
    documentRepository.createActivity = async (data) => data;

    await documentService.deleteDocument('doc-1', { id: 'admin-1', role: ROLES.ADMINISTRATOR });
  });

  await test('forbids a Budget Officer from archiving another user\'s document', async () => {
    documentRepository.findById = async () => makeDocument({ uploadedBy: 'other-user' });

    await assert.rejects(
      () => documentService.deleteDocument('doc-1', { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      (err) => err instanceof ForbiddenError
    );
  });

  await test('rejects archiving an already-archived document', async () => {
    documentRepository.findById = async () => makeDocument({ status: DOCUMENT_STATUS.ARCHIVED });

    await assert.rejects(
      () => documentService.deleteDocument('doc-1', { id: 'admin-1', role: ROLES.ADMINISTRATOR }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  console.log('\n5. download / preview:');
  await test('opens the current version for download', async () => {
    documentRepository.findById = async () => makeDocument();
    let openedKey = null;
    documentStorage.openReadStream = async (storageKey) => {
      openedKey = storageKey;
      return { pipe: () => {} };
    };

    const result = await documentService.getDownloadFile('doc-1');
    assert.equal(openedKey, currentVersion.storageKey);
    assert.equal(result.originalFileName, 'invoice.pdf');
    assert.equal(result.mimeType, 'application/pdf');
    assert.equal(result.fileSizeBytes, 12345);
  });

  await test('resolves a specific version by number', async () => {
    documentRepository.findById = async () => makeDocument();
    const v2 = { ...currentVersion, id: 'ver-2', versionNumber: 2, storageKey: 'v2.pdf' };
    documentRepository.findVersionByDocumentAndNumber = async (documentId, versionNumber) => {
      assert.equal(documentId, 'doc-1');
      assert.equal(versionNumber, 2);
      return v2;
    };
    let openedKey = null;
    documentStorage.openReadStream = async (storageKey) => {
      openedKey = storageKey;
      return { pipe: () => {} };
    };

    const result = await documentService.getDownloadFile('doc-1', 2);
    assert.equal(openedKey, 'v2.pdf');
    assert.equal(result.version.id, 'ver-2');
  });

  await test('throws 404 when the requested version does not exist', async () => {
    documentRepository.findById = async () => makeDocument();
    documentRepository.findVersionByDocumentAndNumber = async () => null;

    await assert.rejects(
      () => documentService.getDownloadFile('doc-1', 99),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('previews a PDF inline', async () => {
    documentRepository.findById = async () => makeDocument();
    documentStorage.openReadStream = async () => ({ pipe: () => {} });

    const result = await documentService.getPreviewFile('doc-1');
    assert.equal(result.mimeType, 'application/pdf');
  });

  await test('rejects previewing a non-previewable type with 415', async () => {
    documentRepository.findById = async () =>
      makeDocument({ currentVersion: { ...currentVersion, mimeType: 'application/msword' } });

    await assert.rejects(
      () => documentService.getPreviewFile('doc-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE
    );
  });

  console.log('\n6. replaceDocument:');
  await test('replaces the current version and records a REPLACE activity', async () => {
    documentRepository.findById = async () => makeDocument();
    let stored = false;
    documentStorage.storeStream = async (stream) => {
      stream.resume();
      stored = true;
      return { sha256Hash: 'g'.repeat(64), sizeBytes: 10 };
    };
    documentRepository.findVersionByHash = async () => null;
    let replaceArgs = null;
    documentRepository.replaceCurrentVersion = async (id, versionData, replaceReason) => {
      replaceArgs = { id, versionData, replaceReason };
      return {
        document: makeDocument({ currentVersionId: 'ver-2' }),
        version: { id: 'ver-2', versionNumber: 2, fileSizeBytes: 10n },
      };
    };
    let activity = null;
    documentRepository.createActivity = async (data) => {
      activity = data;
      return data;
    };

    const result = await documentService.replaceDocument(
      'doc-1',
      uploadFile,
      { replaceReason: 'Corrected amount' },
      { id: 'user-1', role: ROLES.BUDGET_OFFICER }
    );

    assert.equal(stored, true);
    assert.equal(replaceArgs.id, 'doc-1');
    assert.equal(replaceArgs.versionData.uploadedBy, 'user-1');
    assert.equal(replaceArgs.replaceReason, 'Corrected amount');
    assert.equal(result.version.versionNumber, 2);
    assert.equal(result.document.currentVersionId, 'ver-2');
    assert.equal(activity.action, DOCUMENT_ACTIVITY_ACTIONS.REPLACE);
    assert.equal(activity.details.toVersionNumber, 2);
  });

  await test('forbids a Budget Officer from replacing another user\'s document', async () => {
    documentRepository.findById = async () => makeDocument({ uploadedBy: 'other-user' });

    await assert.rejects(
      () => documentService.replaceDocument('doc-1', uploadFile, {}, { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      (err) => err instanceof ForbiddenError
    );
  });

  await test('rejects replacing an archived document', async () => {
    documentRepository.findById = async () => makeDocument({ status: DOCUMENT_STATUS.ARCHIVED });

    await assert.rejects(
      () => documentService.replaceDocument('doc-1', uploadFile, {}, { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('rejects a replacement beyond the version limit before storing bytes', async () => {
    documentRepository.findById = async () =>
      makeDocument({ _count: { versions: 50 } });
    let stored = false;
    documentStorage.storeStream = async (stream) => {
      stream.resume();
      stored = true;
      return { sha256Hash: 'j'.repeat(64), sizeBytes: 10 };
    };

    await assert.rejects(
      () => documentService.replaceDocument('doc-1', uploadFile, {}, { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
    assert.equal(stored, false);
  });

  await test('rejects a byte-identical replacement and removes the stored blob', async () => {
    let removed = false;
    documentRepository.findById = async () => makeDocument();
    documentStorage.storeStream = async (stream) => {
      stream.resume();
      return { sha256Hash: 'h'.repeat(64), sizeBytes: 10 };
    };
    documentStorage.removeBlob = async () => {
      removed = true;
    };
    documentRepository.findVersionByHash = async () => ({ id: 'ver-1', documentId: 'doc-1' });

    await assert.rejects(
      () => documentService.replaceDocument('doc-1', uploadFile, {}, { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
    assert.equal(removed, true);
  });

  await test('removes the stored blob when the version write fails', async () => {
    let removed = false;
    documentRepository.findById = async () => makeDocument();
    documentStorage.storeStream = async (stream) => {
      stream.resume();
      return { sha256Hash: 'i'.repeat(64), sizeBytes: 10 };
    };
    documentStorage.removeBlob = async () => {
      removed = true;
    };
    documentRepository.findVersionByHash = async () => null;
    documentRepository.replaceCurrentVersion = async () => {
      throw new Error('db down');
    };

    await assert.rejects(
      () => documentService.replaceDocument('doc-1', uploadFile, {}, { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      /db down/
    );
    assert.equal(removed, true);
  });

  await test('rejects a missing file', async () => {
    documentRepository.findById = async () => makeDocument();

    await assert.rejects(
      () => documentService.replaceDocument('doc-1', null, {}, { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      (err) => err instanceof ValidationError
    );
  });

  await test('reflects a Confirmed anchor in the returned version', async () => {
    documentRepository.findById = async () => makeDocument();
    documentStorage.storeStream = async (stream) => {
      stream.resume();
      return { sha256Hash: 'l'.repeat(64), sizeBytes: 10 };
    };
    documentRepository.findVersionByHash = async () => null;
    documentRepository.replaceCurrentVersion = async () => ({
      document: makeDocument({ currentVersionId: 'ver-2' }),
      version: { id: 'ver-2', versionNumber: 2, fileSizeBytes: 10n, blockchainStatus: 'Pending' },
    });
    documentRepository.createActivity = async () => ({});
    documentBlockchainService.anchorVersion = async (version) => ({
      ...version,
      blockchainStatus: 'Confirmed',
      txHash: '0xdef',
    });

    const result = await documentService.replaceDocument(
      'doc-1',
      uploadFile,
      {},
      { id: 'user-1', role: ROLES.BUDGET_OFFICER }
    );

    assert.equal(result.version.blockchainStatus, 'Confirmed');
    assert.equal(result.document.currentVersion.blockchainStatus, 'Confirmed');
  });

  console.log('\n7. versions / activities:');
  await test('lists versions with BigInt sizes serialized to numbers', async () => {
    documentRepository.findById = async () => makeDocument();
    documentRepository.findVersionsByDocumentId = async () => [
      { ...currentVersion, versionNumber: 2, fileSizeBytes: 100n },
      currentVersion,
    ];

    const versions = await documentService.getDocumentVersions('doc-1');

    assert.equal(versions.length, 2);
    assert.equal(versions[0].versionNumber, 2);
    assert.equal(versions[0].fileSizeBytes, 100);
  });

  await test('throws 404 when listing versions of a soft-deleted document', async () => {
    documentRepository.findById = async () => makeDocument({ deletedAt: new Date() });

    await assert.rejects(
      () => documentService.getDocumentVersions('doc-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('lists the persisted activity timeline', async () => {
    documentRepository.findById = async () => makeDocument();
    documentRepository.findActivities = async () => [
      { action: 'REPLACE', details: { toVersionNumber: 2 } },
      { action: 'UPLOAD', details: {} },
    ];

    const activities = await documentService.getDocumentActivities('doc-1');

    assert.equal(activities.length, 2);
    assert.equal(activities[0].action, 'REPLACE');
  });

  console.log(`\n✨ Document Service Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runServiceTests().then(() => {
  setTimeout(() => {
    try {
      fs.unlinkSync(uploadFile.path);
    } catch {
      // already gone
    }
  }, 100);
});
