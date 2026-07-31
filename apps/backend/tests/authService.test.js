import assert from 'node:assert/strict';
import { authService } from '../services/authService.js';
import { userRepository } from '../repositories/userRepository.js';
import { hashPassword } from '../utils/password.js';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../errors/apiError.js';
import { USER_STATUS } from '../constants/status.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const originalMethods = {
  findByEmail: userRepository.findByEmail,
  findById: userRepository.findById,
};

function resetMocks() {
  userRepository.findByEmail = originalMethods.findByEmail;
  userRepository.findById = originalMethods.findById;
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
  await test('should login successfully and return user without password plus a token', async () => {
    userRepository.findByEmail = async () => activeUser();

    const result = await authService.login('admin@university.edu', 'AdminPassword123!');

    assert.ok(result.user);
    assert.ok(result.token);
    assert.equal(typeof result.token, 'string');
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

  console.log('\n2. logout Tests:');
  await test('should return a logout confirmation timestamp', async () => {
    const result = await authService.logout('user-1');

    assert.ok(result.loggedOutAt);
    assert.ok(result.loggedOutAt instanceof Date);
  });

  console.log('\n3. getCurrentUserProfile Tests:');
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
