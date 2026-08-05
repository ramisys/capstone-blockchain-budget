import assert from 'node:assert/strict';
import { blockchainHistoryService } from '../services/blockchainHistoryService.js';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { LEDGER_RECORD_TYPES } from '../constants/ledgerTypes.js';
import { disableAuditPersistence } from './auditTestConfig.js';

disableAuditPersistence();

function allocationRecord(overrides = {}) {
  return {
    id: 'alloc-record-1',
    allocationId: 'alloc-1',
    allocationCode: 'ALC-2026-0001',
    contentHash: '0a'.repeat(32),
    txHash: '0xtxalloc',
    blockNumber: 10n,
    network: 'hardhat',
    status: 'Confirmed',
    confirmedAt: new Date('2026-08-01T08:00:00.000Z'),
    supersededAt: null,
    createdBy: 'user-1',
    createdAt: new Date('2026-08-01T08:00:00.000Z'),
    updatedAt: new Date('2026-08-01T08:00:00.000Z'),
    allocation: {
      id: 'alloc-1',
      allocationCode: 'ALC-2026-0001',
      status: 'Approved',
      allocatedAmount: 50000,
      department: { id: 'dept-1', name: 'Research', code: 'RES' },
      fiscalYear: { id: 'fy-1', code: 'FY-2026' },
    },
    ...overrides,
  };
}

function documentVersion(overrides = {}) {
  return {
    id: 'doc-version-1',
    documentId: 'doc-1',
    versionNumber: 1,
    originalFileName: 'proposal.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 2048,
    sha256Hash: 'bb'.repeat(32),
    blockchainStatus: 'Confirmed',
    txHash: '0xtxdoc',
    blockNumber: 11n,
    network: 'hardhat',
    confirmedAt: new Date('2026-08-02T08:00:00.000Z'),
    uploadedBy: 'user-2',
    uploadedAt: new Date('2026-08-02T08:00:00.000Z'),
    createdAt: new Date('2026-08-02T08:00:00.000Z'),
    document: {
      id: 'doc-1',
      documentCode: 'DOC-2026-0001',
      title: 'Research Proposal',
      documentType: 'BudgetProposal',
      status: 'Active',
    },
    ...overrides,
  };
}

function auditLog(overrides = {}) {
  return {
    id: 'audit-log-1',
    action: 'ALLOCATION_APPROVE',
    result: 'Success',
    actorId: 'user-1',
    actorEmail: 'admin@university.edu',
    actorName: 'Admin User',
    actorRole: 'Administrator',
    ip: '127.0.0.1',
    resourceType: 'Allocation',
    resourceId: 'alloc-1',
    resourceCode: 'ALC-2026-0001',
    details: { fromStatus: 'PendingApproval', toStatus: 'Approved' },
    eventHash: 'cc'.repeat(32),
    anchorStatus: 'Confirmed',
    txHash: '0xtxaudit',
    blockNumber: 12n,
    network: 'hardhat',
    confirmedAt: new Date('2026-08-03T08:00:00.000Z'),
    createdAt: new Date('2026-08-03T08:00:00.000Z'),
    ...overrides,
  };
}

const originalMethods = {
  blockFindMany: blockchainRepository.findMany,
  blockFindById: blockchainRepository.findById,
  docFindAnchors: documentRepository.findVersionAnchors,
  docFindVersionById: documentRepository.findVersionById,
  auditFindMany: auditLogRepository.findMany,
  auditFindById: auditLogRepository.findById,
};

function resetMocks() {
  blockchainRepository.findMany = originalMethods.blockFindMany;
  blockchainRepository.findById = originalMethods.blockFindById;
  documentRepository.findVersionAnchors = originalMethods.docFindAnchors;
  documentRepository.findVersionById = originalMethods.docFindVersionById;
  auditLogRepository.findMany = originalMethods.auditFindMany;
  auditLogRepository.findById = originalMethods.auditFindById;
}

