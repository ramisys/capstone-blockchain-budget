import { Prisma } from '@prisma/client';
import { PrismaError } from '../errors/prismaError.js';
import { errorHandler } from '../middleware/errorHandler.js';

const CLIENT_VERSION = '5.19.1';

const knownRequestError = (code, meta = {}) =>
  new Prisma.PrismaClientKnownRequestError(`Prisma error ${code}`, {
    code,
    clientVersion: CLIENT_VERSION,
    meta,
  });

async function runTests() {
  console.log('🧪 Starting Prisma Error Handling Tests...\n');

  const results = [];

  const check = (name, condition) => {
    results.push({ name, passed: Boolean(condition) });
    console.log(`   - ${name}: ${condition ? '✅ PASSED' : '❌ FAILED'}`);
  };

  // 1. Unique constraint violation (P2002)
  console.log('1. Unique Constraint Violation (P2002):');
  const p2002 = PrismaError.fromError(knownRequestError('P2002', { target: ['code'] }));
  check('maps to HTTP 409 Conflict', p2002.statusCode === 409);
  check('message includes the target field', p2002.message.includes('code'));
  check('errors array carries field detail', Array.isArray(p2002.errors) && p2002.errors[0]?.field === 'code');

  // 2. Foreign key constraint violation (P2003)
  console.log('2. Foreign Key Constraint Violation (P2003):');
  const p2003 = PrismaError.fromError(
    knownRequestError('P2003', { field_name: 'departmentId' })
  );
  check('maps to HTTP 409 Conflict', p2003.statusCode === 409);
  check('message names the referencing field', p2003.message.includes('department'));

  const p2003Constraint = PrismaError.fromError(
    knownRequestError('P2003', { field_name: 'budget_programs_departmentId_fkey' })
  );
  check('parses constraint-name format', p2003Constraint.message.includes('department'));

  // 3. Record not found (P2025)
  console.log('3. Record Not Found (P2025):');
  const p2025 = PrismaError.fromError(knownRequestError('P2025', { modelName: 'Department', cause: 'Record not found.' }));
  check('maps to HTTP 404 Not Found', p2025.statusCode === 404);
  check('message names the model', p2025.message === 'Department not found');

  // 4. Required relation violation (P2014)
  console.log('4. Required Relation Violation (P2014):');
  const p2014 = PrismaError.fromError(knownRequestError('P2014'));
  check('maps to HTTP 400 Bad Request', p2014.statusCode === 400);

  // 5. Validation error
  console.log('5. Prisma Client Validation Error:');
  const validationError = new Prisma.PrismaClientValidationError('Invalid query', {
    clientVersion: CLIENT_VERSION,
  });
  const mappedValidation = PrismaError.fromError(validationError);
  check('maps to HTTP 400 Bad Request', mappedValidation.statusCode === 400);

  // 6. Connection / initialization error
  console.log('6. Prisma Client Initialization Error:');
  const initError = new Prisma.PrismaClientInitializationError('Can\'t reach database server', CLIENT_VERSION, 'P1001');
  const mappedInit = PrismaError.fromError(initError);
  check('maps to HTTP 503 Service Unavailable', mappedInit.statusCode === 503);
  check('retains original error code', mappedInit.code === 'P1001');

  // 7. Unknown error code
  console.log('7. Unknown Prisma Error Code:');
  const unknown = PrismaError.fromError(knownRequestError('P9999'));
  check('maps to HTTP 500 Internal Server Error', unknown.statusCode === 500);

  // 8. Centralized error handler integration
  console.log('8. Error Handler Middleware Integration:');
  const mockRes = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  errorHandler(knownRequestError('P2002', { target: ['name'] }), {}, mockRes, () => {});
  check('responds with 409 Conflict', mockRes.statusCode === 409);
  check('response has success: false', mockRes.body.success === false);
  check('response includes field-level error', Array.isArray(mockRes.body.errors) && mockRes.body.errors.length > 0);

  const allPassed = results.every((r) => r.passed);
  console.log(`\n✨ Prisma Error Handling Tests ${allPassed ? 'Completed Successfully' : 'FAILED'}: ${results.filter((r) => r.passed).length}/${results.length} Passed`);
  if (!allPassed) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
