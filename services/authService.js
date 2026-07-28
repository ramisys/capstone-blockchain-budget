import { userRepository } from '../repositories/userRepository.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { UnauthorizedError, NotFoundError, ForbiddenError } from '../errors/apiError.js';
import { USER_STATUS } from '../constants/status.js';

class AuthService {
  /**
   * Authenticate user with credentials and return JWT access token & user profile.
   *
   * @param {string} email - User email address
   * @param {string} password - Plain text password
   * @returns {Promise<{user: object, token: string}>}
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

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Handle user logout logic.
   * Extensible for future token blacklisting functionality.
   *
   * @param {string} userId - ID of logging out user
   * @returns {Promise<object>} Status confirmation
   */
  async logout(userId) {
    // Structure in place for token blacklisting integration
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
