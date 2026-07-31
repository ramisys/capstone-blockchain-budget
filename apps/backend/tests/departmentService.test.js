import assert from 'node:assert/strict';
import { departmentService } from '../services/departmentService.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { AppError } from '../errors/appError.js';
import { USER_STATUS } from '../constants/status.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const originalMethods = {
  findByCode: departmentRepository.findByCode,
  findByName: departmentRepository.findByName,
  findById: departmentRepository.findById,
  create: departmentRepository.create,
  update: departmentRepository.update,
  delete: departmentRepository.delete,
  findMany: departmentRepository.findMany,
  count: departmentRepository.count,
  codeExists: departmentRepository.codeExists,
  nameExists: departmentRepository.nameExists,
};

function resetMocks() {
  departmentRepository.findByCode = originalMethods.findByCode;
  departmentRepository.findByName = originalMethods.findByName;
  departmentRepository.findById = originalMethods.findById;
  departmentRepository.create = originalMethods.create;
  departmentRepository.update = originalMethods.update;
  departmentRepository.delete = originalMethods.delete;
  departmentRepository.findMany = originalMethods.findMany;
  departmentRepository.count = originalMethods.count;
  departmentRepository.codeExists = originalMethods.codeExists;
  departmentRepository.nameExists = originalMethods.nameExists;
}

