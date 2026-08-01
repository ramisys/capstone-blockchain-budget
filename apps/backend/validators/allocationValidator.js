import { z } from 'zod';
import { ALLOCATION_STATUS_LIST } from '../constants/allocationStatus.js';
import { MAX_AMOUNT } from '../utils/amountUtils.js';

/**
 * Zod schema for creating a new budget allocation.
 *
 * Status is intentionally not accepted: allocations always start as Draft and
 * move through the workflow managed in Phase 4.3.
 */
export const createAllocationSchema = z.object({
  fiscalYearId: z
    .string({ required_error: 'Fiscal year is required' })
    .trim()
    .min(1, 'Fiscal year is required'),
  departmentId: z
    .string({ required_error: 'Department is required' })
    .trim()
    .min(1, 'Department is required'),
  fundSourceId: z
    .string({ required_error: 'Fund source is required' })
    .trim()
    .min(1, 'Fund source is required'),
  categoryId: z
    .string({ required_error: 'Budget category is required' })
    .trim()
    .min(1, 'Budget category is required'),
  programId: z
    .string({ required_error: 'Budget program is required' })
    .trim()
    .min(1, 'Budget program is required'),
  allocatedAmount: z
    .number({
      required_error: 'Allocated amount is required',
      invalid_type_error: 'Allocated amount must be a number',
    })
    .positive('Allocated amount must be greater than zero')
    .max(MAX_AMOUNT, 'Allocated amount is too large'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
});

/**
 * Zod schema for updating an existing budget allocation.
 *
 * Only Draft allocations are editable. Fiscal year, allocation code, status,
 * and creator are immutable; the fiscal year is tied to the generated code.
 */
export const updateAllocationSchema = z.object({
  departmentId: z
    .string()
    .trim()
    .min(1, 'Department must not be empty')
    .optional(),
  fundSourceId: z
    .string()
    .trim()
    .min(1, 'Fund source must not be empty')
    .optional(),
  categoryId: z
    .string()
    .trim()
    .min(1, 'Budget category must not be empty')
    .optional(),
  programId: z
    .string()
    .trim()
    .min(1, 'Budget program must not be empty')
    .optional(),
  allocatedAmount: z
    .number({
      invalid_type_error: 'Allocated amount must be a number',
    })
    .positive('Allocated amount must be greater than zero')
    .max(MAX_AMOUNT, 'Allocated amount is too large')
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
});

/**
 * Zod schema for query parameters (filtering, pagination, search, sorting).
 */
export const allocationQuerySchema = z.object({
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
  search: z.string().optional(),
  fiscalYearId: z.string().optional(),
  departmentId: z.string().optional(),
  fundSourceId: z.string().optional(),
  categoryId: z.string().optional(),
  programId: z.string().optional(),
  status: z
    .enum(ALLOCATION_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid allocation status' }),
    })
    .optional(),
  dateFrom: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid dateFrom value' })
    .optional(),
  dateTo: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid dateTo value' })
    .optional(),
  sortBy: z
    .enum([
      'newest',
      'oldest',
      'highest',
      'lowest',
      'code',
      'department',
      'createdAt',
      'allocatedAmount',
      'allocationCode',
    ])
    .optional()
    .default('newest'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Zod schema for the dashboard statistics endpoint.
 */
export const allocationStatisticsSchema = z.object({
  fiscalYearId: z.string().optional(),
});

/**
 * Zod schema for the remaining budget endpoint.
 */
export const remainingBudgetQuerySchema = z.object({
  fiscalYearId: z.string().optional(),
  fundSourceId: z.string().optional(),
  departmentId: z.string().optional(),
});
