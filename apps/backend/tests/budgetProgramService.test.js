import assert from 'node:assert/strict';
import { budgetProgramService } from '../services/budgetProgramService.js';
import { budgetProgramRepository } from '../repositories/budgetProgramRepository.js';
import prisma from '../models/prismaClient.js';
import { AppError } from '../errors/appError.js';
import { USER_STATUS } from '../constants/status.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const originalRepositoryMethods = {
  findByCode: budgetProgramRepository.findByCode,
  findById: budgetProgramRepository.findById,
  create: budgetProgramRepository.create,
  update: budgetProgramRepository.update,
  delete: budgetProgramRepository.delete,
  findMany: budgetProgramRepository.findMany,
  count: budgetProgramRepository.count,
  codeExists: budgetProgramRepository.codeExists,
};

const originalPrismaMethods = {
  departmentFindUnique: prisma.department.findUnique,
  budgetCategoryFindUnique: prisma.budgetCategory.findUnique,
};

function resetMocks() {
  budgetProgramRepository.findByCode = originalRepositoryMethods.findByCode;
  budgetProgramRepository.findById = originalRepositoryMethods.findById;
  budgetProgramRepository.create = originalRepositoryMethods.create;
  budgetProgramRepository.update = originalRepositoryMethods.update;
  budgetProgramRepository.delete = originalRepositoryMethods.delete;
  budgetProgramRepository.findMany = originalRepositoryMethods.findMany;
  budgetProgramRepository.count = originalRepositoryMethods.count;
  budgetProgramRepository.codeExists = originalRepositoryMethods.codeExists;
  prisma.department.findUnique = originalPrismaMethods.departmentFindUnique;
  prisma.budgetCategory.findUnique = originalPrismaMethods.budgetCategoryFindUnique;
}

