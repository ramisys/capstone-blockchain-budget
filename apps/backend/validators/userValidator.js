import { z } from 'zod';
import { ROLE_LIST } from '../constants/roles.js';
import { USER_STATUS_LIST } from '../constants/status.js';

/**
 * Zod schema for creating a new user
 */
export const createUserSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one digit'
    ),
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters long'),
  role: z
    .enum(ROLE_LIST, {
      errorMap: () => ({ message: 'Invalid role selected' }),
    })
    .optional(),
  status: z
    .enum(USER_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid status selected' }),
    })
    .optional(),
});

/**
 * Zod schema for updating an existing user (partial updates)
 */
export const updateUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email address format')
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one digit'
    )
    .optional(),
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters long')
    .optional(),
  role: z
    .enum(ROLE_LIST, {
      errorMap: () => ({ message: 'Invalid role selected' }),
    })
    .optional(),
  status: z
    .enum(USER_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid status selected' }),
    })
    .optional(),
});

/**
 * Zod schema for user login (reusing from authValidator but exporting for consistency)
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

/**
 * Zod schema for changing user role
 */
export const changeRoleSchema = z.object({
  role: z.enum(ROLE_LIST, {
    errorMap: () => ({ message: 'Invalid role selected' }),
  }),
});

/**
 * Zod schema for changing user status
 */
export const changeStatusSchema = z.object({
  status: z.enum(USER_STATUS_LIST, {
    errorMap: () => ({ message: 'Invalid status selected' }),
  }),
});

/**
 * Zod schema for user query parameters (filtering, pagination, search)
 */
export const userQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10))
    .default(10),
  role: z.enum(ROLE_LIST).optional(),
  status: z.enum(USER_STATUS_LIST).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['id', 'email', 'fullName', 'role', 'status', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});