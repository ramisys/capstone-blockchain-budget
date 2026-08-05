import assert from 'node:assert/strict';
import prisma from '../models/prismaClient.js';
import { documentRepository } from '../repositories/documentRepository.js';

const originalTransaction = prisma.$transaction;
const originalFindVersions = prisma.documentVersion.findMany;
const originalFindActivities = prisma.documentActivity.findMany;

let passedTests = 0;
let totalTests = 0;

const test = async (name, testFn) => {
  totalTests++;
  try {
    await testFn();
    console.log(`   - ${name}: ✅ PASSED`);
    passedTests++;
  } catch (err) {
    console.error(`   - ${name}: ❌ FAILED`);
    console.error(`     ${err.stack || err}`);
  }
};

/**
 * Build a fake tx client whose managedDocument.create persists the created
 * document and whose update returns that persisted document with the
 * currentVersionId back-reference applied.
 */
function makeTransactionStub(existingCodes = []) {
  let createdDocument = null;
  const tx = {
    managedDocument: {
      findMany: async (args) => {
        const prefix = args?.where?.documentCode?.startsWith;
        const matched = prefix
          ? existingCodes.filter((code) => code.startsWith(prefix))
          : existingCodes;
        return matched.map((documentCode) => ({ documentCode }));
      },
      create: async (args) => {
        createdDocument = { id: 'doc-1', ...args.data };
        return createdDocument;
      },
      update: async (args) => ({ ...createdDocument, currentVersionId: args.data.currentVersionId }),
    },
    documentVersion: {
      create: async (args) => ({ id: 'ver-1', ...args.data }),
    },
  };
  return tx;
}

/**
 * Run the transaction callback with a fake tx client so code generation and
 * atomic document+version creation can be verified without a database.
 */
function stubTransaction(tx) {
  prisma.$transaction = async (callback) => callback(tx);
}

/**
 * Build a fake tx client for replaceCurrentVersion: version.create persists the
 * created version, managedDocument.update returns the promoted document, and
 * documentVersion.findMany returns the supplied existing version numbers.
 */
function makeReplaceTransactionStub(existingVersionNumbers = []) {
  const created = { version: null, document: null };
  const tx = {
    documentVersion: {
      findMany: async () =>
        existingVersionNumbers
          .slice()
          .sort((a, b) => b - a)
          .map((versionNumber) => ({ versionNumber })),
      create: async (args) => {
        created.version = { id: `ver-${args.data.versionNumber}`, ...args.data };
        return created.version;
      },
    },
    managedDocument: {
      update: async (args) => {
        created.document = {
          id: 'doc-1',
          documentCode: 'DOC-2026-0001',
          currentVersionId: args.data.currentVersionId,
        };
        return created.document;
      },
    },
  };
  return { tx, created };
}

function resetMocks() {
  prisma.$transaction = originalTransaction;
  prisma.documentVersion.findMany = originalFindVersions;
  prisma.documentActivity.findMany = originalFindActivities;
}

