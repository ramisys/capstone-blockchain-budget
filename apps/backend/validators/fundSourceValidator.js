import { z } from 'zod';
import { USER_STATUS_LIST } from '../constants/status.js';

/**
 * Zod schema for creating a new fund source
 */
export const createFundSourceSchema = z.object({
  code: z
    .string({ required_error: 'Fund source code is required' })
    .trim()
    .min(1, 'Fund source code is required')
    .max(20, 'Fund source code must not exceed 20 characters'),
  name: z
    .string({ required_error: 'Fund source name is required' })
    .trim()
    .min(1, 'Fund source name is required')
    .max(100, 'Fund source name must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(255, 'Description must not exceed 255 characters')
    .optional(),
  status: z
    .enum(USER_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid status selected' }),
    })
    .optional()
    .default('Active'),
});

/**
 * Zod schema for updating an existing fund source (partial updates)
 */
export const updateFundSourceSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Fund source code must not be empty')
    .max(20, 'Fund source code must not exceed 20 characters')
    .optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Fund source name must not be empty')
    .max(100, 'Fund source name must not exceed 100 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, 'Description must not exceed 255 characters')
    .optional(),
  status: z
    .enum(USER_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid status selected' }),
    })
    .optional(),
});

/**
 * Zod schema for fund source query parameters (filtering, pagination, search)
 */
export const fundSourceQuerySchema = z.object({
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
  description: z.string().optional(),
  status: z.enum(USER_STATUS_LIST).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['code', 'name', 'description', 'status', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});