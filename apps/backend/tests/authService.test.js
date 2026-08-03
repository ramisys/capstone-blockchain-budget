import assert from 'node:assert/strict';
import { authService } from '../services/authService.js';
import { userRepository } from '../repositories/userRepository.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { hashPassword } from '../utils/password.js';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../errors/apiError.js';
import { USER_STATUS } from '../constants/status.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const originalMethods = {
  findByEmail: userRepository.findByEmail,
  findById: userRepository.findById,
  createToken: refreshTokenRepository.createToken,
  findByToken: refreshTokenRepository.findByToken,
  revokeToken: refreshTokenRepository.revokeToken,
  revokeAllUserTokens: refreshTokenRepository.revokeAllUserTokens,
};

function resetMocks() {
  userRepository.findByEmail = originalMethods.findByEmail;
  userRepository.findById = originalMethods.findById;
  refreshTokenRepository.createToken = async () => ({ id: 'rt-1' });
  refreshTokenRepository.findByToken = originalMethods.findByToken;
  refreshTokenRepository.revokeToken = async () => ({ id: 'rt-1' });
  refreshTokenRepository.revokeAllUserTokens = async () => ({ count: 1 });
}

async function runAuthServiceTests() {
  console.log('🧪 Starting Auth Service Unit Tests...\n');
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

  const activeUser = async () => ({
    id: 'user-1',
    email: 'admin@university.edu',
    password: await hashPassword('AdminPassword123!'),
    fullName: 'Admin User',
    role: 'Administrator',
    status: USER_STATUS.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('1. login Tests:');
  await test('should login successfully and return user without password plus access & refresh tokens', async () => {
    userRepository.findByEmail = async () => activeUser();

    const result = await authService.login('admin@university.edu', 'AdminPassword123!');

    assert.ok(result.user);
    assert.ok(result.token);
    assert.ok(result.accessToken);
    assert.ok(result.refreshToken);
    assert.equal(typeof result.token, 'string');
    assert.equal(typeof result.refreshToken, 'string');
    assert.equal(result.user.email, 'admin@university.edu');
    assert.equal(result.user.password, undefined);
  });

  await test('should throw UnauthorizedError when the user does not exist', async () => {
    userRepository.findByEmail = async () => null;

    await assert.rejects(
      () => authService.login('missing@university.edu', 'AdminPassword123!'),
      (err) =>
        err instanceof UnauthorizedError &&
        err.statusCode === HTTP_STATUS.UNAUTHORIZED &&
        err.message === 'Invalid credentials'
    );
  });

  await test('should throw ForbiddenError when the account is inactive', async () => {
    userRepository.findByEmail = async () => ({
      id: 'user-1',
      email: 'inactive@university.edu',
      password: await hashPassword('Password123!'),
      status: USER_STATUS.INACTIVE,
    });

    await assert.rejects(
      () => authService.login('inactive@university.edu', 'Password123!'),
      (err) =>
        err instanceof ForbiddenError &&
        err.statusCode === HTTP_STATUS.FORBIDDEN &&
        err.message.includes('inactive')
    );
  });

  await test('should throw UnauthorizedError when the password is incorrect', async () => {
    userRepository.findByEmail = async () => activeUser();

    await assert.rejects(
      () => authService.login('admin@university.edu', 'WrongPassword123!'),
      (err) => err instanceof UnauthorizedError && err.statusCode === HTTP_STATUS.UNAUTHORIZED
    );
  });

  console.log('\n2. refreshToken Tests:');
  await test('should successfully refresh access token and rotate refresh token', async () => {
    const user = await activeUser();
    refreshTokenRepository.findByToken = async (token) => ({
      id: 'rt-1',
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60000),
      revokedAt: null,
      user,
    });

    const result = await authService.refreshToken('valid-refresh-token');
    assert.ok(result.token);
    assert.ok(result.accessToken);
    assert.ok(result.refreshToken);
    assert.notEqual(result.refreshToken, 'valid-refresh-token');
  });

  await test('should throw UnauthorizedError when refresh token is missing', async () => {
    await assert.rejects(
      () => authService.refreshToken(''),
      (err) => err instanceof UnauthorizedError && err.message.includes('required')
    );
  });

  await test('should throw UnauthorizedError when refresh token is revoked', async () => {
    refreshTokenRepository.findByToken = async () => ({
      id: 'rt-1',
      token: 'revoked-token',
      expiresAt: new Date(Date.now() + 60000),
      revokedAt: new Date(),
      user: await activeUser(),
    });

    await assert.rejects(
      () => authService.refreshToken('revoked-token'),
      (err) => err instanceof UnauthorizedError && err.message.includes('Invalid or expired')
    );
  });

  await test('should throw UnauthorizedError when refresh token is expired', async () => {
    refreshTokenRepository.findByToken = async () => ({
      id: 'rt-1',
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 60000),
      revokedAt: null,
      user: await activeUser(),
    });

    await assert.rejects(
      () => authService.refreshToken('expired-token'),
      (err) => err instanceof UnauthorizedError && err.message.includes('Invalid or expired')
    );
  });

  console.log('\n3. logout Tests:');
  await test('should revoke refresh tokens and return a logout confirmation timestamp', async () => {
    let tokenRevoked = false;
    let userTokensRevoked = false;
    refreshTokenRepository.revokeToken = async () => { tokenRevoked = true; };
    refreshTokenRepository.revokeAllUserTokens = async () => { userTokensRevoked = true; };

    const result = await authService.logout('user-1', 'refresh-token-123');

    assert.ok(result.loggedOutAt);
    assert.ok(result.loggedOutAt instanceof Date);
    assert.equal(tokenRevoked, true);
    assert.equal(userTokensRevoked, true);
  });

  console.log('\n4. getCurrentUserProfile Tests:');
  await test('should return the current user profile without the password', async () => {
    userRepository.findById = async () => activeUser();

    const result = await authService.getCurrentUserProfile('user-1');

    assert.equal(result.id, 'user-1');
    assert.equal(result.email, 'admin@university.edu');
    assert.equal(result.password, undefined);
  });

  await test('should throw NotFoundError when the user is not found', async () => {
    userRepository.findById = async () => null;

    await assert.rejects(
      () => authService.getCurrentUserProfile('missing'),
      (err) =>
        err instanceof NotFoundError &&
        err.statusCode === HTTP_STATUS.NOT_FOUND &&
        err.message === 'User profile not found'
    );
  });

  await test('should throw ForbiddenError when the account is inactive', async () => {
    userRepository.findById = async () => ({
      id: 'user-1',
      email: 'inactive@university.edu',
      status: USER_STATUS.INACTIVE,
    });

    await assert.rejects(
      () => authService.getCurrentUserProfile('user-1'),
      (err) => err instanceof ForbiddenError && err.statusCode === HTTP_STATUS.FORBIDDEN
    );
  });

  console.log(`\n✨ Auth Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAuthServiceTests().catch((err) => {
  console.error('❌ Auth Service unit test failed:', err);
  process.exit(1);
});

