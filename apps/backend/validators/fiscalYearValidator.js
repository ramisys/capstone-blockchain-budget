import { z } from 'zod';
import { FISCAL_YEAR_STATUS_LIST } from '../constants/fiscalYearStatus.js';

/**
 * Zod schema for creating a new fiscal year
 */
export const createFiscalYearSchema = z.object({
  code: z
    .string({ required_error: 'Fiscal year code is required' })
    .trim()
    .min(1, 'Fiscal year code is required')
    .max(20, 'Fiscal year code must not exceed 20 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description is required')
    .max(255, 'Description must not exceed 255 characters'),
  startDate: z
    .string({ required_error: 'Start date is required' })
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid start date' }),
  endDate: z
    .string({ required_error: 'End date is required' })
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid end date' }),
  // Optional fields with defaults
  status: z
    .enum(FISCAL_YEAR_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid fiscal year status' }),
    })
    .optional()
    .default('Inactive'),
  isActive: z.boolean().optional().default(false),
});

/**
 * Zod schema for updating an existing fiscal year (partial updates)
 */
export const updateFiscalYearSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Fiscal year code is required')
    .max(20, 'Fiscal year code must not exceed 20 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(255, 'Description must not exceed 255 characters')
    .optional(),
  startDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid start date' })
    .optional(),
  endDate: z
    .string()
    .refine((date) => !isNaN(date.parse(date)), { message: 'Invalid end date' })
    .optional(),
  status: z
    .enum(FISCAL_YEAR_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid fiscal year status' }),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod schema for fiscal year query parameters (filtering, pagination, search)
 */
export const fiscalYearQuerySchema = z.object({
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
  description: z.string().optional(),
  status: z.enum(FISCAL_YEAR_STATUS_LIST).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z
    .enum(['code', 'description', 'startDate', 'endDate', 'status', 'isActive', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});