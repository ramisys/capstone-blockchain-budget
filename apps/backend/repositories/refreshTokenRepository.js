import prisma from '../models/prismaClient.js';

class RefreshTokenRepository {
  /**
   * Create a new refresh token record in the database.
   *
   * @param {object} data
   * @param {string} data.token
   * @param {string} data.userId
   * @param {Date} data.expiresAt
   * @returns {Promise<object>} Created refresh token record
   */
  async createToken({ token, userId, expiresAt }) {
    return prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Find a refresh token record by token string.
   *
   * @param {string} token
   * @returns {Promise<object|null>}
   */
  async findByToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });
  }

  /**
   * Mark a specific refresh token as revoked.
   *
   * @param {string} token
   * @returns {Promise<object>}
   */
  async revokeToken(token) {
    return prisma.refreshToken.update({
      where: { token },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Revoke all active refresh tokens belonging to a specific user.
   *
   * @param {string} userId
   * @returns {Promise<object>} Batch update result
   */
  async revokeAllUserTokens(userId) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Delete expired refresh tokens from database.
   *
   * @returns {Promise<object>} Batch delete result
   */
  async deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