async function runRepositoryTests() {
  console.log('🧪 Starting Document Repository Tests...\n');

  console.log('1. createDocumentWithVersion - sequential code generation:');
  await test('generates the next code in sequence for a fiscal-year prefix', async () => {
    stubTransaction(makeTransactionStub(['DOC-2026-0001', 'DOC-2026-0003', 'DOC-2026-0002']));

    const document = await documentRepository.createDocumentWithVersion('DOC-2026', {
      title: 'PR',
      uploadedBy: 'user-1',
    }, {
      originalFileName: 'pr.pdf',
      storageKey: 'key.pdf',
      sha256Hash: 'a'.repeat(64),
    });

    assert.equal(document.documentCode, 'DOC-2026-0004');
    assert.equal(document.currentVersionId, 'ver-1');
  });

  await test('only counts codes sharing the same prefix', async () => {
    stubTransaction(makeTransactionStub(['DOC-2027-0005', 'DOC-0002']));

    const document = await documentRepository.createDocumentWithVersion('DOC-2026', {
      title: 'PR',
    }, {});

    assert.equal(document.documentCode, 'DOC-2026-0001');
  });

  await test('starts a new sequence at 0001 when no codes exist', async () => {
    stubTransaction(makeTransactionStub([]));

    const document = await documentRepository.createDocumentWithVersion('DOC', {
      title: 'PR',
    }, {});

    assert.equal(document.documentCode, 'DOC-0001');
  });

  await test('creates the initial version with versionNumber 1', async () => {
    let createdVersion = null;
    const tx = makeTransactionStub([]);
    tx.documentVersion.create = async (args) => {
      createdVersion = args;
      return { id: 'ver-1', ...args.data };
    };
    stubTransaction(tx);

    await documentRepository.createDocumentWithVersion('DOC', { title: 'PR' }, {
      originalFileName: 'pr.pdf',
      storageKey: 'key.pdf',
    });

    assert.equal(createdVersion.data.versionNumber, 1);
    assert.equal(createdVersion.data.documentId, 'doc-1');
  });

  console.log('\n2. buildWhere - list filters:');
  await test('excludes soft-deleted documents by default', () => {
    const where = documentRepository.buildWhere({});
    assert.deepEqual(where, { deletedAt: null });
  });

  await test('applies equality filters', () => {
    const where = documentRepository.buildWhere({
      fiscalYearId: 'fy-1',
      departmentId: 'dept-1',
      allocationId: 'alloc-1',
      uploadedBy: 'user-1',
      documentType: 'Invoice',
      status: 'Active',
    });
    assert.equal(where.fiscalYearId, 'fy-1');
    assert.equal(where.departmentId, 'dept-1');
    assert.equal(where.allocationId, 'alloc-1');
    assert.equal(where.uploadedBy, 'user-1');
    assert.equal(where.documentType, 'Invoice');
    assert.equal(where.status, 'Active');
  });

  await test('filters by the current version blockchain status', () => {
    const where = documentRepository.buildWhere({ blockchainStatus: 'Confirmed' });
    assert.deepEqual(where.currentVersion, { is: { blockchainStatus: 'Confirmed' } });
  });

  await test('makes dateTo inclusive to the end of the day', () => {
    const where = documentRepository.buildWhere({ dateTo: '2026-08-05' });
    assert.equal(where.createdAt.lte.getFullYear(), 2026);
    assert.equal(where.createdAt.lte.getMonth(), 7);
    assert.equal(where.createdAt.lte.getDate(), 5);
    assert.equal(where.createdAt.lte.getHours(), 23);
    assert.equal(where.createdAt.lte.getMinutes(), 59);
    assert.equal(where.createdAt.lte.getSeconds(), 59);
  });

  await test('builds a fuzzy search across code, title, description, and allocation code', () => {
    const where = documentRepository.buildWhere({ search: 'PR-2026' });
    assert.ok(Array.isArray(where.OR));
    assert.deepEqual(where.OR[0], { documentCode: { contains: 'PR-2026' } });
    assert.deepEqual(where.OR[1], { title: { contains: 'PR-2026' } });
    assert.deepEqual(where.OR[2], { description: { contains: 'PR-2026' } });
    assert.deepEqual(where.OR[3], {
      allocation: { is: { allocationCode: { contains: 'PR-2026' } } },
    });
  });

  console.log('\n3. buildOrderBy - sorting:');
  await test('defaults to newest first', () => {
    assert.deepEqual(documentRepository.buildOrderBy({}), { createdAt: 'desc' });
  });

  await test('maps semantic sort options', () => {
    assert.deepEqual(documentRepository.buildOrderBy({ sortBy: 'newest' }), { createdAt: 'desc' });
    assert.deepEqual(documentRepository.buildOrderBy({ sortBy: 'oldest' }), { createdAt: 'asc' });
    assert.deepEqual(documentRepository.buildOrderBy({ sortBy: 'code', sortOrder: 'desc' }), {
      documentCode: 'desc',
    });
    assert.deepEqual(documentRepository.buildOrderBy({ sortBy: 'title' }), { title: 'asc' });
  });

  console.log('\n4. replaceCurrentVersion - version promotion:');
  await test('creates the next version and promotes it to current', async () => {
    const { tx, created } = makeReplaceTransactionStub([1, 2]);
    stubTransaction(tx);

    const result = await documentRepository.replaceCurrentVersion('doc-1', {
      originalFileName: 'pr-v3.pdf',
      storageKey: 'key-3.pdf',
      sha256Hash: 'c'.repeat(64),
    }, 'Third revision');

    assert.equal(created.version.versionNumber, 3);
    assert.equal(created.version.replaceReason, 'Third revision');
    assert.equal(result.document.currentVersionId, 'ver-3');
    assert.equal(result.version.versionNumber, 3);
  });

  await test('starts at version 1 when a document has no versions yet', async () => {
    const { tx, created } = makeReplaceTransactionStub([]);
    stubTransaction(tx);

    await documentRepository.replaceCurrentVersion('doc-1', {
      originalFileName: 'pr.pdf',
      storageKey: 'key.pdf',
      sha256Hash: 'd'.repeat(64),
    });

    assert.equal(created.version.versionNumber, 1);
  });

  await test('normalizes a missing replace reason to null', async () => {
    const { tx, created } = makeReplaceTransactionStub([1]);
    stubTransaction(tx);

    await documentRepository.replaceCurrentVersion('doc-1', {
      originalFileName: 'pr-v2.pdf',
      storageKey: 'key-2.pdf',
      sha256Hash: 'e'.repeat(64),
    });

    assert.equal(created.version.replaceReason, null);
  });

  console.log('\n5. findVersionsByDocumentId / findActivities:');
  await test('lists versions newest first', async () => {
    const versions = [
      { id: 'ver-3', versionNumber: 3 },
      { id: 'ver-2', versionNumber: 2 },
      { id: 'ver-1', versionNumber: 1 },
    ];
    let where = null;
    let orderBy = null;
    prisma.documentVersion.findMany = async (args) => {
      where = args.where;
      orderBy = args.orderBy;
      return versions;
    };

    const result = await documentRepository.findVersionsByDocumentId('doc-1');

    assert.equal(where.documentId, 'doc-1');
    assert.deepEqual(orderBy, { versionNumber: 'desc' });
    assert.equal(result.length, 3);
    assert.equal(result[0].versionNumber, 3);
  });

  await test('lists activities newest first with actor details', async () => {
    const activities = [{ id: 'act-2' }, { id: 'act-1' }];
    let where = null;
    prisma.documentActivity.findMany = async (args) => {
      where = args.where;
      return activities;
    };

    const result = await documentRepository.findActivities('doc-1');

    assert.equal(where.documentId, 'doc-1');
    assert.equal(result.length, 2);
  });

  console.log(`\n✨ Document Repository Tests Completed: ${passedTests}/${totalTests} Passed!\n`);

  resetMocks();

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runRepositoryTests().catch((err) => {
  console.error('❌ Document Repository test failed:', err);
  process.exit(1);
});
