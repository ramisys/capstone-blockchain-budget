import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { allocationService } from '../services/allocationService.js';
import { allocationRepository } from '../repositories/allocationRepository.js';
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

const repositoryMethods = {
  allocationRepository: {
    findById: allocationRepository.findById,
    duplicateExists: allocationRepository.duplicateExists,
    createWithSequentialCode: allocationRepository.createWithSequentialCode,
    findMany: allocationRepository.findMany,
    count: allocationRepository.count,
    countAll: allocationRepository.countAll,
    aggregateActiveAmount: allocationRepository.aggregateActiveAmount,
    countByStatus: allocationRepository.countByStatus,
    distinctFiscalYearIds: allocationRepository.distinctFiscalYearIds,
    sumFiscalYearBudgets: allocationRepository.sumFiscalYearBudgets,
    aggregateAmount: allocationRepository.aggregateAmount,
    update: allocationRepository.update,
    softDelete: allocationRepository.softDelete,
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

const fiscalYear = {
  id: 'fy-2026',
  code: 'FY-2026',
  description: 'Fiscal Year 2026',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-12-31'),
  status: FISCAL_YEAR_STATUS.ACTIVE,
  isActive: true,
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
}

async function runAllocationServiceTests() {
  console.log('🧪 Starting Allocation Service Unit Tests...\n');
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

  console.log('\n7. getAllocationStatistics Tests:');
  await test('should compute statistics scoped to a fiscal year', async () => {
    fiscalYearRepository.findById = async () => fiscalYear;
    allocationRepository.countAll = async () => 5;
    allocationRepository.aggregateActiveAmount = async () => ({
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

  console.log(`\n✨ Allocation Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllocationServiceTests().catch((err) => {
  console.error('❌ Allocation Service unit test failed:', err);
  process.exit(1);
});