async function runBudgetProgramServiceTests() {
  console.log('🧪 Starting Budget Program Service Unit Tests...\n');
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

  const budgetProgram = {
    id: 'prog-1',
    code: 'INFRA-2025',
    name: 'Infrastructure Program',
    description: 'Campus infrastructure',
    departmentId: 'dept-1',
    budgetCategoryId: 'cat-1',
    status: USER_STATUS.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('1. createBudgetProgram Tests:');
  await test('should create a budget program successfully with a default active status', async () => {
    budgetProgramRepository.codeExists = async () => false;
    prisma.department.findUnique = async () => ({ id: 'dept-1' });
    prisma.budgetCategory.findUnique = async () => ({ id: 'cat-1' });
    let createDataCaptured = null;
    budgetProgramRepository.create = async (data) => {
      createDataCaptured = data;
      return { ...budgetProgram, ...data };
    };

    const result = await budgetProgramService.createBudgetProgram({
      code: 'INFRA-2025',
      name: 'Infrastructure Program',
      departmentId: 'dept-1',
      budgetCategoryId: 'cat-1',
    });

    assert.equal(createDataCaptured.status, USER_STATUS.ACTIVE);
    assert.equal(result.code, 'INFRA-2025');
    assert.equal(result.status, USER_STATUS.ACTIVE);
  });

  await test('should throw a conflict error when the code already exists', async () => {
    budgetProgramRepository.codeExists = async () => true;
    let createCalled = false;
    budgetProgramRepository.create = async () => {
      createCalled = true;
    };

    await assert.rejects(
      () =>
        budgetProgramService.createBudgetProgram({
          code: 'INFRA-2025',
          name: 'Infrastructure Program',
          departmentId: 'dept-1',
          budgetCategoryId: 'cat-1',
        }),
      (err) =>
        err instanceof AppError &&
        err.statusCode === HTTP_STATUS.CONFLICT &&
        err.message === 'Budget program code already exists'
    );
    assert.equal(createCalled, false);
  });

  await test('should throw a not found error when the department does not exist', async () => {
    budgetProgramRepository.codeExists = async () => false;
    prisma.department.findUnique = async () => null;

    await assert.rejects(
      () =>
        budgetProgramService.createBudgetProgram({
          code: 'INFRA-2025',
          name: 'Infrastructure Program',
          departmentId: 'missing',
          budgetCategoryId: 'cat-1',
        }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND && err.message === 'Department not found'
    );
  });

  await test('should throw a not found error when the budget category does not exist', async () => {
    budgetProgramRepository.codeExists = async () => false;
    prisma.department.findUnique = async () => ({ id: 'dept-1' });
    prisma.budgetCategory.findUnique = async () => null;

    await assert.rejects(
      () =>
        budgetProgramService.createBudgetProgram({
          code: 'INFRA-2025',
          name: 'Infrastructure Program',
          departmentId: 'dept-1',
          budgetCategoryId: 'missing',
        }),
      (err) =>
        err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND && err.message === 'Budget category not found'
    );
  });

  console.log('\n2. getBudgetProgramById Tests:');
  await test('should get a budget program by ID', async () => {
    budgetProgramRepository.findById = async () => budgetProgram;

    const result = await budgetProgramService.getBudgetProgramById('prog-1');

    assert.equal(result.id, 'prog-1');
    assert.equal(result.code, 'INFRA-2025');
  });

  await test('should throw a not found error when the budget program does not exist', async () => {
    budgetProgramRepository.findById = async () => null;

    await assert.rejects(
      () => budgetProgramService.getBudgetProgramById('missing'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n3. getBudgetProgramByCode Tests:');
  await test('should get a budget program by code', async () => {
    budgetProgramRepository.findByCode = async () => budgetProgram;

    const result = await budgetProgramService.getBudgetProgramByCode('INFRA-2025');

    assert.equal(result.code, 'INFRA-2025');
  });

  await test('should throw a not found error when no budget program has the code', async () => {
    budgetProgramRepository.findByCode = async () => null;

    await assert.rejects(
      () => budgetProgramService.getBudgetProgramByCode('MISSING'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n4. getAllBudgetPrograms Tests:');
  await test('should return budget programs with pagination info', async () => {
    budgetProgramRepository.findMany = async () => [budgetProgram];
    budgetProgramRepository.count = async () => 25;

    const result = await budgetProgramService.getAllBudgetPrograms({}, { page: 2, limit: 10 });

    assert.equal(result.budgetPrograms.length, 1);
    assert.equal(result.pagination.total, 25);
    assert.equal(result.pagination.page, 2);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 3);
  });

  await test('should default to page 1 and limit 10 when pagination is not provided', async () => {
    budgetProgramRepository.findMany = async () => [];
    budgetProgramRepository.count = async () => 0;

    const result = await budgetProgramService.getAllBudgetPrograms();

    assert.deepEqual(result.budgetPrograms, []);
    assert.equal(result.pagination.page, 1);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 0);
  });

  await test('should forward the filters to the repository', async () => {
    let capturedFilters = null;
    budgetProgramRepository.findMany = async (filters) => {
      capturedFilters = filters;
      return [];
    };
    budgetProgramRepository.count = async () => 0;

    const filters = { search: 'infra', departmentId: 'dept-1' };
    await budgetProgramService.getAllBudgetPrograms(filters, { page: 1, limit: 10 });

    assert.deepEqual(capturedFilters, filters);
  });

  console.log('\n5. updateBudgetProgram Tests:');
  await test('should update a budget program successfully', async () => {
    budgetProgramRepository.findById = async () => budgetProgram;
    let updateDataCaptured = null;
    budgetProgramRepository.update = async (id, data) => {
      updateDataCaptured = { id, data };
      return { ...budgetProgram, ...data };
    };

    const result = await budgetProgramService.updateBudgetProgram('prog-1', { description: 'Updated' });

    assert.equal(updateDataCaptured.id, 'prog-1');
    assert.equal(result.description, 'Updated');
  });

  await test('should throw a not found error when the budget program does not exist', async () => {
    budgetProgramRepository.findById = async () => null;

    await assert.rejects(
      () => budgetProgramService.updateBudgetProgram('missing', { description: 'Updated' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('should throw a conflict error when updating to an existing code', async () => {
    budgetProgramRepository.findById = async () => budgetProgram;
    budgetProgramRepository.codeExists = async () => true;

    await assert.rejects(
      () => budgetProgramService.updateBudgetProgram('prog-1', { code: 'OTHER-2025' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should throw a not found error when updating to a missing department', async () => {
    budgetProgramRepository.findById = async () => budgetProgram;
    prisma.department.findUnique = async () => null;

    await assert.rejects(
      () => budgetProgramService.updateBudgetProgram('prog-1', { departmentId: 'missing' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND && err.message === 'Department not found'
    );
  });

  await test('should throw a not found error when updating to a missing budget category', async () => {
    budgetProgramRepository.findById = async () => budgetProgram;
    prisma.department.findUnique = async () => ({ id: 'dept-2' });
    prisma.budgetCategory.findUnique = async () => null;

    await assert.rejects(
      () => budgetProgramService.updateBudgetProgram('prog-1', { budgetCategoryId: 'missing' }),
      (err) =>
        err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND && err.message === 'Budget category not found'
    );
  });

  await test('should not validate references when keeping the same department and category', async () => {
    budgetProgramRepository.findById = async () => budgetProgram;
    let departmentChecked = false;
    let categoryChecked = false;
    prisma.department.findUnique = async () => {
      departmentChecked = true;
      return { id: 'dept-1' };
    };
    prisma.budgetCategory.findUnique = async () => {
      categoryChecked = true;
      return { id: 'cat-1' };
    };
    budgetProgramRepository.update = async (id, data) => ({ ...budgetProgram, ...data });

    const result = await budgetProgramService.updateBudgetProgram('prog-1', { description: 'New' });

    assert.equal(departmentChecked, false);
    assert.equal(categoryChecked, false);
    assert.equal(result.description, 'New');
  });

  console.log('\n6. deleteBudgetProgram Tests:');
  await test('should delete a budget program successfully', async () => {
    budgetProgramRepository.findById = async () => budgetProgram;
    budgetProgramRepository.delete = async () => {};

    const result = await budgetProgramService.deleteBudgetProgram('prog-1');

    assert.deepEqual(result, { message: 'Budget program deleted successfully' });
  });

  await test('should throw a not found error when deleting a missing budget program', async () => {
    budgetProgramRepository.findById = async () => null;

    await assert.rejects(
      () => budgetProgramService.deleteBudgetProgram('missing'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log(`\n✨ Budget Program Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runBudgetProgramServiceTests().catch((err) => {
  console.error('❌ Budget Program Service unit test failed:', err);
  process.exit(1);
});
