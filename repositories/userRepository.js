import prisma from '../models/prismaClient.js';

class UserRepository {
  /**
   * Find a user record by email address.
   *
   * @param {string} email
   * @returns {Promise<object|null>} User object or null
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user record by primary key ID.
   *
   * @param {string} id
   * @returns {Promise<object|null>} User object or null
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user record.
   *
   * @param {object} userData
   * @returns {Promise<object>} Created user record
   */
  async createUser(userData) {
    return prisma.user.create({
      data: userData,
    });
  }

  /**
   * Update an existing user record.
   *
   * @param {string} id
   * @param {object} updateData
   * @returns {Promise<object>} Updated user record
   */
  async updateUser(id, updateData) {
    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }
}

export const userRepository = new UserRepository();
