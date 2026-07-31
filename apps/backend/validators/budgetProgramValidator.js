import { z } from 'zod';
import { USER_STATUS_LIST } from '../constants/status.js';

/**
 * Zod schema for creating a new budget program
 */
export const createBudgetProgramSchema = z.object({
  code: z
    .string({ required_error: 'Budget program code is required' })
    .trim()
    .min(1, 'Budget program code is required')
    .max(20, 'Budget program code must not exceed 20 characters'),
  name: z
    .string({ required_error: 'Budget program name is required' })
    .trim()
    .min(1, 'Budget program name is required')
    .max(100, 'Budget program name must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(255, 'Description must not exceed 255 characters')
    .optional(),
  departmentId: z
    .string({ required_error: 'Department ID is required' })
    .trim(),
  budgetCategoryId: z
    .string({ required_error: 'Budget category ID is required' })
    .trim(),
  status: z
    .enum(USER_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid status selected' }),
    })
    .optional()
    .default('Active'),
});

/**
 * Zod schema for updating an existing budget program (partial updates)
 */
export const updateBudgetProgramSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Budget program code must not be empty')
    .max(20, 'Budget program code must not exceed 20 characters')
    .optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Budget program name must not be empty')
    .max(100, 'Budget program name must not exceed 100 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, 'Description must not exceed 255 characters')
    .optional(),
  departmentId: z
    .string()
    .trim()
    .optional(),
  budgetCategoryId: z
    .string()
    .trim()
    .optional(),
  status: z
    .enum(USER_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid status selected' }),
    })
    .optional(),
});

/**
 * Zod schema for budget program query parameters (filtering, pagination, search)
 */
export const budgetProgramQuerySchema = z.object({
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
  departmentId: z.string().optional(),
  budgetCategoryId: z.string().optional(),
  status: z.enum(USER_STATUS_LIST).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['code', 'name', 'description', 'departmentId', 'budgetCategoryId', 'status', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});