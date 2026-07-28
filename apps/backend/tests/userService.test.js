const { userService } = require('./services/userService');
const { userRepository } = require('./repositories/userRepository');
const { hashPassword } = require('./utils/password');
const { AppError } = require('./errors/apiError');
const { ROLES, USER_STATUS } = require('./constants/role');
const { STATUS_CODES } = require('./constants/httpStatus');

describe('User Service', () => {
  beforeEach(() => {
    // Mock the repository methods
    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(userRepository, 'createUser').mockResolvedValue({
      id: 'test-id',
      email: 'test@example.com',
      fullName: 'Test User',
      role: ROLES.BUDGET_OFFICER,
      status: USER_STATUS.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(userRepository, 'findById').mockResolvedValue({
      id: 'test-id',
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'hashed-password',
      role: ROLES.BUDGET_OFFICER,
      status: USER_STATUS.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(userRepository, 'updateUser').mockResolvedValue({
      id: 'test-id',
      email: 'test@example.com',
      fullName: 'Updated User',
      role: ROLES.TREASURER,
      status: USER_STATUS.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(userRepository, 'deleteUser').mockResolvedValue();
    jest.spyOn(userRepository, 'findMany').mockResolvedValue([
      {
        id: 'test-id',
        email: 'test@example.com',
        fullName: 'Test User',
        role: ROLES.BUDGET_OFFICER,
        status: USER_STATUS.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
    jest.spyOn(userRepository, 'count').mockResolvedValue(1);
    jest.spyOn(_, 'hashPassword').mockResolvedValue('hashed-password');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
        role: ROLES.BUDGET_OFFICER,
        status: USER_STATUS.ACTIVE
      };

      const result = await userService.createUser(userData);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(userData.email);
      expect(result.fullName).toBe(userData.fullName);
      expect(result.role).toBe(userData.role);
      expect(result.status).toBe(userData.status);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user already exists', async () => {
      // Mock existing user
      userRepository.findByEmail.mockResolvedValueOnce({
        id: 'existing-id',
        email: 'test@example.com'
      });

      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User'
      };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('User with this email already exists');
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      const result = await userService.getUserById('test-id');

      expect(result).toHaveProperty('id', 'test-id');
      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(userService.getUserById('non-existent-id'))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('getAllUsers', () => {
    it('should get all users with pagination', async () => {
      const filters = {};
      const pagination = { page: 1, limit: 10 };

      const result = await userService.getAllUsers(filters, pagination);

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBeGreaterThan(0);
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('limit');
      expect(result.pagination).toHaveProperty('totalPages');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        fullName: 'Updated User',
        role: ROLES.TREASURER
      };

      const result = await userService.updateUser('test-id', updateData);

      expect(result.fullName).toBe('Updated User');
      expect(result.role).toBe(ROLES.TREASURER);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(userService.updateUser('non-existent-id', {}))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      await expect(userService.deleteUser('test-id'))
        .resolves
        .toEqual({ message: 'User deleted successfully' });
    });

    it('should throw error if user not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(userService.deleteUser('non-existent-id'))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('changeUserRole', () => {
    it('should change user role successfully', async () => {
      const result = await userService.changeUserRole('test-id', ROLES.TREASURER);

      expect(result.role).toBe(ROLES.TREASURER);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error for invalid role', async () => {
      await expect(userService.changeUserRole('test-id', 'InvalidRole'))
        .rejects
        .toThrow('Invalid role');
    });
  });

  describe('changeUserStatus', () => {
    it('should change user status successfully', async () => {
      const result = await userService.changeUserStatus('test-id', USER_STATUS.INACTIVE);

      expect(result.status).toBe(USER_STATUS.INACTIVE);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error for invalid status', async () => {
      await expect(userService.changeUserStatus('test-id', 'InvalidStatus'))
        .rejects
        .toThrow('Invalid status');
    });
  });
});