import assert from 'node:assert/strict';
import { fiscalYearService } from '../services/fiscalYearService.js';
import { fiscalYearRepository } from '../repositories/fiscalYearRepository.js';
import { AppError } from '../errors/appError.js';
import { FISCAL_YEAR_STATUS } from '../constants/fiscalYearStatus.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const originalMethods = {
  findById: fiscalYearRepository.findById,
  codeExists: fiscalYearRepository.codeExists,
  isOverlapping: fiscalYearRepository.isOverlapping,
  setActive: fiscalYearRepository.setActive,
  update: fiscalYearRepository.update,
};

function resetMocks() {
  fiscalYearRepository.findById = originalMethods.findById;
  fiscalYearRepository.codeExists = originalMethods.codeExists;
  fiscalYearRepository.isOverlapping = originalMethods.isOverlapping;
  fiscalYearRepository.setActive = originalMethods.setActive;
  fiscalYearRepository.update = originalMethods.update;
}

const inactiveYear = {
  id: 'fy-1',
  code: 'FY-2025',
  description: 'Fiscal Year 2025',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  status: FISCAL_YEAR_STATUS.INACTIVE,
  isActive: false,
};

const activeYear = {
  ...inactiveYear,
  status: FISCAL_YEAR_STATUS.ACTIVE,
  isActive: true,
};

const archivedYear = {
  ...inactiveYear,
  status: FISCAL_YEAR_STATUS.ARCHIVED,
};

async function runFiscalYearServiceTests() {
  console.log('🧪 Starting Fiscal Year Service Unit Tests...\n');
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

  console.log('1. setActiveFiscalYear Tests:');
  await test('should activate a fiscal year and deactivate all others', async () => {
    fiscalYearRepository.findById = async () => inactiveYear;
    let setActiveCalled = false;
    fiscalYearRepository.setActive = async () => {
      setActiveCalled = true;
      return { ...inactiveYear, status: FISCAL_YEAR_STATUS.ACTIVE, isActive: true };
    };

    const result = await fiscalYearService.setActiveFiscalYear('fy-1');

    assert.equal(setActiveCalled, true);
    assert.equal(result.isActive, true);
    assert.equal(result.status, FISCAL_YEAR_STATUS.ACTIVE);
  });

  await test('should throw error if fiscal year not found', async () => {
    fiscalYearRepository.findById = async () => null;

    await assert.rejects(
      () => fiscalYearService.setActiveFiscalYear('missing'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  await test('should throw error when activating an archived fiscal year', async () => {
    fiscalYearRepository.findById = async () => archivedYear;
    let setActiveCalled = false;
    fiscalYearRepository.setActive = async () => {
      setActiveCalled = true;
      return archivedYear;
    };

    await assert.rejects(
      () => fiscalYearService.setActiveFiscalYear('fy-1'),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
    assert.equal(setActiveCalled, false);
  });

  await test('should be a no-op when the fiscal year is already active', async () => {
    fiscalYearRepository.findById = async () => activeYear;
    let setActiveCalled = false;
    fiscalYearRepository.setActive = async () => {
      setActiveCalled = true;
      return activeYear;
    };

    const result = await fiscalYearService.setActiveFiscalYear('fy-1');

    assert.equal(setActiveCalled, false);
    assert.equal(result.isActive, true);
  });

  console.log('\n2. updateFiscalYear Tests:');
  await test('should update fields while keeping an inactive fiscal year inactive', async () => {
    fiscalYearRepository.findById = async () => inactiveYear;
    let updateDataCaptured = null;
    fiscalYearRepository.update = async (id, data) => {
      updateDataCaptured = { id, data };
      return { ...inactiveYear, ...data };
    };

    const result = await fiscalYearService.updateFiscalYear('fy-1', { description: 'Updated' });

    assert.equal(updateDataCaptured.data.description, 'Updated');
    assert.equal(updateDataCaptured.data.status, FISCAL_YEAR_STATUS.INACTIVE);
    assert.equal(updateDataCaptured.data.isActive, false);
    assert.equal(result.description, 'Updated');
  });

  await test('should route activation through setActive when isActive is set to true', async () => {
    fiscalYearRepository.findById = async () => inactiveYear;
    let setActiveCalled = false;
    fiscalYearRepository.setActive = async () => {
      setActiveCalled = true;
      return activeYear;
    };
    fiscalYearRepository.update = async (id, data) => ({ ...activeYear, ...data });

    const result = await fiscalYearService.updateFiscalYear('fy-1', { isActive: true });

    assert.equal(setActiveCalled, true);
    assert.equal(result.isActive, true);
    assert.equal(result.status, FISCAL_YEAR_STATUS.ACTIVE);
  });

  await test('should keep an already-active fiscal year active when editing other fields', async () => {
    fiscalYearRepository.findById = async () => activeYear;
    let setActiveCalled = false;
    fiscalYearRepository.setActive = async () => {
      setActiveCalled = true;
      return activeYear;
    };
    fiscalYearRepository.update = async (id, data) => ({ ...activeYear, ...data });

    const result = await fiscalYearService.updateFiscalYear('fy-1', { description: 'New description' });

    assert.equal(setActiveCalled, true);
    assert.equal(result.isActive, true);
    assert.equal(result.status, FISCAL_YEAR_STATUS.ACTIVE);
  });

  await test('should throw error when activating an archived fiscal year via update', async () => {
    fiscalYearRepository.findById = async () => archivedYear;

    await assert.rejects(
      () => fiscalYearService.updateFiscalYear('fy-1', { isActive: true }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should throw error when archiving the currently active fiscal year', async () => {
    fiscalYearRepository.findById = async () => activeYear;

    await assert.rejects(
      () => fiscalYearService.updateFiscalYear('fy-1', { status: FISCAL_YEAR_STATUS.ARCHIVED }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.CONFLICT
    );
  });

  await test('should archive an inactive fiscal year and keep it inactive', async () => {
    fiscalYearRepository.findById = async () => inactiveYear;
    let updateDataCaptured = null;
    fiscalYearRepository.update = async (id, data) => {
      updateDataCaptured = { id, data };
      return { ...inactiveYear, ...data };
    };

    const result = await fiscalYearService.updateFiscalYear('fy-1', { status: FISCAL_YEAR_STATUS.ARCHIVED });

    assert.equal(updateDataCaptured.data.status, FISCAL_YEAR_STATUS.ARCHIVED);
    assert.equal(updateDataCaptured.data.isActive, false);
    assert.equal(result.status, FISCAL_YEAR_STATUS.ARCHIVED);
  });

  await test('should throw error if fiscal year not found on update', async () => {
    fiscalYearRepository.findById = async () => null;

    await assert.rejects(
      () => fiscalYearService.updateFiscalYear('missing', { description: 'Updated' }),
      (err) => err instanceof AppError && err.statusCode === HTTP_STATUS.NOT_FOUND
    );
  });

  console.log(`\n✨ Fiscal Year Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exitCode = 1;
  }
}

runFiscalYearServiceTests();
