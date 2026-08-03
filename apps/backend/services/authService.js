import { userRepository } from '../repositories/userRepository.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { comparePassword } from '../utils/password.js';
import { signToken, generateRefreshToken } from '../utils/jwt.js';
import { UnauthorizedError, NotFoundError, ForbiddenError } from '../errors/apiError.js';
import { USER_STATUS } from '../constants/status.js';

class AuthService {
  /**
   * Authenticate user with credentials and return JWT access token, refresh token & user profile.
   *
   * @param {string} email - User email address
   * @param {string} password - Plain text password
   * @returns {Promise<{user: object, token: string, accessToken: string, refreshToken: string}>}
   */
  async login(email, password) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new ForbiddenError('Account is inactive. Please contact the administrator.');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { token: refreshToken, expiresAt } = generateRefreshToken();
    await refreshTokenRepository.createToken({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      accessToken: token,
      refreshToken,
    };
  }

  /**
   * Rotate refresh token and issue a fresh access token.
   *
   * @param {string} refreshTokenString
   * @returns {Promise<{token: string, accessToken: string, refreshToken: string}>}
   */
  async refreshToken(refreshTokenString) {
    if (!refreshTokenString) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const tokenRecord = await refreshTokenRepository.findByToken(refreshTokenString);

    if (!tokenRecord || tokenRecord.revokedAt || new Date(tokenRecord.expiresAt) < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (!tokenRecord.user || tokenRecord.user.status !== USER_STATUS.ACTIVE) {
      throw new ForbiddenError('Account is inactive.');
    }

    // Revoke used refresh token (Token Rotation)
    await refreshTokenRepository.revokeToken(refreshTokenString);

    const newAccessToken = signToken({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    const { token: newRefreshToken, expiresAt } = generateRefreshToken();
    await refreshTokenRepository.createToken({
      token: newRefreshToken,
      userId: tokenRecord.user.id,
      expiresAt,
    });

    return {
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Handle user logout logic and revoke refresh tokens.
   *
   * @param {string} [userId] - ID of logging out user
   * @param {string} [refreshTokenString] - Refresh token to invalidate
   * @returns {Promise<object>} Status confirmation
   */
  async logout(userId, refreshTokenString) {
    if (refreshTokenString) {
      await refreshTokenRepository.revokeToken(refreshTokenString).catch(() => {});
    }
    if (userId) {
      await refreshTokenRepository.revokeAllUserTokens(userId);
    }
    return { loggedOutAt: new Date() };
  }

  /**
   * Retrieve current authenticated user profile by ID.
   *
   * @param {string} userId - Primary key of authenticated user
   * @returns {Promise<object>} User profile excluding password
   */
  async getCurrentUserProfile(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new ForbiddenError('Account is inactive.');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();

