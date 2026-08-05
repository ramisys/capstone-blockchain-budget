import assert from 'node:assert/strict';
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentQuerySchema,
  documentIdParamSchema,
  documentVersionQuerySchema,
} from '../validators/documentValidator.js';

const VALID_UUID = '00000000-0000-4000-8000-000000000000';

let passedTests = 0;
let totalTests = 0;

const test = (name, testFn) => {
  totalTests++;
  try {
    testFn();
    console.log(`   - ${name}: ✅ PASSED`);
    passedTests++;
  } catch (err) {
    console.error(`   - ${name}: ❌ FAILED`);
    console.error(`     ${err.stack || err}`);
  }
};

async function runValidatorTests() {
  console.log('🧪 Starting Document Validator Tests...\n');

  console.log('1. createDocumentSchema:');
  test('parses a valid payload', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Purchase Request for Lab Equipment',
      documentType: 'PurchaseRequest',
      description: 'Evidence for the procurement request',
      allocationId: VALID_UUID,
      fiscalYearId: VALID_UUID,
      departmentId: VALID_UUID,
    });
    assert.equal(result.success, true);
    assert.equal(result.data.title, 'Purchase Request for Lab Equipment');
  });

  test('rejects a missing title', () => {
    const result = createDocumentSchema.safeParse({ documentType: 'Invoice' });
    assert.equal(result.success, false);
    assert.equal(result.error.errors[0].path[0], 'title');
  });

  test('rejects an empty title', () => {
    const result = createDocumentSchema.safeParse({ title: '  ', documentType: 'Invoice' });
    assert.equal(result.success, false);
  });

  test('rejects a title longer than 200 characters', () => {
    const result = createDocumentSchema.safeParse({
      title: 'x'.repeat(201),
      documentType: 'Invoice',
    });
    assert.equal(result.success, false);
  });

  test('rejects an unknown document type', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Doc',
      documentType: 'NotARealType',
    });
    assert.equal(result.success, false);
  });

  test('rejects a description longer than 1000 characters', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Doc',
      documentType: 'Invoice',
      description: 'x'.repeat(1001),
    });
    assert.equal(result.success, false);
  });

  test('normalizes an empty reference id to null', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Doc',
      documentType: 'Invoice',
      allocationId: '',
    });
    assert.equal(result.success, true);
    assert.equal(result.data.allocationId, null);
  });

  test('keeps an absent reference id as undefined', () => {
    const result = createDocumentSchema.safeParse({ title: 'Doc', documentType: 'Invoice' });
    assert.equal(result.success, true);
    assert.equal(result.data.allocationId, undefined);
  });

  test('normalizes an empty description to null', () => {
    const result = createDocumentSchema.safeParse({
      title: 'Doc',
      documentType: 'Invoice',
      description: '',
    });
    assert.equal(result.success, true);
    assert.equal(result.data.description, null);
  });

  console.log('\n2. updateDocumentSchema:');
  test('accepts a partial update', () => {
    const result = updateDocumentSchema.safeParse({ title: 'Renamed Document' });
    assert.equal(result.success, true);
    assert.equal(result.data.title, 'Renamed Document');
  });

  test('rejects an invalid document type', () => {
    const result = updateDocumentSchema.safeParse({ documentType: 'Bogus' });
    assert.equal(result.success, false);
  });

  test('accepts an empty description (clears it)', () => {
    const result = updateDocumentSchema.safeParse({ description: '' });
    assert.equal(result.success, true);
    assert.equal(result.data.description, null);
  });

  console.log('\n3. documentQuerySchema:');
  test('applies defaults for page, limit, and sortBy', () => {
    const result = documentQuerySchema.safeParse({});
    assert.equal(result.success, true);
    assert.equal(result.data.page, 1);
    assert.equal(result.data.limit, 10);
    assert.equal(result.data.sortBy, 'newest');
  });

  test('rejects a non-numeric page', () => {
    const result = documentQuerySchema.safeParse({ page: 'abc' });
    assert.equal(result.success, false);
  });

  test('rejects an invalid status', () => {
    const result = documentQuerySchema.safeParse({ status: 'Deleted' });
    assert.equal(result.success, false);
  });

  test('rejects an invalid blockchainStatus', () => {
    const result = documentQuerySchema.safeParse({ blockchainStatus: 'Anchored' });
    assert.equal(result.success, false);
  });

  test('accepts valid sortBy and sortOrder', () => {
    const result = documentQuerySchema.safeParse({ sortBy: 'code', sortOrder: 'desc' });
    assert.equal(result.success, true);
  });

  console.log('\n4. documentIdParamSchema:');
  test('accepts a valid UUID', () => {
    const result = documentIdParamSchema.safeParse({ id: VALID_UUID });
    assert.equal(result.success, true);
  });

  test('rejects a non-UUID id', () => {
    const result = documentIdParamSchema.safeParse({ id: 'not-a-uuid' });
    assert.equal(result.success, false);
  });

  console.log('\n5. documentVersionQuerySchema:');
  test('parses a positive integer version', () => {
    const result = documentVersionQuerySchema.safeParse({ version: '3' });
    assert.equal(result.success, true);
    assert.equal(result.data.version, 3);
  });

  test('leaves version undefined when absent', () => {
    const result = documentVersionQuerySchema.safeParse({});
    assert.equal(result.success, true);
    assert.equal(result.data.version, undefined);
  });

  test('rejects a non-numeric version', () => {
    const result = documentVersionQuerySchema.safeParse({ version: 'abc' });
    assert.equal(result.success, false);
  });

  console.log(`\n✨ Document Validator Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runValidatorTests().catch((err) => {
  console.error('❌ Document Validator test failed:', err);
  process.exit(1);
});
