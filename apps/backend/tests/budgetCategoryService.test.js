import assert from 'node:assert/strict';
import { budgetCategoryService } from '../services/budgetCategoryService.js';
import { budgetCategoryRepository } from '../repositories/budgetCategoryRepository.js';
import { AppError } from '../errors/appError.js';
import { USER_STATUS } from '../constants/status.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const originalMethods = {
  findByCode: budgetCategoryRepository.findByCode,
  findByName: budgetCategoryRepository.findByName,
  findById: budgetCategoryRepository.findById,
  create: budgetCategoryRepository.create,
  update: budgetCategoryRepository.update,
  delete: budgetCategoryRepository.delete,
  findMany: budgetCategoryRepository.findMany,
  count: budgetCategoryRepository.count,
  codeExists: budgetCategoryRepository.codeExists,
  nameExists: budgetCategoryRepository.nameExists,
};

function resetMocks() {
  budgetCategoryRepository.findByCode = originalMethods.findByCode;
  budgetCategoryRepository.findByName = originalMethods.findByName;
  budgetCategoryRepository.findById = originalMethods.findById;
  budgetCategoryRepository.create = originalMethods.create;
  budgetCategoryRepository.update = originalMethods.update;
  budgetCategoryRepository.delete = originalMethods.delete;
  budgetCategoryRepository.findMany = originalMethods.findMany;
  budgetCategoryRepository.count = originalMethods.count;
  budgetCategoryRepository.codeExists = originalMethods.codeExists;
  budgetCategoryRepository.nameExists = originalMethods.nameExists;
}

