import assert from 'node:assert/strict';
import { userService } from '../services/userService.js';
import { userRepository } from '../repositories/userRepository.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../errors/appError.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const originalMethods = {
  findByEmail: userRepository.findByEmail,
  findById: userRepository.findById,
  createUser: userRepository.createUser,
  updateUser: userRepository.updateUser,
  deleteUser: userRepository.deleteUser,
  findMany: userRepository.findMany,
  count: userRepository.count,
};

function resetMocks() {
  userRepository.findByEmail = originalMethods.findByEmail;
  userRepository.findById = originalMethods.findById;
  userRepository.createUser = originalMethods.createUser;
  userRepository.updateUser = originalMethods.updateUser;
  userRepository.deleteUser = originalMethods.deleteUser;
  userRepository.findMany = originalMethods.findMany;
  userRepository.count = originalMethods.count;
}

async function runUserServiceTests() {
  console.log('🧪 Starting User Service Unit Tests...\n');
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

  console.log('1. createUser Tests:');
  await test('should create a new user successfully', async () => {
    userRepository.findByEmail = async () => null;
    userRepository.createUser = async (data) => ({
      id: 'test-id',
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      status: data.status,
      password: data.password,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      fullName: 'Test User',
      role: ROLES.BUDGET_OFFICER,
      status: USER_STATUS.ACTIVE,
    };

    const result = await userService.createUser(userData);

    assert.ok(result.id);
    assert.equal(result.email, userData.email);
    assert.equal(result.fullName, userData.fullName);
    assert.equal(result.role, userData.role);
    assert.equal(result.status, userData.status);
    assert.equal(result.password, undefined);
  });

  await test('should throw error if user already exists', async () => {
    userRepository.findByEmail = async () => ({
      id: 'existing-id',
      email: 'test@example.com',
    });

    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      fullName: 'Test User',
    };

    await assert.rejects(
      async () => userService.createUser(userData),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.message, 'User with this email already exists');
        assert.equal(err.statusCode, HTTP_STATUS.CONFLICT);
        return true;
      }
    );
  });

  console.log('\n2. getUserById Tests:');
  await test('should get user by ID successfully', async () => {
    userRepository.findById = async (id) => ({
      id,
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'hashed-password',
      role: ROLES.BUDGET_OFFICER,
      status: USER_STATUS.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await userService.getUserById('test-id');

    assert.equal(result.id, 'test-id');
    assert.equal(result.email, 'test@example.com');
    assert.equal(result.password, undefined);
  });

  await test('should throw error if user not found', async () => {
    userRepository.findById = async () => null;

    await assert.rejects(
      async () => userService.getUserById('non-existent-id'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.message, 'User not found');
        assert.equal(err.statusCode, HTTP_STATUS.NOT_FOUND);
        return true;
      }
    );
  });

  console.log('\n3. getAllUsers Tests:');
  await test('should get all users with pagination', async () => {
    userRepository.findMany = async () => [
      {
        id: 'test-id',
        email: 'test@example.com',
        fullName: 'Test User',
        role: ROLES.BUDGET_OFFICER,
        status: USER_STATUS.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    userRepository.count = async () => 1;

    const result = await userService.getAllUsers({}, { page: 1, limit: 10 });

    assert.ok(Array.isArray(result.users));
    assert.equal(result.users.length, 1);
    assert.equal(result.pagination.total, 1);
    assert.equal(result.pagination.page, 1);
    assert.equal(result.pagination.limit, 10);
    assert.equal(result.pagination.totalPages, 1);
  });

  await test('should get all users with search, role, and status filters', async () => {
    let capturedWhere = null;
    userRepository.findMany = async (params) => {
      capturedWhere = params.where;
      return [];
    };
    userRepository.count = async (params) => 0;

    const filters = {
      role: ROLES.TREASURER,
      status: USER_STATUS.ACTIVE,
      search: 'john',
    };

    const result = await userService.getAllUsers(filters, { page: 2, limit: 5 });

    assert.equal(capturedWhere.role, ROLES.TREASURER);
    assert.equal(capturedWhere.status, USER_STATUS.ACTIVE);
    assert.deepEqual(capturedWhere.OR, [
      { email: { contains: 'john' } },
      { fullName: { contains: 'john' } },
    ]);
    assert.equal(result.pagination.page, 2);
    assert.equal(result.pagination.limit, 5);
    assert.equal(result.pagination.totalPages, 0);
  });

  console.log('\n4. updateUser Tests:');
  await test('should update user successfully', async () => {
    userRepository.findById = async (id) => ({
      id,
      email: 'test@example.com',
      fullName: 'Test User',
      role: ROLES.BUDGET_OFFICER,
      status: USER_STATUS.ACTIVE,
    });
    userRepository.updateUser = async (id, updateData) => ({
      id,
      email: updateData.email || 'test@example.com',
      fullName: updateData.fullName || 'Test User',
      role: updateData.role || ROLES.BUDGET_OFFICER,
      status: updateData.status || USER_STATUS.ACTIVE,
      password: 'hashed-password',
    });

    const updateData = {
      fullName: 'Updated User',
      role: ROLES.TREASURER,
    };

    const result = await userService.updateUser('test-id', updateData);

    assert.equal(result.fullName, 'Updated User');
    assert.equal(result.role, ROLES.TREASURER);
    assert.equal(result.password, undefined);
  });

  await test('should allow updating user with the same email', async () => {
    userRepository.findById = async (id) => ({
      id,
      email: 'same@example.com',
    });
    userRepository.updateUser = async (id, updateData) => ({
      id,
      email: updateData.email,
    });

    const result = await userService.updateUser('test-id', { email: 'same@example.com' });
    assert.equal(result.email, 'same@example.com');
  });

  await test('should hash password when updating user password', async () => {
    userRepository.findById = async (id) => ({
      id,
      email: 'test@example.com',
    });
    let savedPassword = null;
    userRepository.updateUser = async (id, updateData) => {
      savedPassword = updateData.password;
      return { id, email: updateData.email, password: savedPassword };
    };

    const result = await userService.updateUser('test-id', { password: 'NewPassword123!' });

    assert.ok(savedPassword);
    assert.notEqual(savedPassword, 'NewPassword123!');
    assert.equal(result.password, undefined);
  });

  await test('should throw error if user not found', async () => {
    userRepository.findById = async () => null;

    await assert.rejects(
      async () => userService.updateUser('non-existent-id', {}),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.message, 'User not found');
        assert.equal(err.statusCode, HTTP_STATUS.NOT_FOUND);
        return true;
      }
    );
  });

  await test('should throw error if updating email to already existing email', async () => {
    userRepository.findById = async (id) => ({
      id,
      email: 'original@example.com',
    });
    userRepository.findByEmail = async () => ({
      id: 'other-user-id',
      email: 'taken@example.com',
    });

    await assert.rejects(
      async () => userService.updateUser('test-id', { email: 'taken@example.com' }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.message, 'User with this email already exists');
        assert.equal(err.statusCode, HTTP_STATUS.CONFLICT);
        return true;
      }
    );
  });

  console.log('\n5. deleteUser Tests:');
  await test('should delete user successfully', async () => {
    userRepository.findById = async () => ({ id: 'test-id' });
    userRepository.deleteUser = async () => ({});

    const result = await userService.deleteUser('test-id');

    assert.deepEqual(result, { message: 'User deleted successfully' });
  });

  await test('should throw error if user not found', async () => {
    userRepository.findById = async () => null;

    await assert.rejects(
      async () => userService.deleteUser('non-existent-id'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.message, 'User not found');
        assert.equal(err.statusCode, HTTP_STATUS.NOT_FOUND);
        return true;
      }
    );
  });

  console.log('\n6. changeUserRole Tests:');
  await test('should change user role successfully', async () => {
    userRepository.findById = async (id) => ({
      id,
      email: 'test@example.com',
      role: ROLES.BUDGET_OFFICER,
    });
    userRepository.updateUser = async (id, updateData) => ({
      id,
      role: updateData.role,
      password: 'hashed-password',
    });

    const result = await userService.changeUserRole('test-id', ROLES.TREASURER);

    assert.equal(result.role, ROLES.TREASURER);
    assert.equal(result.password, undefined);
  });

  await test('should throw error for invalid role', async () => {
    await assert.rejects(
      async () => userService.changeUserRole('test-id', 'InvalidRole'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.message, 'Invalid role');
        assert.equal(err.statusCode, HTTP_STATUS.BAD_REQUEST);
        return true;
      }
    );
  });

  await test('should throw error if user not found when changing role', async () => {
    userRepository.findById = async () => null;

    await assert.rejects(
      async () => userService.changeUserRole('non-existent-id', ROLES.TREASURER),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.message, 'User not found');
        assert.equal(err.statusCode, HTTP_STATUS.NOT_FOUND);
        return true;
      }
    );
  });

  console.log('\n7. changeUserStatus Tests:');
  await test('should change user status successfully', async () => {
    userRepository.findById = async (id) => ({
      id,
      email: 'test@example.com',
      status: USER_STATUS.ACTIVE,
    });
    userRepository.updateUser = async (id, updateData) => ({
      id,
      status: updateData.status,
      password: 'hashed-password',
    });

    const result = await userService.changeUserStatus('test-id', USER_STATUS.INACTIVE);

    assert.equal(result.status, USER_STATUS.INACTIVE);
    assert.equal(result.password, undefined);
  });

  await test('should throw error for invalid status', async () => {
    await assert.rejects(
      async () => userService.changeUserStatus('test-id', 'InvalidStatus'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.message, 'Invalid status');
        assert.equal(err.statusCode, HTTP_STATUS.BAD_REQUEST);
        return true;
      }
    );
  });

  await test('should throw error if user not found when changing status', async () => {
    userRepository.findById = async () => null;

    await assert.rejects(
      async () => userService.changeUserStatus('non-existent-id', USER_STATUS.INACTIVE),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.message, 'User not found');
        assert.equal(err.statusCode, HTTP_STATUS.NOT_FOUND);
        return true;
      }
    );
  });

  console.log(`\n✨ User Service Unit Tests Completed: ${passedTests}/${totalTests} Passed!`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runUserServiceTests().catch((err) => {
  console.error('❌ User Service unit test failed:', err);
  process.exit(1);
});