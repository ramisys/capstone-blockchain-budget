import { z } from 'zod';
import { USER_STATUS_LIST } from '../constants/status.js';

/**
 * Zod schema for creating a new department
 */
export const createDepartmentSchema = z.object({
  code: z
    .string({ required_error: 'Department code is required' })
    .trim()
    .min(1, 'Department code is required')
    .max(20, 'Department code must not exceed 20 characters'),
  name: z
    .string({ required_error: 'Department name is required' })
    .trim()
    .min(1, 'Department name is required')
    .max(100, 'Department name must not exceed 100 characters'),
  officeHead: z
    .string()
    .trim()
    .max(100, 'Office head must not exceed 100 characters')
    .optional(),
  contactNumber: z
    .string()
    .trim()
    .max(20, 'Contact number must not exceed 20 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(100, 'Email must not exceed 100 characters')
    .optional(),
  officeAddress: z
    .string()
    .trim()
    .max(255, 'Office address must not exceed 255 characters')
    .optional(),
  status: z
    .enum(USER_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid status selected' }),
    })
    .optional()
    .default('Active'),
});

/**
 * Zod schema for updating an existing department (partial updates)
 */
export const updateDepartmentSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Department code must not be empty')
    .max(20, 'Department code must not exceed 20 characters')
    .optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Department name must not be empty')
    .max(100, 'Department name must not exceed 100 characters')
    .optional(),
  officeHead: z
    .string()
    .trim()
    .max(100, 'Office head must not exceed 100 characters')
    .optional(),
  contactNumber: z
    .string()
    .trim()
    .max(20, 'Contact number must not exceed 20 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(100, 'Email must not exceed 100 characters')
    .optional(),
  officeAddress: z
    .string()
    .trim()
    .max(255, 'Office address must not exceed 255 characters')
    .optional(),
  status: z
    .enum(USER_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid status selected' }),
    })
    .optional(),
});

/**
 * Zod schema for department query parameters (filtering, pagination, search)
 */
export const departmentQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10)),
  code: z.string().optional(),
  name: z.string().optional(),
  officeHead: z.string().optional(),
  contactNumber: z.string().optional(),
  email: z.string().optional(),
  officeAddress: z.string().optional(),
  status: z.enum(USER_STATUS_LIST).optional(),
  sortBy: z
    .enum(['code', 'name', 'officeHead', 'contactNumber', 'email', 'officeAddress', 'status', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});