async function runBlockchainHistoryServiceTests() {
  console.log('🧪 Starting Blockchain History Service Unit Tests...\n');
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

  console.log('1. getHistory — Union & Filtering:');
  await test('should merge allocation, document, and audit sources sorted newest first', async () => {
    blockchainRepository.findMany = async () => [allocationRecord()];
    documentRepository.findVersionAnchors = async () => [documentVersion()];
    auditLogRepository.findMany = async () => [auditLog()];

    const result = await blockchainHistoryService.getHistory({}, { page: 1, limit: 10 }, {});

    assert.equal(result.transactions.length, 3);
    assert.deepEqual(result.pagination, { total: 3, page: 1, limit: 10, totalPages: 1 });
    // Newest first: audit (Aug 3) > document (Aug 2) > allocation (Aug 1)
    assert.deepEqual(
      result.transactions.map((t) => t.recordType),
      [LEDGER_RECORD_TYPES.AUDIT, LEDGER_RECORD_TYPES.DOCUMENT, LEDGER_RECORD_TYPES.ALLOCATION]
    );
    assert.equal(result.transactions[0].code, 'ALC-2026-0001');
    assert.equal(result.transactions[1].code, 'DOC-2026-0001');
    assert.equal(result.transactions[2].code, 'ALC-2026-0001');
  });

  await test('should normalize each entry to the common history shape', async () => {
    blockchainRepository.findMany = async () => [allocationRecord()];
    documentRepository.findVersionAnchors = async () => [documentVersion()];
    auditLogRepository.findMany = async () => [auditLog()];

    const result = await blockchainHistoryService.getHistory({}, { page: 1, limit: 10 }, {});
    const [audit, doc, alloc] = result.transactions;

    assert.equal(alloc.recordType, 'Allocation');
    assert.equal(alloc.code, 'ALC-2026-0001');
    assert.equal(alloc.hash, '0a'.repeat(32));
    assert.equal(alloc.blockNumber, 10);
    assert.equal(alloc.txHash, '0xtxalloc');
    assert.equal(alloc.ref.allocatedAmount, 50000);

    assert.equal(doc.recordType, 'Document');
    assert.equal(doc.code, 'DOC-2026-0001');
    assert.equal(doc.hash, 'bb'.repeat(32));
    assert.equal(doc.versionNumber, 1);
    assert.equal(doc.ref.fileSizeBytes, 2048);

    assert.equal(audit.recordType, 'Audit');
    assert.equal(audit.code, 'ALC-2026-0001');
    assert.equal(audit.hash, 'cc'.repeat(32));
    assert.equal(audit.ref.action, 'ALLOCATION_APPROVE');
    assert.equal(audit.ref.actorEmail, 'admin@university.edu');
  });

  await test('should load only the requested recordType source', async () => {
    blockchainRepository.findMany = async () => {
      throw new Error('allocation source should not load');
    };
    documentRepository.findVersionAnchors = async () => [documentVersion()];
    auditLogRepository.findMany = async () => {
      throw new Error('audit source should not load');
    };

    const result = await blockchainHistoryService.getHistory(
      { recordType: LEDGER_RECORD_TYPES.DOCUMENT },
      { page: 1, limit: 10 },
      {}
    );

    assert.equal(result.transactions.length, 1);
    assert.equal(result.transactions[0].recordType, 'Document');
  });

  await test('should pass shared filters (status, search, dates) to every source', async () => {
    let allocFilters;
    let docFilters;
    let auditFilters;

    blockchainRepository.findMany = async (filters) => {
      allocFilters = filters;
      return [allocationRecord()];
    };
    documentRepository.findVersionAnchors = async (filters) => {
      docFilters = filters;
      return [documentVersion()];
    };
    auditLogRepository.findMany = async (filters) => {
      auditFilters = filters;
      return [auditLog()];
    };

    await blockchainHistoryService.getHistory(
      { search: 'ALC', status: 'Confirmed', dateFrom: '2026-08-01', dateTo: '2026-08-04' },
      { page: 1, limit: 10 },
      {}
    );

    const expected = { search: 'ALC', status: 'Confirmed', dateFrom: '2026-08-01', dateTo: '2026-08-04' };
    assert.deepEqual(allocFilters, expected);
    assert.deepEqual(docFilters, expected);
    assert.deepEqual(auditFilters, { ...expected, hasEventHash: true });
  });

  await test('should paginate the merged result in memory', async () => {
    const allocations = [1, 2, 3, 4, 5].map((n) =>
      allocationRecord({
        id: `alloc-record-${n}`,
        allocationCode: `ALC-2026-000${n}`,
        createdAt: new Date(2026, 7, n),
      })
    );
    const documents = [1, 2, 3, 4, 5].map((n) =>
      documentVersion({
        id: `doc-version-${n}`,
        documentId: `doc-${n}`,
        document: { id: `doc-${n}`, documentCode: `DOC-2026-000${n}`, title: `Doc ${n}`, documentType: 'Other', status: 'Active' },
        createdAt: new Date(2026, 7, n),
      })
    );
    blockchainRepository.findMany = async () => allocations;
    documentRepository.findVersionAnchors = async () => documents;
    auditLogRepository.findMany = async () => [];

    const result = await blockchainHistoryService.getHistory({}, { page: 2, limit: 3 }, {});

    assert.equal(result.pagination.total, 10);
    assert.equal(result.pagination.totalPages, 4);
    assert.equal(result.transactions.length, 3);
  });

  await test('should return an empty list when no source has records', async () => {
    blockchainRepository.findMany = async () => [];
    documentRepository.findVersionAnchors = async () => [];
    auditLogRepository.findMany = async () => [];

    const result = await blockchainHistoryService.getHistory({}, { page: 1, limit: 10 }, {});

    assert.equal(result.transactions.length, 0);
    assert.deepEqual(result.pagination, { total: 0, page: 1, limit: 10, totalPages: 0 });
  });

  await test('should sort oldest first when sortBy is oldest', async () => {
    blockchainRepository.findMany = async () => [allocationRecord()];
    documentRepository.findVersionAnchors = async () => [documentVersion()];
    auditLogRepository.findMany = async () => [auditLog()];

    const result = await blockchainHistoryService.getHistory(
      {},
      { page: 1, limit: 10 },
      { sortBy: 'oldest', sortOrder: 'asc' }
    );

    assert.deepEqual(
      result.transactions.map((t) => t.recordType),
      [LEDGER_RECORD_TYPES.ALLOCATION, LEDGER_RECORD_TYPES.DOCUMENT, LEDGER_RECORD_TYPES.AUDIT]
    );
  });

  console.log('\n2. getTransactionDetail — Type Resolution:');
  await test('should resolve an Allocation transaction', async () => {
    blockchainRepository.findById = async () => allocationRecord();

    const result = await blockchainHistoryService.getTransactionDetail(
      'alloc-record-1',
      LEDGER_RECORD_TYPES.ALLOCATION
    );

    assert.equal(result.recordType, 'Allocation');
    assert.equal(result.blockNumber, 10);
    assert.equal(result.ref.allocatedAmount, 50000);
  });

  await test('should resolve a Document transaction', async () => {
    documentRepository.findVersionById = async () => documentVersion();

    const result = await blockchainHistoryService.getTransactionDetail(
      'doc-version-1',
      LEDGER_RECORD_TYPES.DOCUMENT
    );

    assert.equal(result.recordType, 'Document');
    assert.equal(result.ref.documentCode, 'DOC-2026-0001');
    assert.equal(result.ref.fileSizeBytes, 2048);
  });

  await test('should resolve an Audit transaction', async () => {
    auditLogRepository.findById = async () => auditLog();

    const result = await blockchainHistoryService.getTransactionDetail(
      'audit-log-1',
      LEDGER_RECORD_TYPES.AUDIT
    );

    assert.equal(result.recordType, 'Audit');
    assert.equal(result.ref.action, 'ALLOCATION_APPROVE');
    assert.equal(result.blockNumber, 12);
  });

  await test('should default to Allocation resolution when no recordType is given', async () => {
    blockchainRepository.findById = async () => allocationRecord();

    const result = await blockchainHistoryService.getTransactionDetail('alloc-record-1');

    assert.equal(result.recordType, 'Allocation');
  });

  await test('should throw 404 when the transaction is missing from its source', async () => {
    blockchainRepository.findById = async () => null;

    await assert.rejects(
      () => blockchainHistoryService.getTransactionDetail('missing', LEDGER_RECORD_TYPES.ALLOCATION),
      (err) => err.statusCode === 404
    );
  });

  console.log(`\n✨ Blockchain History Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runBlockchainHistoryServiceTests().catch((err) => {
  console.error('❌ Blockchain History Service unit test failed:', err);
  process.exit(1);
});
