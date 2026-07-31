import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/authMiddleware.js';
import { userRepository } from '../repositories/userRepository.js';
import { signToken } from '../utils/jwt.js';
import { config } from '../config/env.js';
import { USER_STATUS } from '../constants/status.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const originalFindById = userRepository.findById;

function resetMocks() {
  userRepository.findById = originalFindById;
}

const activeUser = {
  id: 'user-1',
  email: 'admin@university.edu',
  fullName: 'Admin User',
  role: 'Administrator',
  status: USER_STATUS.ACTIVE,
};

function callAuthenticate(req) {
  return new Promise((resolve) => {
    const res = {};
    authenticate(req, res, (err) => resolve(err || null));
  });
}

function expiredToken() {
  return jwt.sign(
    {
      id: activeUser.id,
      email: activeUser.email,
      role: activeUser.role,
      exp: Math.floor(Date.now() / 1000) - 60,
    },
    config.jwt.secret,
    { algorithm: 'HS256', issuer: config.jwt.issuer, audience: config.jwt.audience }
  );
}

async function runAuthMiddlewareTests() {
  console.log('🧪 Starting Auth Middleware Unit Tests...\n');
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

  console.log('1. Valid Token Tests:');
  await test('should attach the database user to the request for a valid token', async () => {
    userRepository.findById = async () => activeUser;

    const req = { headers: { authorization: `Bearer ${signToken(activeUser)}` } };
    const err = await callAuthenticate(req);

    assert.equal(err, null);
    assert.equal(req.user.id, activeUser.id);
    assert.equal(req.user.email, activeUser.email);
    assert.equal(req.user.role, activeUser.role);
    assert.equal(req.user.password, undefined);
  });

  await test('should use the fresh role from the database, not the role embedded in the token', async () => {
    userRepository.findById = async () => ({ ...activeUser, role: 'Treasurer' });

    const req = {
      headers: { authorization: `Bearer ${signToken({ ...activeUser, role: 'Administrator' })}` },
    };
    const err = await callAuthenticate(req);

    assert.equal(err, null);
    assert.equal(req.user.role, 'Treasurer');
    assert.equal(req.user.status, USER_STATUS.ACTIVE);
  });

  console.log('\n2. Token Absence / Format Tests:');
  await test('should reject a request without an Authorization header', async () => {
    const err = await callAuthenticate({ headers: {} });

    assert.ok(err);
    assert.equal(err.statusCode, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(err.message, 'Authentication token is required');
  });

  await test('should reject a non-Bearer Authorization header', async () => {
    const err = await callAuthenticate({ headers: { authorization: 'Basic abc123' } });

    assert.ok(err);
    assert.equal(err.statusCode, HTTP_STATUS.UNAUTHORIZED);
  });

  await test('should reject an empty Bearer token', async () => {
    const err = await callAuthenticate({ headers: { authorization: 'Bearer ' } });

    assert.ok(err);
    assert.equal(err.statusCode, HTTP_STATUS.UNAUTHORIZED);
  });

  console.log('\n3. Token Validity Tests:');
  await test('should reject an expired token', async () => {
    const req = { headers: { authorization: `Bearer ${expiredToken()}` } };
    const err = await callAuthenticate(req);

    assert.ok(err);
    assert.equal(err.statusCode, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(err.message, 'Authentication token has expired');
  });

  await test('should reject a token with an invalid signature', async () => {
    const forged = jwt.sign(
      { id: activeUser.id, email: activeUser.email, role: activeUser.role },
      'wrong-secret-used-to-forge',
      { algorithm: 'HS256', issuer: config.jwt.issuer, audience: config.jwt.audience }
    );

    const err = await callAuthenticate({ headers: { authorization: `Bearer ${forged}` } });

    assert.ok(err);
    assert.equal(err.statusCode, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(err.message, 'Invalid authentication token');
  });

  await test('should reject a token issued for a different audience', async () => {
    const wrongAudience = jwt.sign(
      { id: activeUser.id, email: activeUser.email, role: activeUser.role },
      config.jwt.secret,
      { algorithm: 'HS256', issuer: config.jwt.issuer, audience: 'another-consumer-app' }
    );

    const err = await callAuthenticate({ headers: { authorization: `Bearer ${wrongAudience}` } });

    assert.ok(err);
    assert.equal(err.statusCode, HTTP_STATUS.UNAUTHORIZED);
  });

  console.log('\n4. Account Re-Validation Tests:');
  await test('should reject a token when the user has been deleted', async () => {
    userRepository.findById = async () => null;

    const req = { headers: { authorization: `Bearer ${signToken(activeUser)}` } };
    const err = await callAuthenticate(req);

    assert.ok(err);
    assert.equal(err.statusCode, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(err.message, 'Authentication token is invalid');
  });

  await test('should reject a token when the account is inactive', async () => {
    userRepository.findById = async () => ({ ...activeUser, status: USER_STATUS.INACTIVE });

    const req = { headers: { authorization: `Bearer ${signToken(activeUser)}` } };
    const err = await callAuthenticate(req);

    assert.ok(err);
    assert.equal(err.statusCode, HTTP_STATUS.FORBIDDEN);
    assert.equal(err.message, 'Account is inactive. Please contact the administrator.');
  });

  console.log(`\n✨ Auth Middleware Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAuthMiddlewareTests().catch((err) => {
  console.error('❌ Auth Middleware unit test failed:', err);
  process.exit(1);
});