async function runDepartmentServiceTests() {
  console.log('🧪 Starting Department Service Unit Tests...\n');
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

  const department = {
    id: 'dept-1',
    code: 'IT',
    name: 'Information Technology',
    officeHead: 'John Doe',
    email: 'it@university.edu',
    officeAddress: 'Main Building',
    status: USER_STATUS.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('1. createDepartment Tests:');
  await test('should create a department successfully with a default active status', async () => {
    departmentRepository.codeExists = async () => false;
    departmentRepository.nameExists = async () => false;
    let createDataCaptured = null;
    departmentRepository.create = async (data) => {
      createDataCaptured = data;
      return { ...department, ...data };
    };

    const result = await departmentService.createDepartment({
      code: 'IT',
      name: 'Information Technology',
    });

    assert.equal(createDataCaptured.status, USER_STATUS.ACTIVE);
    assert.equal(result.code, 'IT');
    assert.equal(result.status, USER_STATUS.ACTIVE);
  });

  await test('should throw a conflict error when the code already exists', async () => {
    departmentRepository.codeExists = async () => true;
    let createCalled = false;
    departmentRepository.create = async () => {
      createCalled = true;
    };

    await assert.rejects(
      () => departmentService.createDepartment({ code: 'IT', name: 'Information Technology' }),
      (err) =>
        err instanceof AppError &&
        err.statusCode === HTTP_STATUS.CONFLICT &&
        err.message === 'Department code already exists'
    );
    assert.equal(createCalled, false);
  });

  await test('should throw a conflict error when the name already exists', async () => {
    departmentRepository.codeExists = async () => false;
    departmentRepository.nameExists = async () => true;

    await assert.rejects(
      () => departmentService.createDepartment({ code: 'IT', name: 'Information Technology' }),
      (err) =>
        err instanceof AppError &&
        err.statusCode === HTTP_STATUS.CONFLICT &&
        err.message === 'Department name already exists'
    );
  });

  console.log('\n2. getDepartmentById Tests:');
  await test('should get a department by ID', async () => {
    departmentRepository.findById = async () => department;

    const result = await departmentService.getDepartmentById('dept-1');

    assert.equal(result.id, 'dept-1');
    assert.equal(result.code, 'IT');
  });

  await test('should throw a not found error when the department does not exist', async () => {
    departmentRepository.findById = async () => null;

    await assert.rejects(
      () => departmentService.getDepartmentById('missing'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n3. getDepartmentByCode Tests:');
  await test('should get a department by code', async () => {
    departmentRepository.findByCode = async () => department;

    const result = await departmentService.getDepartmentByCode('IT');

    assert.equal(result.code, 'IT');
  });

  await test('should throw a not found error when no department has the code', async () => {
    departmentRepository.findByCode = async () => null;

    await assert.rejects(
      () => departmentService.getDepartmentByCode('MISSING'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n4. getDepartmentByName Tests:');
  await test('should get a department by name', async () => {
    departmentRepository.findByName = async () => department;

    const result = await departmentService.getDepartmentByName('Information Technology');

    assert.equal(result.name, 'Information Technology');
  });

  await test('should throw a not found error when no department has the name', async () => {
    departmentRepository.findByName = async () => null;

    await assert.rejects(
      () => departmentService.getDepartmentByName('Missing Department'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log('\n5. getAllDepartments Tests:');
  await test('should return departments with pagination info', async () => {
    departmentRepository.findMany = async () => [department];
    departmentRepository.count = async () => 25;

    const result = await departmentService.getAllDepartments({}, { page: 2, limit: 10 });

    assert.equal(result.departments.length, 1);
    assert.equal(result.pagination.total, 25);
    assert.equal(result.pagination.page, 2);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 3);
  });

  await test('should default to page 1 and limit 10 when pagination is not provided', async () => {
    departmentRepository.findMany = async () => [];
    departmentRepository.count = async () => 0;

    const result = await departmentService.getAllDepartments();

    assert.deepEqual(result.departments, []);
    assert.equal(result.pagination.page, 1);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 0);
  });

  await test('should forward the filters to the repository', async () => {
    let capturedFilters = null;
    departmentRepository.findMany = async (filters) => {
      capturedFilters = filters;
      return [];
    };
    departmentRepository.count = async () => 0;

    const filters = { search: 'it', status: USER_STATUS.ACTIVE };
    await departmentService.getAllDepartments(filters, { page: 1, limit: 10 });

    assert.deepEqual(capturedFilters, filters);
  });

  console.log('\n6. updateDepartment Tests:');
  await test('should update a department successfully', async () => {
    departmentRepository.findById = async () => department;
    let updateDataCaptured = null;
    departmentRepository.update = async (id, data) => {
      updateDataCaptured = { id, data };
      return { ...department, ...data };
    };

    const result = await departmentService.updateDepartment('dept-1', { officeHead: 'Jane Smith' });

    assert.equal(updateDataCaptured.id, 'dept-1');
    assert.equal(result.officeHead, 'Jane Smith');
  });

  await test('should throw a not found error when the department does not exist', async () => {
    departmentRepository.findById = async () => null;

    await assert.rejects(
      () => departmentService.updateDepartment('missing', { officeHead: 'Jane Smith' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('should throw a conflict error when updating to an existing code', async () => {
    departmentRepository.findById = async () => department;
    departmentRepository.codeExists = async () => true;

    await assert.rejects(
      () => departmentService.updateDepartment('dept-1', { code: 'HR' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should throw a conflict error when updating to an existing name', async () => {
    departmentRepository.findById = async () => department;
    departmentRepository.codeExists = async () => false;
    departmentRepository.nameExists = async () => true;

    await assert.rejects(
      () => departmentService.updateDepartment('dept-1', { name: 'Human Resources' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should not check for duplicates when keeping the same code and name', async () => {
    departmentRepository.findById = async () => department;
    let codeChecked = false;
    let nameChecked = false;
    departmentRepository.codeExists = async () => {
      codeChecked = true;
      return true;
    };
    departmentRepository.nameExists = async () => {
      nameChecked = true;
      return true;
    };
    departmentRepository.update = async (id, data) => ({ ...department, ...data });

    const result = await departmentService.updateDepartment('dept-1', { officeHead: 'New Head' });

    assert.equal(codeChecked, false);
    assert.equal(nameChecked, false);
    assert.equal(result.officeHead, 'New Head');
  });

  console.log('\n7. deleteDepartment Tests:');
  await test('should delete a department successfully', async () => {
    departmentRepository.findById = async () => department;
    departmentRepository.delete = async () => {};

    const result = await departmentService.deleteDepartment('dept-1');

    assert.deepEqual(result, { message: 'Department deleted successfully' });
  });

  await test('should throw a not found error when deleting a missing department', async () => {
    departmentRepository.findById = async () => null;

    await assert.rejects(
      () => departmentService.deleteDepartment('missing'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log(`\n✨ Department Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runDepartmentServiceTests().catch((err) => {
  console.error('❌ Department Service unit test failed:', err);
  process.exit(1);
});
