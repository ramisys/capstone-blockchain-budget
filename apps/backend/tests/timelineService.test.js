import assert from 'node:assert/strict';
import { timelineService } from '../services/timelineService.js';
import { allocationApprovalRepository } from '../repositories/allocationApprovalRepository.js';
import { documentRepository } from '../repositories/documentRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { TIMELINE_KINDS } from '../constants/timelineKinds.js';
import { disableAuditPersistence } from './auditTestConfig.js';

disableAuditPersistence();

function approval(overrides = {}) {
  return {
    id: 'approval-1',
    allocationId: 'alloc-1',
    action: 'Approved',
    comment: 'Looks good',
    actorId: 'user-1',
    createdAt: new Date('2026-08-01T08:00:00.000Z'),
    actor: { id: 'user-1', fullName: 'Admin User', email: 'admin@university.edu', role: 'Administrator' },
    allocation: {
      id: 'alloc-1',
      allocationCode: 'ALC-2026-0001',
      status: 'Approved',
      allocatedAmount: 50000,
      department: { id: 'dept-1', name: 'Research' },
    },
    ...overrides,
  };
}

function documentActivity(overrides = {}) {
  return {
    id: 'activity-1',
    documentId: 'doc-1',
    versionId: 'doc-version-1',
    actorId: 'user-2',
    action: 'UPLOAD',
    details: { fileSizeBytes: 2048 },
    createdAt: new Date('2026-08-02T08:00:00.000Z'),
    actor: { id: 'user-2', fullName: 'Budget Officer', email: 'budgetofficer@university.edu', role: 'BudgetOfficer' },
    document: { id: 'doc-1', documentCode: 'DOC-2026-0001', title: 'Research Proposal' },
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

function blockchainRecord(overrides = {}) {
  return {
    id: 'alloc-record-1',
    allocationId: 'alloc-1',
    allocationCode: 'ALC-2026-0001',
    contentHash: '0a'.repeat(32),
    txHash: '0xtxalloc',
    blockNumber: 10n,
    network: 'hardhat',
    status: 'Confirmed',
    confirmedAt: new Date('2026-08-04T08:00:00.000Z'),
    supersededAt: null,
    createdBy: 'user-1',
    createdAt: new Date('2026-08-04T08:00:00.000Z'),
    updatedAt: new Date('2026-08-04T08:00:00.000Z'),
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

const originalMethods = {
  approvalFindTimeline: allocationApprovalRepository.findTimeline,
  docFindRecentActivities: documentRepository.findRecentActivities,
  auditFindMany: auditLogRepository.findMany,
  blockFindMany: blockchainRepository.findMany,
};

function resetMocks() {
  allocationApprovalRepository.findTimeline = originalMethods.approvalFindTimeline;
  documentRepository.findRecentActivities = originalMethods.docFindRecentActivities;
  auditLogRepository.findMany = originalMethods.auditFindMany;
  blockchainRepository.findMany = originalMethods.blockFindMany;
}

async function runTimelineServiceTests() {
  console.log('🧪 Starting Timeline Service Unit Tests...\n');
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

  console.log('1. getTimeline — Union & Sorting:');
  await test('should merge approval, document, audit, and blockchain sources newest first', async () => {
    allocationApprovalRepository.findTimeline = async () => [approval()];
    documentRepository.findRecentActivities = async () => [documentActivity()];
    auditLogRepository.findMany = async () => [auditLog()];
    blockchainRepository.findMany = async () => [blockchainRecord()];

    const result = await timelineService.getTimeline({}, { page: 1, limit: 20 }, {});

    assert.equal(result.timeline.length, 4);
    assert.deepEqual(result.pagination, { total: 4, page: 1, limit: 20, totalPages: 1 });
    // Newest first: blockchain (Aug 4) > audit (Aug 3) > document (Aug 2) > approval (Aug 1)
    assert.deepEqual(
      result.timeline.map((t) => t.kind),
      [
        TIMELINE_KINDS.BLOCKCHAIN_RECORD,
        TIMELINE_KINDS.AUDIT_LOG,
        TIMELINE_KINDS.DOCUMENT_ACTIVITY,
        TIMELINE_KINDS.ALLOCATION_APPROVAL,
      ]
    );
  });

  await test('should normalize each entry to the common timeline shape', async () => {
    allocationApprovalRepository.findTimeline = async () => [approval()];
    documentRepository.findRecentActivities = async () => [documentActivity()];
    auditLogRepository.findMany = async () => [auditLog()];
    blockchainRepository.findMany = async () => [blockchainRecord()];

    const result = await timelineService.getTimeline({}, { page: 1, limit: 20 }, {});
    const [blockchain, audit, doc, approvalEntry] = result.timeline;

    assert.equal(blockchain.kind, 'BlockchainRecord');
    assert.equal(blockchain.label, 'Anchor confirmed');
    assert.equal(blockchain.resourceCode, 'ALC-2026-0001');
    assert.equal(blockchain.details.blockNumber, 10);
    assert.equal(blockchain.actor, null);

    assert.equal(audit.kind, 'AuditLog');
    assert.equal(audit.action, 'ALLOCATION_APPROVE');
    assert.equal(audit.actor.name, 'Admin User');
    assert.equal(audit.actor.role, 'Administrator');
    assert.equal(audit.details.result, 'Success');

    assert.equal(doc.kind, 'DocumentActivity');
    assert.equal(doc.label, 'Document uploaded');
    assert.equal(doc.description, '"Research Proposal" (DOC-2026-0001)');
    assert.equal(doc.actor.email, 'budgetofficer@university.edu');
    assert.equal(doc.resourceCode, 'DOC-2026-0001');

    assert.equal(approvalEntry.kind, 'AllocationApproval');
    assert.equal(approvalEntry.label, 'Allocation approved');
    assert.equal(approvalEntry.description, 'ALC-2026-0001 · Research was approved.');
    assert.equal(approvalEntry.details.comment, 'Looks good');
    assert.equal(approvalEntry.details.allocatedAmount, 50000);
  });

  await test('should load only the requested kind source', async () => {
    allocationApprovalRepository.findTimeline = async () => {
      throw new Error('approval source should not load');
    };
    documentRepository.findRecentActivities = async () => [documentActivity()];
    auditLogRepository.findMany = async () => {
      throw new Error('audit source should not load');
    };
    blockchainRepository.findMany = async () => {
      throw new Error('blockchain source should not load');
    };

    const result = await timelineService.getTimeline(
      { kind: TIMELINE_KINDS.DOCUMENT_ACTIVITY },
      { page: 1, limit: 20 },
      {}
    );

    assert.equal(result.timeline.length, 1);
    assert.equal(result.timeline[0].kind, TIMELINE_KINDS.DOCUMENT_ACTIVITY);
  });

  await test('should pass shared date filters to every source', async () => {
    let approvalFilters;
    let docFilters;
    let auditFilters;
    let blockFilters;

    allocationApprovalRepository.findTimeline = async (filters) => {
      approvalFilters = filters;
      return [approval()];
    };
    documentRepository.findRecentActivities = async (filters) => {
      docFilters = filters;
      return [documentActivity()];
    };
    auditLogRepository.findMany = async (filters) => {
      auditFilters = filters;
      return [auditLog()];
    };
    blockchainRepository.findMany = async (filters) => {
      blockFilters = filters;
      return [blockchainRecord()];
    };

    await timelineService.getTimeline(
      { dateFrom: '2026-08-01', dateTo: '2026-08-04' },
      { page: 1, limit: 20 },
      {}
    );

    const expected = { dateFrom: '2026-08-01', dateTo: '2026-08-04' };
    assert.deepEqual(approvalFilters, expected);
    assert.deepEqual(docFilters, expected);
    assert.deepEqual(auditFilters, expected);
    assert.deepEqual(blockFilters, expected);
  });

  await test('should paginate the merged result in memory', async () => {
    const approvals = [1, 2, 3, 4, 5].map((n) =>
      approval({ id: `approval-${n}`, createdAt: new Date(2026, 7, n) })
    );
    const docs = [1, 2, 3, 4, 5].map((n) =>
      documentActivity({ id: `activity-${n}`, createdAt: new Date(2026, 7, n) })
    );
    allocationApprovalRepository.findTimeline = async () => approvals;
    documentRepository.findRecentActivities = async () => docs;
    auditLogRepository.findMany = async () => [];
    blockchainRepository.findMany = async () => [];

    const result = await timelineService.getTimeline({}, { page: 2, limit: 3 }, {});

    assert.equal(result.pagination.total, 10);
    assert.equal(result.pagination.totalPages, 4);
    assert.equal(result.timeline.length, 3);
  });

  await test('should return an empty list when no source has records', async () => {
    allocationApprovalRepository.findTimeline = async () => [];
    documentRepository.findRecentActivities = async () => [];
    auditLogRepository.findMany = async () => [];
    blockchainRepository.findMany = async () => [];

    const result = await timelineService.getTimeline({}, { page: 1, limit: 20 }, {});

    assert.equal(result.timeline.length, 0);
    assert.deepEqual(result.pagination, { total: 0, page: 1, limit: 20, totalPages: 0 });
  });

  await test('should sort oldest first when sortBy is oldest', async () => {
    allocationApprovalRepository.findTimeline = async () => [approval()];
    documentRepository.findRecentActivities = async () => [documentActivity()];
    auditLogRepository.findMany = async () => [auditLog()];
    blockchainRepository.findMany = async () => [blockchainRecord()];

    const result = await timelineService.getTimeline(
      {},
      { page: 1, limit: 20 },
      { sortBy: 'oldest', sortOrder: 'asc' }
    );

    assert.deepEqual(
      result.timeline.map((t) => t.kind),
      [
        TIMELINE_KINDS.ALLOCATION_APPROVAL,
        TIMELINE_KINDS.DOCUMENT_ACTIVITY,
        TIMELINE_KINDS.AUDIT_LOG,
        TIMELINE_KINDS.BLOCKCHAIN_RECORD,
      ]
    );
  });

  console.log(`\n✨ Timeline Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTimelineServiceTests().catch((err) => {
  console.error('❌ Timeline Service unit test failed:', err);
  process.exit(1);
});
