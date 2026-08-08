import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { allocationService } from '../services/allocationService.js';
import { allocationRepository } from '../repositories/allocationRepository.js';
import { allocationApprovalRepository } from '../repositories/allocationApprovalRepository.js';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { blockchainService } from '../services/blockchainService.js';
import { blockchainProvider } from '../config/blockchain.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { fundSourceRepository } from '../repositories/fundSourceRepository.js';
import { budgetCategoryRepository } from '../repositories/budgetCategoryRepository.js';
import { budgetProgramRepository } from '../repositories/budgetProgramRepository.js';
import prisma from '../models/prismaClient.js';
import { AppError } from '../errors/appError.js';
import { ForbiddenError, ValidationError } from '../errors/apiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { FISCAL_YEAR_STATUS } from '../constants/fiscalYearStatus.js';
import { USER_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { ALLOCATION_STATUS } from '../constants/allocationStatus.js';
import { disableAuditPersistence } from './auditTestConfig.js';

disableAuditPersistence();

const repositoryMethods = {
  allocationRepository: {
    findById: allocationRepository.findById,
    duplicateExists: allocationRepository.duplicateExists,
    createWithSequentialCode: allocationRepository.createWithSequentialCode,
    findMany: allocationRepository.findMany,
    count: allocationRepository.count,
    countAll: allocationRepository.countAll,
    aggregateApprovedAmount: allocationRepository.aggregateApprovedAmount,
    countByStatus: allocationRepository.countByStatus,
    distinctFiscalYearIds: allocationRepository.distinctFiscalYearIds,
    sumFiscalYearBudgets: allocationRepository.sumFiscalYearBudgets,
    aggregateAmount: allocationRepository.aggregateAmount,
    groupByDimension: allocationRepository.groupByDimension,
    findDimensionLabels: allocationRepository.findDimensionLabels,
    update: allocationRepository.update,
    softDelete: allocationRepository.softDelete,
  },
  allocationApprovalRepository: {
    create: allocationApprovalRepository.create,
    findManyByAllocationId: allocationApprovalRepository.findManyByAllocationId,
  },
  blockchainRepository: {
    findByContentHash: blockchainRepository.findByContentHash,
    createCurrent: blockchainRepository.createCurrent,
  },
  blockchainService: {
    recordAllocation: blockchainService.recordAllocation,
  },
  blockchainProvider: {
    isConfigured: blockchainProvider.isConfigured,
  },
  fiscalYearRepository: { findById: fiscalYearRepository.findById },
  departmentRepository: { findById: departmentRepository.findById },
  fundSourceRepository: { findById: fundSourceRepository.findById },
  budgetCategoryRepository: { findById: budgetCategoryRepository.findById },
  budgetProgramRepository: { findById: budgetProgramRepository.findById },
  prisma: { transaction: prisma.$transaction },
};

function resetMocks() {
  for (const [ownerName, methods] of Object.entries(repositoryMethods)) {
    for (const [method, original] of Object.entries(methods)) {
      const owner =
        ownerName === 'prisma'
          ? prisma
          : ownerName === 'allocationRepository'
            ? allocationRepository
            : ownerName === 'allocationApprovalRepository'
              ? allocationApprovalRepository
              : ownerName === 'blockchainRepository'
                ? blockchainRepository
                    : ownerName === 'blockchainService'
                      ? blockchainService
                      : ownerName === 'blockchainProvider'
                        ? blockchainProvider
                        : ownerName === 'fiscalYearRepository'
                    ? fiscalYearRepository
                    : ownerName === 'departmentRepository'
                      ? departmentRepository
                      : ownerName === 'fundSourceRepository'
                        ? fundSourceRepository
                        : ownerName === 'budgetCategoryRepository'
                          ? budgetCategoryRepository
                          : budgetProgramRepository;
      owner[method] = original;
    }
  }
}

/**
 * Default blockchain mocks so the recordAllocation hook inside the allocation
 * lifecycle never touches a real database in unit tests. Individual tests can
 * override these or spy on blockchainService.recordAllocation.
 */
function mockDefaultBlockchain() {
  blockchainRepository.findByContentHash = async () => null;
  blockchainRepository.createCurrent = async (data) => ({ ...data, id: 'record-mock' });
  blockchainService.recordAllocation = async (allocation) => ({
    id: 'record-mock',
    allocationId: allocation.id,
    status: 'Pending',
  });
}

const fiscalYear = {
  id: 'fy-2026',
  code: 'FY-2026',
  description: 'Fiscal Year 2026',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-12-31'),
  status: FISCAL_YEAR_STATUS.ACTIVE,
  isActive: true,
  budgetAmount: new Prisma.Decimal('500000.00'),
};

const department = {
  id: 'dept-1',
  code: 'DEPT-1',
  name: 'Engineering',
  status: USER_STATUS.ACTIVE,
};

const fundSource = {
  id: 'fund-1',
  code: 'FS-1',
  name: 'General Fund',
  status: USER_STATUS.ACTIVE,
};

const category = {
  id: 'cat-1',
  code: 'CAT-1',
  name: 'Operating Expenses',
  status: USER_STATUS.ACTIVE,
};

const program = {
  id: 'prog-1',
  code: 'PROG-1',
  name: 'Infrastructure',
  departmentId: 'dept-1',
  budgetCategoryId: 'cat-1',
  status: USER_STATUS.ACTIVE,
};

const createPayload = {
  fiscalYearId: fiscalYear.id,
  departmentId: department.id,
  fundSourceId: fundSource.id,
  categoryId: category.id,
  programId: program.id,
  allocatedAmount: 150000,
  description: 'Campus infrastructure allocation',
};

const draftAllocation = {
  id: 'alloc-1',
  allocationCode: 'BA-2026-001',
  fiscalYearId: fiscalYear.id,
  departmentId: department.id,
  fundSourceId: fundSource.id,
  categoryId: category.id,
  programId: program.id,
  allocatedAmount: new Prisma.Decimal('150000.00'),
  description: 'Campus infrastructure allocation',
  status: ALLOCATION_STATUS.DRAFT,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const approvedAllocation = { ...draftAllocation, id: 'alloc-2', status: ALLOCATION_STATUS.APPROVED };
const deletedAllocation = { ...draftAllocation, id: 'alloc-3', deletedAt: new Date() };

function mockAllReferences(overrides = {}) {
  fiscalYearRepository.findById = async () => ('fiscalYear' in overrides ? overrides.fiscalYear : fiscalYear);
  departmentRepository.findById = async () => ('department' in overrides ? overrides.department : department);
  fundSourceRepository.findById = async () => ('fundSource' in overrides ? overrides.fundSource : fundSource);
  budgetCategoryRepository.findById = async () => ('category' in overrides ? overrides.category : category);
  budgetProgramRepository.findById = async () => ('program' in overrides ? overrides.program : program);
  allocationRepository.aggregateApprovedAmount = async () => ({
    _sum: { allocatedAmount: new Prisma.Decimal('0') },
  });
}

async function runAllocationServiceTests() {
  console.log('🧪 Starting Allocation Service Unit Tests...\n');
  let passedTests = 0;
  let totalTests = 0;

  const test = async (name, testFn) => {
    totalTests++;
    resetMocks();
    mockDefaultBlockchain();
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

  console.log('1. createAllocation Tests:');
  await test('should create a Draft allocation with a generated code and creator', async () => {
    mockAllReferences();
    allocationRepository.duplicateExists = async () => false;
    let capturedArgs = null;
    allocationRepository.createWithSequentialCode = async (prefix, fiscalYearId, data) => {
      capturedArgs = { prefix, fiscalYearId, data };
      return {
        ...draftAllocation,
        ...data,
        allocatedAmount: new Prisma.Decimal(String(data.allocatedAmount)),
      };
    };

    const result = await allocationService.createAllocation(createPayload, 'user-1');

    assert.equal(capturedArgs.prefix, 'BA-2026');
    assert.equal(capturedArgs.fiscalYearId, fiscalYear.id);
    assert.equal(capturedArgs.data.status, ALLOCATION_STATUS.DRAFT);
    assert.equal(capturedArgs.data.createdBy, 'user-1');
    assert.equal(result.allocatedAmount, 150000);
  });

  await test('should not anchor a draft allocation on the blockchain ledger', async () => {
    mockAllReferences();
    allocationRepository.duplicateExists = async () => false;
    allocationRepository.createWithSequentialCode = async (prefix, fiscalYearId, data) => ({
      ...draftAllocation,
      ...data,
      allocatedAmount: new Prisma.Decimal(String(data.allocatedAmount)),
    });
    let recorded = null;
    blockchainService.recordAllocation = async (allocation, userId) => {
      recorded = { allocation, userId };
      return { id: 'record-mock', allocationId: allocation.id };
    };

    const result = await allocationService.createAllocation(createPayload, 'user-1');

    assert.equal(result.status, ALLOCATION_STATUS.DRAFT);
    assert.equal(recorded, null, 'recordAllocation should NOT be invoked for draft allocations');
  });

  await test('should throw a not found error when the fiscal year does not exist', async () => {
    mockAllReferences({ fiscalYear: null });

    await assert.rejects(
      () => allocationService.createAllocation(createPayload, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND && err.message === 'Fiscal year not found'
    );
  });

  await test('should reject allocations referencing an archived fiscal year', async () => {
    mockAllReferences({ fiscalYear: { ...fiscalYear, status: FISCAL_YEAR_STATUS.ARCHIVED } });

    await assert.rejects(
      () => allocationService.createAllocation(createPayload, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should throw a not found error when the department does not exist', async () => {
    mockAllReferences({ department: null });

    await assert.rejects(
      () => allocationService.createAllocation(createPayload, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND && err.message === 'Department not found'
    );
  });

  await test('should reject inactive fund sources', async () => {
    mockAllReferences({ fundSource: { ...fundSource, status: USER_STATUS.INACTIVE } });

    await assert.rejects(
      () => allocationService.createAllocation(createPayload, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should reject a program that does not belong to the selected department', async () => {
    mockAllReferences({ program: { ...program, departmentId: 'dept-other' } });

    await assert.rejects(
      () => allocationService.createAllocation(createPayload, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.BAD_REQUEST
    );
  });

  await test('should reject a non-positive allocated amount', async () => {
    mockAllReferences();

    await assert.rejects(
      () => allocationService.createAllocation({ ...createPayload, allocatedAmount: 0 }, 'user-1'),
      (err) => err instanceof ValidationError && err.statusCode === HTTP_STATUS.BAD_REQUEST
    );
  });

  await test('should reject duplicate allocations for the same combination', async () => {
    mockAllReferences();
    allocationRepository.duplicateExists = async () => true;

    await assert.rejects(
      () => allocationService.createAllocation(createPayload, 'user-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should reject an allocation that exceeds the fiscal year remaining budget', async () => {
    mockAllReferences();
    allocationRepository.aggregateApprovedAmount = async () => ({
      _sum: { allocatedAmount: new Prisma.Decimal('400000.00') },
    });

    await assert.rejects(
      () => allocationService.createAllocation(createPayload, 'user-1'),
      (err) =>
        err instanceof AppError &&
        err.statusCode === HTTP_STATUS.BAD_REQUEST &&
        err.message === 'Allocated amount exceeds fiscal year remaining budget'
    );
  });

  console.log('\n2. getAllocationById Tests:');
  await test('should return a serialized allocation by ID', async () => {
    allocationRepository.findById = async () => draftAllocation;

    const result = await allocationService.getAllocationById('alloc-1');

    assert.equal(result.id, 'alloc-1');
    assert.equal(result.allocatedAmount, 150000);
  });

  await test('should throw a not found error when the allocation does not exist', async () => {
    allocationRepository.findById = async () => null;

    await assert.rejects(
      () => allocationService.getAllocationById('missing'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('should treat soft-deleted allocations as not found', async () => {
    allocationRepository.findById = async () => deletedAllocation;

    await assert.rejects(
      () => allocationService.getAllocationById('alloc-3'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n3. getAllocations Tests:');
  await test('should return allocations with pagination info', async () => {
    allocationRepository.findMany = async () => [draftAllocation];
    allocationRepository.count = async () => 25;

    const result = await allocationService.getAllocations({}, { page: 2, limit: 10 });

    assert.equal(result.allocations.length, 1);
    assert.equal(result.pagination.total, 25);
    assert.equal(result.pagination.page, 2);
    assert.equal(result.pagination.totalPages, 3);
  });

  await test('should default to page 1 and limit 10', async () => {
    allocationRepository.findMany = async () => [];
    allocationRepository.count = async () => 0;

    const result = await allocationService.getAllocations();

    assert.deepEqual(result.allocations, []);
    assert.equal(result.pagination.page, 1);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 0);
  });

  console.log('\n4. updateAllocation Tests:');
  await test('should update amount and description on a Draft allocation', async () => {
    allocationRepository.findById = async () => draftAllocation;
    let updateDataCaptured = null;
    allocationRepository.update = async (id, data) => {
      updateDataCaptured = { id, data };
      return { ...draftAllocation, ...data, allocatedAmount: new Prisma.Decimal('175000.00') };
    };

    const result = await allocationService.updateAllocation(
      'alloc-1',
      { allocatedAmount: 175000, description: 'Updated' },
      { id: 'user-1', role: ROLES.BUDGET_OFFICER }
    );

    assert.equal(updateDataCaptured.id, 'alloc-1');
    assert.equal(updateDataCaptured.data.allocatedAmount, 175000);
    assert.equal(updateDataCaptured.data.description, 'Updated');
    assert.equal(result.allocatedAmount, 175000);
  });

  await test('should reject editing a non-Draft allocation', async () => {
    allocationRepository.findById = async () => approvedAllocation;

    await assert.rejects(
      () => allocationService.updateAllocation('alloc-2', { description: 'x' }, { id: 'user-1', role: ROLES.ADMINISTRATOR }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should throw a not found error when updating a missing allocation', async () => {
    allocationRepository.findById = async () => null;

    await assert.rejects(
      () => allocationService.updateAllocation('missing', { description: 'x' }, { id: 'user-1', role: ROLES.ADMINISTRATOR }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('should reject an update that creates a duplicate combination', async () => {
    allocationRepository.findById = async () => draftAllocation;
    allocationRepository.duplicateExists = async () => true;
    mockAllReferences();

    await assert.rejects(
      () =>
        allocationService.updateAllocation(
          'alloc-1',
          { departmentId: 'dept-2' },
          { id: 'user-1', role: ROLES.ADMINISTRATOR }
        ),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  console.log('\n5. deleteAllocation Tests:');
  await test('should soft-delete a Draft allocation as a Budget Officer', async () => {
    allocationRepository.findById = async () => draftAllocation;
    let softDeleteCalled = false;
    allocationRepository.softDelete = async () => {
      softDeleteCalled = true;
      return { ...draftAllocation, deletedAt: new Date() };
    };

    const result = await allocationService.deleteAllocation('alloc-1', {
      id: 'user-1',
      role: ROLES.BUDGET_OFFICER,
    });

    assert.equal(softDeleteCalled, true);
    assert.deepEqual(result, { message: 'Allocation deleted successfully' });
  });

  await test('should forbid a Budget Officer from deleting a non-Draft allocation', async () => {
    allocationRepository.findById = async () => approvedAllocation;

    await assert.rejects(
      () => allocationService.deleteAllocation('alloc-2', { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      (err) => err instanceof ForbiddenError && err.statusCode === HTTP_STATUS.FORBIDDEN
    );
  });

  await test('should allow an Administrator to delete an Approved allocation', async () => {
    allocationRepository.findById = async () => approvedAllocation;
    let softDeleteCalled = false;
    allocationRepository.softDelete = async () => {
      softDeleteCalled = true;
      return approvedAllocation;
    };

    const result = await allocationService.deleteAllocation('alloc-2', {
      id: 'admin-1',
      role: ROLES.ADMINISTRATOR,
    });

    assert.equal(softDeleteCalled, true);
    assert.equal(result.message, 'Allocation deleted successfully');
  });

  await test('should reject deleting an Archived allocation', async () => {
    allocationRepository.findById = async () => ({
      ...draftAllocation,
      id: 'alloc-4',
      status: ALLOCATION_STATUS.ARCHIVED,
    });

    await assert.rejects(
      () => allocationService.deleteAllocation('alloc-4', { id: 'admin-1', role: ROLES.ADMINISTRATOR }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  console.log('\n6. transitionStatus Tests:');
  await test('should allow a valid Draft -> PendingApproval transition', async () => {
    allocationRepository.findById = async () => draftAllocation;
    allocationRepository.update = async (id, data) => ({ ...draftAllocation, ...data });

    const result = await allocationService.transitionStatus('alloc-1', ALLOCATION_STATUS.PENDING_APPROVAL, {
      id: 'user-1',
      role: ROLES.BUDGET_OFFICER,
    });

    assert.equal(result.status, ALLOCATION_STATUS.PENDING_APPROVAL);
  });

  await test('should reject an invalid Draft -> Approved transition', async () => {
    allocationRepository.findById = async () => draftAllocation;

    await assert.rejects(
      () => allocationService.transitionStatus('alloc-1', ALLOCATION_STATUS.APPROVED, { id: 'user-1', role: ROLES.BUDGET_OFFICER }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.BAD_REQUEST
    );
  });

  await test('should allow a valid PendingApproval -> Approved transition within remaining budget', async () => {
    const pendingAllocation = {
      ...draftAllocation,
      id: 'alloc-1',
      status: ALLOCATION_STATUS.PENDING_APPROVAL,
    };
    allocationRepository.findById = async () => pendingAllocation;
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.aggregateApprovedAmount = async () => ({
      _sum: { allocatedAmount: new Prisma.Decimal('100000.00') },
    });
    allocationRepository.update = async (id, data) => ({ ...pendingAllocation, ...data });

    const result = await allocationService.transitionStatus(
      'alloc-1',
      ALLOCATION_STATUS.APPROVED,
      { id: 'admin-1', role: ROLES.ADMINISTRATOR }
    );

    assert.equal(result.status, ALLOCATION_STATUS.APPROVED);
  });

  await test('should reject a PendingApproval -> Approved transition exceeding remaining budget', async () => {
    const pendingAllocation = {
      ...draftAllocation,
      id: 'alloc-1',
      status: ALLOCATION_STATUS.PENDING_APPROVAL,
    };
    allocationRepository.findById = async () => pendingAllocation;
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.aggregateApprovedAmount = async () => ({
      _sum: { allocatedAmount: new Prisma.Decimal('400000.00') },
    });

    await assert.rejects(
      () =>
        allocationService.transitionStatus(
          'alloc-1',
          ALLOCATION_STATUS.APPROVED,
          { id: 'admin-1', role: ROLES.ADMINISTRATOR }
        ),
      (err) =>
        err instanceof AppError &&
        err.statusCode === HTTP_STATUS.BAD_REQUEST &&
        err.message === 'Allocated amount exceeds fiscal year remaining budget'
    );
  });

  console.log('\n7. getAllocationStatistics Tests:');
  await test('should compute statistics scoped to a fiscal year', async () => {
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.countAll = async () => 5;
    allocationRepository.aggregateApprovedAmount = async () => ({
      _sum: { allocatedAmount: new Prisma.Decimal('250000.00') },
    });
    allocationRepository.countByStatus = async () => [
      { status: ALLOCATION_STATUS.DRAFT, _count: 2 },
      { status: ALLOCATION_STATUS.PENDING_APPROVAL, _count: 1 },
      { status: ALLOCATION_STATUS.APPROVED, _count: 1 },
      { status: ALLOCATION_STATUS.REJECTED, _count: 1 },
    ];
    allocationRepository.distinctFiscalYearIds = async () => [{ fiscalYearId: fiscalYear.id }];
    allocationRepository.sumFiscalYearBudgets = async () => ({
      _sum: { budgetAmount: new Prisma.Decimal('500000.00') },
    });

    const result = await allocationService.getAllocationStatistics({ fiscalYearId: fiscalYear.id });

    assert.equal(result.totalAllocations, 5);
    assert.equal(result.totalAllocatedAmount, 250000);
    assert.equal(result.remainingBudget, 250000);
    assert.equal(result.draftCount, 2);
    assert.equal(result.pendingApprovalCount, 1);
    assert.equal(result.approvedCount, 1);
    assert.equal(result.rejectedCount, 1);
  });

  console.log('\n7b. getAllocationBreakdown Tests:');
  await test('should group approved allocations by department, sorted by amount', async () => {
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.groupByDimension = async (field, where) => {
      assert.equal(field, 'departmentId');
      assert.equal(where.status, ALLOCATION_STATUS.APPROVED);
      assert.equal(where.deletedAt, null);
      assert.equal(where.fiscalYearId, fiscalYear.id);
      return [
        {
          departmentId: 'dept-1',
          _sum: { allocatedAmount: new Prisma.Decimal('120000.00') },
          _count: 2,
        },
        {
          departmentId: 'dept-2',
          _sum: { allocatedAmount: new Prisma.Decimal('180000.00') },
          _count: 3,
        },
      ];
    };
    allocationRepository.findDimensionLabels = async (model, ids) => {
      assert.equal(model, 'department');
      assert.deepEqual(ids, ['dept-1', 'dept-2']);
      return [
        { id: 'dept-1', code: 'DEPT-1', name: 'Engineering' },
        { id: 'dept-2', code: 'DEPT-2', name: 'Research' },
      ];
    };

    const result = await allocationService.getAllocationBreakdown({
      dimension: 'department',
      fiscalYearId: fiscalYear.id,
    });

    assert.equal(result.dimension, 'department');
    assert.equal(result.totalAmount, 300000);
    assert.equal(result.breakdown.length, 2);
    // Highest amount first
    assert.equal(result.breakdown[0].name, 'Research');
    assert.equal(result.breakdown[0].amount, 180000);
    assert.equal(result.breakdown[0].allocationCount, 3);
    assert.equal(result.breakdown[1].name, 'Engineering');
    assert.equal(result.breakdown[1].amount, 120000);
  });

  await test('should default to the department dimension and group by category on request', async () => {
    let requestedField = null;
    allocationRepository.groupByDimension = async (field) => {
      requestedField = field;
      return [];
    };
    allocationRepository.findDimensionLabels = async () => [];

    const defaulted = await allocationService.getAllocationBreakdown({});
    assert.equal(requestedField, 'departmentId');
    assert.equal(defaulted.dimension, 'department');

    await allocationService.getAllocationBreakdown({ dimension: 'category' });
    assert.equal(requestedField, 'categoryId');
  });

  await test('should label a dimension row with no matching master record as Unknown', async () => {
    allocationRepository.groupByDimension = async () => [
      {
        departmentId: 'dept-missing',
        _sum: { allocatedAmount: new Prisma.Decimal('5000.00') },
        _count: 1,
      },
    ];
    allocationRepository.findDimensionLabels = async () => [];

    const result = await allocationService.getAllocationBreakdown({
      dimension: 'department',
    });

    assert.equal(result.breakdown[0].name, 'Unknown');
    assert.equal(result.breakdown[0].code, null);
    assert.equal(result.breakdown[0].amount, 5000);
  });

  await test('should reject an unsupported breakdown dimension', async () => {
    await assert.rejects(
      () => allocationService.getAllocationBreakdown({ dimension: 'program' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.BAD_REQUEST
    );
  });

  await test('should reject a breakdown for a missing fiscal year', async () => {
    fiscalYearRepository.findById = async () => null;

    await assert.rejects(
      () =>
        allocationService.getAllocationBreakdown({
          dimension: 'department',
          fiscalYearId: 'fy-missing',
        }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n8. getRemainingBudget Tests:');
  await test('should compute remaining budget against the fiscal year ceiling', async () => {
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.sumFiscalYearBudgets = async () => ({
      _sum: { budgetAmount: new Prisma.Decimal('500000.00') },
    });
    allocationRepository.aggregateAmount = async () => ({
      _sum: { allocatedAmount: new Prisma.Decimal('180000.00') },
    });

    const result = await allocationService.getRemainingBudget({ fiscalYearId: fiscalYear.id });

    assert.equal(result.totalBudget, 500000);
    assert.equal(result.totalAllocated, 180000);
    assert.equal(result.remainingBudget, 320000);
  });

  await test('should sum only approved allocations for the allocated amount', async () => {
    fiscalYearRepository.findById = async () => fiscalYear;
    let capturedWhere = null;
    allocationRepository.sumFiscalYearBudgets = async () => ({
      _sum: { budgetAmount: new Prisma.Decimal('500000.00') },
    });
    allocationRepository.aggregateAmount = async (where) => {
      capturedWhere = where;
      return { _sum: { allocatedAmount: new Prisma.Decimal('180000.00') } };
    };

    const result = await allocationService.getRemainingBudget({ fiscalYearId: fiscalYear.id });

    assert.equal(capturedWhere.status, ALLOCATION_STATUS.APPROVED);
    assert.equal(result.remainingBudget, 320000);
  });

  await test('should return zeros when no allocations exist without a fiscal year filter', async () => {
    allocationRepository.distinctFiscalYearIds = async () => [];

    const result = await allocationService.getRemainingBudget({});

    assert.deepEqual(result, { totalBudget: 0, totalAllocated: 0, remainingBudget: 0 });
  });

  await test('should reject remaining budget for an archived fiscal year', async () => {
    fiscalYearRepository.findById = async () => ({ ...fiscalYear, status: FISCAL_YEAR_STATUS.ARCHIVED });

    await assert.rejects(
      () => allocationService.getRemainingBudget({ fiscalYearId: fiscalYear.id }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  console.log('\n9. createWithSequentialCode (code generator) Tests:');

  function mockCodeGenerator(existingCodes, findFirstResult) {
    const rows = existingCodes.map((allocationCode) => ({ allocationCode }));
    prisma.$transaction = async (fn) =>
      fn({
        budgetAllocation: {
          findFirst: async () => findFirstResult,
          findMany: async (args) => {
            const prefixFilter = args.where?.allocationCode?.startsWith;
            return rows.filter((row) => !prefixFilter || row.allocationCode.startsWith(prefixFilter));
          },
          create: async (args) => ({ id: 'new-1', ...args.data }),
        },
      });
  }

  await test('should generate BA-YYYY-001 for a fiscal year with no allocations', async () => {
    mockCodeGenerator([]);

    const result = await allocationRepository.createWithSequentialCode('BA-2026', 'fy-2026', {
      allocatedAmount: 100,
    });

    assert.equal(result.allocationCode, 'BA-2026-001');
  });

  await test('should increment the sequence based on the highest existing code', async () => {
    mockCodeGenerator(['BA-2026-001', 'BA-2026-002', 'BA-2026-009']);

    const result = await allocationRepository.createWithSequentialCode('BA-2026', 'fy-2026', {});

    assert.equal(result.allocationCode, 'BA-2026-010');
  });

  await test('should count soft-deleted allocations so codes are never reused', async () => {
    mockCodeGenerator(['BA-2026-001', 'BA-2026-002']);

    const result = await allocationRepository.createWithSequentialCode('BA-2026', 'fy-2026', {});

    assert.equal(result.allocationCode, 'BA-2026-003');
  });

  await test('should restart numbering per fiscal year', async () => {
    mockCodeGenerator(['BA-2025-003']);

    const result = await allocationRepository.createWithSequentialCode('BA-2026', 'fy-2026', {});

    assert.equal(result.allocationCode, 'BA-2026-001');
  });

  await test('should reject a duplicate combination detected inside the transaction', async () => {
    mockCodeGenerator([], { id: 'existing-1' });

    await assert.rejects(
      () =>
        allocationRepository.createWithSequentialCode(
          'BA-2026',
          'fy-2026',
          { departmentId: 'dept-1' },
          {
            fiscalYearId: 'fy-2026',
            departmentId: 'dept-1',
            fundSourceId: 'fund-1',
            categoryId: 'cat-1',
            programId: 'prog-1',
          }
        ),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should generate a code when no duplicate exists inside the transaction', async () => {
    mockCodeGenerator(['BA-2026-001'], null);

    const result = await allocationRepository.createWithSequentialCode(
      'BA-2026',
      'fy-2026',
      { departmentId: 'dept-1' },
      {
        fiscalYearId: 'fy-2026',
        departmentId: 'dept-1',
        fundSourceId: 'fund-1',
        categoryId: 'cat-1',
        programId: 'prog-1',
      }
    );

    assert.equal(result.allocationCode, 'BA-2026-002');
  });

  await test('should include fiscalYearId in the create data', async () => {
    let capturedCreateArgs = null;
    prisma.$transaction = async (fn) =>
      fn({
        budgetAllocation: {
          findFirst: async () => null,
          findMany: async () => [],
          create: async (args) => {
            capturedCreateArgs = args;
            return { id: 'new-1', ...args.data };
          },
        },
      });

    const result = await allocationRepository.createWithSequentialCode('BA-2026', 'fy-2026', {
      departmentId: 'dept-1',
      allocatedAmount: 100,
    });

    assert.equal(result.allocationCode, 'BA-2026-001');
    assert.equal(capturedCreateArgs.data.fiscalYearId, 'fy-2026');
  });

  console.log('\n10. Approval Workflow Tests:');

  const pendingAllocation = {
    ...draftAllocation,
    id: 'alloc-1',
    status: ALLOCATION_STATUS.PENDING_APPROVAL,
  };

  const adminActor = { id: 'admin-1', role: ROLES.ADMINISTRATOR, fullName: 'Admin' };
  const treasurerActor = { id: 'treasurer-1', role: ROLES.TREASURER, fullName: 'Treasurer' };
  const officerActor = { id: 'officer-1', role: ROLES.BUDGET_OFFICER, fullName: 'Officer' };

  await test('should submit a Draft allocation for approval and record a Submitted entry', async () => {
    allocationRepository.findById = async () => draftAllocation;
    let createdApproval = null;
    allocationApprovalRepository.create = async (data) => {
      createdApproval = data;
      return { id: 'approval-1', ...data };
    };
    let capturedUpdate = null;
    allocationRepository.update = async (id, data) => {
      capturedUpdate = data;
      return { ...draftAllocation, ...data };
    };

    const result = await allocationService.submitForApproval('alloc-1', officerActor);

    assert.equal(result.status, ALLOCATION_STATUS.PENDING_APPROVAL);
    assert.ok(capturedUpdate.submittedAt);
    assert.equal(capturedUpdate.rejectionReason, null);
    assert.equal(createdApproval.action, 'Submitted');
    assert.equal(createdApproval.actorId, 'officer-1');
    assert.equal(createdApproval.allocationId, 'alloc-1');
  });

  await test('should reject submitting an allocation that is not Draft', async () => {
    allocationRepository.findById = async () => approvedAllocation;

    await assert.rejects(
      () => allocationService.submitForApproval('alloc-2', officerActor),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.BAD_REQUEST
    );
  });

  await test('should approve a PendingApproval allocation within budget and record reviewed fields', async () => {
    allocationRepository.findById = async () => pendingAllocation;
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.aggregateApprovedAmount = async () => ({
      _sum: { allocatedAmount: new Prisma.Decimal('100000.00') },
    });
    let capturedUpdate = null;
    allocationRepository.update = async (id, data) => {
      capturedUpdate = data;
      return { ...pendingAllocation, ...data };
    };
    let createdApproval = null;
    allocationApprovalRepository.create = async (data) => {
      createdApproval = data;
      return { id: 'approval-1', ...data };
    };

    const result = await allocationService.approveAllocation('alloc-1', treasurerActor);

    assert.equal(result.status, ALLOCATION_STATUS.APPROVED);
    assert.equal(capturedUpdate.reviewedBy, 'treasurer-1');
    assert.ok(capturedUpdate.reviewedAt);
    assert.equal(createdApproval.action, 'Approved');
    assert.equal(createdApproval.actorId, 'treasurer-1');
  });

  await test('should anchor an approved allocation on the blockchain ledger', async () => {
    allocationRepository.findById = async () => pendingAllocation;
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.aggregateApprovedAmount = async () => ({
      _sum: { allocatedAmount: new Prisma.Decimal('100000.00') },
    });
    allocationRepository.update = async (id, data) => ({ ...pendingAllocation, ...data });
    allocationApprovalRepository.create = async (data) => ({ id: 'approval-1', ...data });
    let recorded = null;
    blockchainService.recordAllocation = async (allocation, userId) => {
      recorded = { allocation, userId };
      return { id: 'record-mock', allocationId: allocation.id };
    };

    const result = await allocationService.approveAllocation('alloc-1', treasurerActor);

    assert.ok(recorded, 'recordAllocation should have been invoked on approval');
    assert.equal(recorded.allocation.id, result.id);
    assert.equal(recorded.allocation.status, ALLOCATION_STATUS.APPROVED);
    assert.equal(recorded.userId, 'treasurer-1');
  });

  await test('should still approve when the blockchain mirror write fails', async () => {
    allocationRepository.findById = async () => pendingAllocation;
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.aggregateApprovedAmount = async () => ({
      _sum: { allocatedAmount: new Prisma.Decimal('100000.00') },
    });
    allocationRepository.update = async (id, data) => ({ ...pendingAllocation, ...data });
    allocationApprovalRepository.create = async (data) => ({ id: 'approval-1', ...data });
    blockchainService.recordAllocation = repositoryMethods.blockchainService.recordAllocation;
    blockchainProvider.isConfigured = () => false;
    blockchainRepository.createCurrent = async () => {
      throw new Error('db unavailable');
    };

    const result = await allocationService.approveAllocation('alloc-1', treasurerActor);

    assert.equal(result.status, ALLOCATION_STATUS.APPROVED);
    assert.equal(result.id, 'alloc-1');
  });

  await test('should reject self-approval of an allocation', async () => {
    allocationRepository.findById = async () => pendingAllocation;

    await assert.rejects(
      () =>
        allocationService.approveAllocation('alloc-1', {
          id: draftAllocation.createdBy,
          role: ROLES.ADMINISTRATOR,
        }),
      (err) => err instanceof ForbiddenError && err.statusCode === HTTP_STATUS.FORBIDDEN
    );
  });

  await test('should reject approval by a non-approver role', async () => {
    allocationRepository.findById = async () => pendingAllocation;

    await assert.rejects(
      () => allocationService.approveAllocation('alloc-1', officerActor),
      (err) => err instanceof ForbiddenError && err.statusCode === HTTP_STATUS.FORBIDDEN
    );
  });

  await test('should reject approval that exceeds the fiscal year remaining budget', async () => {
    allocationRepository.findById = async () => pendingAllocation;
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.aggregateApprovedAmount = async () => ({
      _sum: { allocatedAmount: new Prisma.Decimal('400000.00') },
    });

    await assert.rejects(
      () => allocationService.approveAllocation('alloc-1', treasurerActor),
      (err) =>
        err instanceof AppError &&
        err.statusCode === HTTP_STATUS.BAD_REQUEST &&
        err.message === 'Allocated amount exceeds fiscal year remaining budget'
    );
  });

  await test('should reject approving an allocation that is not pending', async () => {
    allocationRepository.findById = async () => draftAllocation;

    await assert.rejects(
      () => allocationService.approveAllocation('alloc-1', adminActor),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.BAD_REQUEST
    );
  });

  await test('should reject a PendingApproval allocation with a reason', async () => {
    allocationRepository.findById = async () => pendingAllocation;
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.aggregateApprovedAmount = async () => ({
      _sum: { allocatedAmount: new Prisma.Decimal('0') },
    });
    let capturedUpdate = null;
    allocationRepository.update = async (id, data) => {
      capturedUpdate = data;
      return { ...pendingAllocation, ...data };
    };
    let createdApproval = null;
    allocationApprovalRepository.create = async (data) => {
      createdApproval = data;
      return { id: 'approval-1', ...data };
    };

    const result = await allocationService.rejectAllocation(
      'alloc-1',
      adminActor,
      'Insufficient justification provided'
    );

    assert.equal(result.status, ALLOCATION_STATUS.REJECTED);
    assert.equal(capturedUpdate.rejectionReason, 'Insufficient justification provided');
    assert.equal(capturedUpdate.reviewedBy, 'admin-1');
    assert.equal(createdApproval.action, 'Rejected');
    assert.equal(createdApproval.comment, 'Insufficient justification provided');
  });

  await test('should require a reason when rejecting', async () => {
    allocationRepository.findById = async () => pendingAllocation;

    await assert.rejects(
      () => allocationService.rejectAllocation('alloc-1', adminActor, ''),
      (err) => err instanceof ValidationError && err.statusCode === HTTP_STATUS.BAD_REQUEST
    );
  });

  await test('should return a PendingApproval allocation to Draft when an approver sends it back', async () => {
    allocationRepository.findById = async () => pendingAllocation;
    allocationRepository.update = async (id, data) => ({ ...pendingAllocation, ...data });
    let createdApproval = null;
    allocationApprovalRepository.create = async (data) => {
      createdApproval = data;
      return { id: 'approval-1', ...data };
    };

    const result = await allocationService.returnToDraft('alloc-1', adminActor, 'Please revise');

    assert.equal(result.status, ALLOCATION_STATUS.DRAFT);
    assert.equal(createdApproval.action, 'Returned');
    assert.equal(createdApproval.comment, 'Please revise');
  });

  await test('should let the creator return a Rejected allocation to Draft for revision', async () => {
    const rejectedAllocation = { ...pendingAllocation, status: ALLOCATION_STATUS.REJECTED };
    allocationRepository.findById = async () => rejectedAllocation;
    allocationRepository.update = async (id, data) => ({ ...rejectedAllocation, ...data });
    let createdApproval = null;
    allocationApprovalRepository.create = async (data) => {
      createdApproval = data;
      return { id: 'approval-1', ...data };
    };

    const creatorActor = { id: draftAllocation.createdBy, role: ROLES.BUDGET_OFFICER };
    const result = await allocationService.returnToDraft('alloc-1', creatorActor);

    assert.equal(result.status, ALLOCATION_STATUS.DRAFT);
    assert.equal(createdApproval.action, 'Returned');
  });

  await test('should reject a Rejected allocation returned by a non-creator Budget Officer', async () => {
    const rejectedAllocation = { ...pendingAllocation, status: ALLOCATION_STATUS.REJECTED };
    allocationRepository.findById = async () => rejectedAllocation;

    await assert.rejects(
      () => allocationService.returnToDraft('alloc-1', officerActor),
      (err) => err instanceof ForbiddenError && err.statusCode === HTTP_STATUS.FORBIDDEN
    );
  });

  await test('should return the recorded approval history for an allocation', async () => {
    allocationRepository.findById = async () => pendingAllocation;
    allocationApprovalRepository.findManyByAllocationId = async () => [
      { id: 'approval-2', action: 'Approved', actor: { id: 'admin-1', fullName: 'Admin' } },
      { id: 'approval-1', action: 'Submitted', actor: { id: 'officer-1', fullName: 'Officer' } },
    ];

    const history = await allocationService.getApprovalHistory('alloc-1');

    assert.equal(history.length, 2);
    assert.equal(history[0].action, 'Approved');
  });

  await test('should reject approval history for a deleted allocation', async () => {
    allocationRepository.findById = async () => deletedAllocation;

    await assert.rejects(
      () => allocationService.getApprovalHistory('alloc-3'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log(`\n✨ Allocation Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllocationServiceTests().catch((err) => {
  console.error('❌ Allocation Service unit test failed:', err);
  process.exit(1);
});
