import assert from 'node:assert/strict';
import { fundSourceService } from '../services/fundSourceService.js';
import { fundSourceRepository } from '../repositories/fundSourceRepository.js';
import { AppError } from '../errors/appError.js';
import { USER_STATUS } from '../constants/status.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const originalMethods = {
  findByCode: fundSourceRepository.findByCode,
  findById: fundSourceRepository.findById,
  create: fundSourceRepository.create,
  update: fundSourceRepository.update,
  delete: fundSourceRepository.delete,
  findMany: fundSourceRepository.findMany,
  count: fundSourceRepository.count,
  codeExists: fundSourceRepository.codeExists,
};

function resetMocks() {
  fundSourceRepository.findByCode = originalMethods.findByCode;
  fundSourceRepository.findById = originalMethods.findById;
  fundSourceRepository.create = originalMethods.create;
  fundSourceRepository.update = originalMethods.update;
  fundSourceRepository.delete = originalMethods.delete;
  fundSourceRepository.findMany = originalMethods.findMany;
  fundSourceRepository.count = originalMethods.count;
  fundSourceRepository.codeExists = originalMethods.codeExists;
}

async function runFundSourceServiceTests() {
  console.log('🧪 Starting Fund Source Service Unit Tests...\n');
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

  const fundSource = {
    id: 'fund-1',
    code: 'GAA',
    name: 'General Appropriations Act',
    description: 'National budget',
    status: USER_STATUS.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('1. createFundSource Tests:');
  await test('should create a fund source successfully with a default active status', async () => {
    fundSourceRepository.codeExists = async () => false;
    let createDataCaptured = null;
    fundSourceRepository.create = async (data) => {
      createDataCaptured = data;
      return { ...fundSource, ...data };
    };

    const result = await fundSourceService.createFundSource({
      code: 'GAA',
      name: 'General Appropriations Act',
    });

    assert.equal(createDataCaptured.status, USER_STATUS.ACTIVE);
    assert.equal(result.code, 'GAA');
    assert.equal(result.status, USER_STATUS.ACTIVE);
  });

  await test('should throw a conflict error when the code already exists', async () => {
    fundSourceRepository.codeExists = async () => true;
    let createCalled = false;
    fundSourceRepository.create = async () => {
      createCalled = true;
    };

    await assert.rejects(
      () => fundSourceService.createFundSource({ code: 'GAA', name: 'General Appropriations Act' }),
      (err) =>
        err instanceof AppError &&
        err.statusCode === HTTP_STATUS.CONFLICT &&
        err.message === 'Fund source code already exists'
    );
    assert.equal(createCalled, false);
  });

  console.log('\n2. getFundSourceById Tests:');
  await test('should get a fund source by ID', async () => {
    fundSourceRepository.findById = async () => fundSource;

    const result = await fundSourceService.getFundSourceById('fund-1');

    assert.equal(result.id, 'fund-1');
    assert.equal(result.code, 'GAA');
  });

  await test('should throw a not found error when the fund source does not exist', async () => {
    fundSourceRepository.findById = async () => null;

    await assert.rejects(
      () => fundSourceService.getFundSourceById('missing'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n3. getFundSourceByCode Tests:');
  await test('should get a fund source by code', async () => {
    fundSourceRepository.findByCode = async () => fundSource;

    const result = await fundSourceService.getFundSourceByCode('GAA');

    assert.equal(result.code, 'GAA');
  });

  await test('should throw a not found error when no fund source has the code', async () => {
    fundSourceRepository.findByCode = async () => null;

    await assert.rejects(
      () => fundSourceService.getFundSourceByCode('MISSING'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n4. getAllFundSources Tests:');
  await test('should return fund sources with pagination info', async () => {
    fundSourceRepository.findMany = async () => [fundSource];
    fundSourceRepository.count = async () => 25;

    const result = await fundSourceService.getAllFundSources({}, { page: 2, limit: 10 });

    assert.equal(result.fundSources.length, 1);
    assert.equal(result.pagination.total, 25);
    assert.equal(result.pagination.page, 2);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 3);
  });

  await test('should default to page 1 and limit 10 when pagination is not provided', async () => {
    fundSourceRepository.findMany = async () => [];
    fundSourceRepository.count = async () => 0;

    const result = await fundSourceService.getAllFundSources();

    assert.deepEqual(result.fundSources, []);
    assert.equal(result.pagination.page, 1);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 0);
  });

  await test('should forward the filters to the repository', async () => {
    let capturedFilters = null;
    fundSourceRepository.findMany = async (filters) => {
      capturedFilters = filters;
      return [];
    };
    fundSourceRepository.count = async () => 0;

    const filters = { search: 'gaa', status: USER_STATUS.ACTIVE };
    await fundSourceService.getAllFundSources(filters, { page: 1, limit: 10 });

    assert.deepEqual(capturedFilters, filters);
  });

  console.log('\n5. updateFundSource Tests:');
  await test('should update a fund source successfully', async () => {
    fundSourceRepository.findById = async () => fundSource;
    let updateDataCaptured = null;
    fundSourceRepository.update = async (id, data) => {
      updateDataCaptured = { id, data };
      return { ...fundSource, ...data };
    };

    const result = await fundSourceService.updateFundSource('fund-1', { description: 'Updated' });

    assert.equal(updateDataCaptured.id, 'fund-1');
    assert.equal(result.description, 'Updated');
  });

  await test('should throw a not found error when the fund source does not exist', async () => {
    fundSourceRepository.findById = async () => null;

    await assert.rejects(
      () => fundSourceService.updateFundSource('missing', { description: 'Updated' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('should throw a conflict error when updating to an existing code', async () => {
    fundSourceRepository.findById = async () => fundSource;
    fundSourceRepository.codeExists = async () => true;

    await assert.rejects(
      () => fundSourceService.updateFundSource('fund-1', { code: 'LOCAL' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should not check for duplicates when keeping the same code', async () => {
    fundSourceRepository.findById = async () => fundSource;
    let codeChecked = false;
    fundSourceRepository.codeExists = async () => {
      codeChecked = true;
      return true;
    };
    fundSourceRepository.update = async (id, data) => ({ ...fundSource, ...data });

    const result = await fundSourceService.updateFundSource('fund-1', { description: 'New' });

    assert.equal(codeChecked, false);
    assert.equal(result.description, 'New');
  });

  console.log('\n6. deleteFundSource Tests:');
  await test('should delete a fund source successfully', async () => {
    fundSourceRepository.findById = async () => fundSource;
    fundSourceRepository.delete = async () => {};

    const result = await fundSourceService.deleteFundSource('fund-1');

    assert.deepEqual(result, { message: 'Fund source deleted successfully' });
  });

  await test('should throw a not found error when deleting a missing fund source', async () => {
    fundSourceRepository.findById = async () => null;

    await assert.rejects(
      () => fundSourceService.deleteFundSource('missing'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log(`\n✨ Fund Source Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runFundSourceServiceTests().catch((err) => {
  console.error('❌ Fund Source Service unit test failed:', err);
  process.exit(1);
});
