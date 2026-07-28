import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash plain text password using bcrypt.
 *
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password string
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare plain text password against hashed password.
 *
 * @param {string} password - Plain text password input
 * @param {string} hashedPassword - Stored hash
 * @returns {Promise<boolean>} Match result
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
