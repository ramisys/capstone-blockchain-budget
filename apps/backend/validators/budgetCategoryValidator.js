import { z } from 'zod';
import { USER_STATUS_LIST } from '../constants/status.js';

/**
 * Zod schema for creating a new budget category
 */
export const createBudgetCategorySchema = z.object({
  code: z
    .string({ required_error: 'Budget category code is required' })
    .trim()
    .min(1, 'Budget category code is required')
    .max(20, 'Budget category code must not exceed 20 characters'),
  name: z
    .string({ required_error: 'Budget category name is required' })
    .trim()
    .min(1, 'Budget category name is required')
    .max(100, 'Budget category name must not exceed 100 characters'),
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
 * Zod schema for updating an existing budget category (partial updates)
 */
export const updateBudgetCategorySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Budget category code must not be empty')
    .max(20, 'Budget category code must not exceed 20 characters')
    .optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Budget category name must not be empty')
    .max(100, 'Budget category name must not exceed 100 characters')
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
 * Zod schema for budget category query parameters (filtering, pagination, search)
 */
export const budgetCategoryQuerySchema = z.object({
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
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(USER_STATUS_LIST).optional(),
  sortBy: z
    .enum(['code', 'name', 'description', 'status', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});