async function runBudgetCategoryServiceTests() {
  console.log('🧪 Starting Budget Category Service Unit Tests...\n');
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

  const budgetCategory = {
    id: 'cat-1',
    code: 'CAPEX',
    name: 'Capital Expenditure',
    description: 'Capital purchases',
    status: USER_STATUS.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('1. createBudgetCategory Tests:');
  await test('should create a budget category successfully with a default active status', async () => {
    budgetCategoryRepository.codeExists = async () => false;
    budgetCategoryRepository.nameExists = async () => false;
    let createDataCaptured = null;
    budgetCategoryRepository.create = async (data) => {
      createDataCaptured = data;
      return { ...budgetCategory, ...data };
    };

    const result = await budgetCategoryService.createBudgetCategory({
      code: 'CAPEX',
      name: 'Capital Expenditure',
    });

    assert.equal(createDataCaptured.status, USER_STATUS.ACTIVE);
    assert.equal(result.code, 'CAPEX');
    assert.equal(result.status, USER_STATUS.ACTIVE);
  });

  await test('should throw a conflict error when the code already exists', async () => {
    budgetCategoryRepository.codeExists = async () => true;
    let createCalled = false;
    budgetCategoryRepository.create = async () => {
      createCalled = true;
    };

    await assert.rejects(
      () => budgetCategoryService.createBudgetCategory({ code: 'CAPEX', name: 'Capital Expenditure' }),
      (err) =>
        err instanceof AppError &&
        err.statusCode === HTTP_STATUS.CONFLICT &&
        err.message === 'Budget category code already exists'
    );
    assert.equal(createCalled, false);
  });

  await test('should throw a conflict error when the name already exists', async () => {
    budgetCategoryRepository.codeExists = async () => false;
    budgetCategoryRepository.nameExists = async () => true;

    await assert.rejects(
      () => budgetCategoryService.createBudgetCategory({ code: 'CAPEX', name: 'Capital Expenditure' }),
      (err) =>
        err instanceof AppError &&
        err.statusCode === HTTP_STATUS.CONFLICT &&
        err.message === 'Budget category name already exists'
    );
  });

  console.log('\n2. getBudgetCategoryById Tests:');
  await test('should get a budget category by ID', async () => {
    budgetCategoryRepository.findById = async () => budgetCategory;

    const result = await budgetCategoryService.getBudgetCategoryById('cat-1');

    assert.equal(result.id, 'cat-1');
    assert.equal(result.code, 'CAPEX');
  });

  await test('should throw a not found error when the budget category does not exist', async () => {
    budgetCategoryRepository.findById = async () => null;

    await assert.rejects(
      () => budgetCategoryService.getBudgetCategoryById('missing'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n3. getBudgetCategoryByCode Tests:');
  await test('should get a budget category by code', async () => {
    budgetCategoryRepository.findByCode = async () => budgetCategory;

    const result = await budgetCategoryService.getBudgetCategoryByCode('CAPEX');

    assert.equal(result.code, 'CAPEX');
  });

  await test('should throw a not found error when no budget category has the code', async () => {
    budgetCategoryRepository.findByCode = async () => null;

    await assert.rejects(
      () => budgetCategoryService.getBudgetCategoryByCode('MISSING'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n4. getBudgetCategoryByName Tests:');
  await test('should get a budget category by name', async () => {
    budgetCategoryRepository.findByName = async () => budgetCategory;

    const result = await budgetCategoryService.getBudgetCategoryByName('Capital Expenditure');

    assert.equal(result.name, 'Capital Expenditure');
  });

  await test('should throw a not found error when no budget category has the name', async () => {
    budgetCategoryRepository.findByName = async () => null;

    await assert.rejects(
      () => budgetCategoryService.getBudgetCategoryByName('Missing Category'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n5. getAllBudgetCategories Tests:');
  await test('should return budget categories with pagination info', async () => {
    budgetCategoryRepository.findMany = async () => [budgetCategory];
    budgetCategoryRepository.count = async () => 25;

    const result = await budgetCategoryService.getAllBudgetCategories({}, { page: 2, limit: 10 });

    assert.equal(result.budgetCategories.length, 1);
    assert.equal(result.pagination.total, 25);
    assert.equal(result.pagination.page, 2);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 3);
  });

  await test('should default to page 1 and limit 10 when pagination is not provided', async () => {
    budgetCategoryRepository.findMany = async () => [];
    budgetCategoryRepository.count = async () => 0;

    const result = await budgetCategoryService.getAllBudgetCategories();

    assert.deepEqual(result.budgetCategories, []);
    assert.equal(result.pagination.page, 1);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 0);
  });

  await test('should forward the filters to the repository', async () => {
    let capturedFilters = null;
    budgetCategoryRepository.findMany = async (filters) => {
      capturedFilters = filters;
      return [];
    };
    budgetCategoryRepository.count = async () => 0;

    const filters = { search: 'cap', status: USER_STATUS.ACTIVE };
    await budgetCategoryService.getAllBudgetCategories(filters, { page: 1, limit: 10 });

    assert.deepEqual(capturedFilters, filters);
  });

  console.log('\n6. updateBudgetCategory Tests:');
  await test('should update a budget category successfully', async () => {
    budgetCategoryRepository.findById = async () => budgetCategory;
    let updateDataCaptured = null;
    budgetCategoryRepository.update = async (id, data) => {
      updateDataCaptured = { id, data };
      return { ...budgetCategory, ...data };
    };

    const result = await budgetCategoryService.updateBudgetCategory('cat-1', { description: 'Updated' });

    assert.equal(updateDataCaptured.id, 'cat-1');
    assert.equal(result.description, 'Updated');
  });

  await test('should throw a not found error when the budget category does not exist', async () => {
    budgetCategoryRepository.findById = async () => null;

    await assert.rejects(
      () => budgetCategoryService.updateBudgetCategory('missing', { description: 'Updated' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('should throw a conflict error when updating to an existing code', async () => {
    budgetCategoryRepository.findById = async () => budgetCategory;
    budgetCategoryRepository.codeExists = async () => true;

    await assert.rejects(
      () => budgetCategoryService.updateBudgetCategory('cat-1', { code: 'OPEX' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should throw a conflict error when updating to an existing name', async () => {
    budgetCategoryRepository.findById = async () => budgetCategory;
    budgetCategoryRepository.codeExists = async () => false;
    budgetCategoryRepository.nameExists = async () => true;

    await assert.rejects(
      () => budgetCategoryService.updateBudgetCategory('cat-1', { name: 'Operational Expenditure' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should not check for duplicates when keeping the same code and name', async () => {
    budgetCategoryRepository.findById = async () => budgetCategory;
    let codeChecked = false;
    let nameChecked = false;
    budgetCategoryRepository.codeExists = async () => {
      codeChecked = true;
      return true;
    };
    budgetCategoryRepository.nameExists = async () => {
      nameChecked = true;
      return true;
    };
    budgetCategoryRepository.update = async (id, data) => ({ ...budgetCategory, ...data });

    const result = await budgetCategoryService.updateBudgetCategory('cat-1', { description: 'New' });

    assert.equal(codeChecked, false);
    assert.equal(nameChecked, false);
    assert.equal(result.description, 'New');
  });

  console.log('\n7. deleteBudgetCategory Tests:');
  await test('should delete a budget category successfully', async () => {
    budgetCategoryRepository.findById = async () => budgetCategory;
    budgetCategoryRepository.delete = async () => {};

    const result = await budgetCategoryService.deleteBudgetCategory('cat-1');

    assert.deepEqual(result, { message: 'Budget category deleted successfully' });
  });

  await test('should throw a not found error when deleting a missing budget category', async () => {
    budgetCategoryRepository.findById = async () => null;

    await assert.rejects(
      () => budgetCategoryService.deleteBudgetCategory('missing'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log(`\n✨ Budget Category Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runBudgetCategoryServiceTests().catch((err) => {
  console.error('❌ Budget Category Service unit test failed:', err);
  process.exit(1);
});
