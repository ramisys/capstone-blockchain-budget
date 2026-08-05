import { z } from 'zod';
import { BLOCKCHAIN_RECORD_STATUS_LIST } from '../constants/blockchainStatus.js';
import { LEDGER_RECORD_TYPES_LIST } from '../constants/ledgerTypes.js';

/**
 * Zod schema for blockchain transaction history query parameters.
 */
export const blockchainQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100, 'Limit cannot exceed 100')),
  search: z.string().optional(),
  allocationId: z.string().optional(),
  status: z
    .enum(BLOCKCHAIN_RECORD_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid blockchain record status' }),
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
    .enum(['newest', 'oldest', 'status', 'allocationCode', 'createdAt'])
    .optional()
    .default('newest'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Zod schema for the :id route parameter on blockchain allocation routes.
 */
export const allocationIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Allocation ID is required' })
    .trim()
    .min(1, 'Allocation ID is required')
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      'Invalid allocation ID'
    ),
});

/**
 * Zod schema for the unified ledger history query parameters. `recordType`
 * limits the union to a single source table; the remaining filters (search,
 * status, date range) are applied per source.
 */
export const blockchainHistoryQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100, 'Limit cannot exceed 100')),
  search: z.string().optional(),
  recordType: z
    .enum(LEDGER_RECORD_TYPES_LIST, {
      errorMap: () => ({ message: 'Invalid ledger record type' }),
    })
    .optional(),
  status: z
    .enum(BLOCKCHAIN_RECORD_STATUS_LIST, {
      errorMap: () => ({ message: 'Invalid blockchain record status' }),
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
    .enum(['newest', 'oldest', 'recordType', 'code', 'status', 'createdAt'])
    .optional()
    .default('newest'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Zod schema for the :id route parameter on the unified transaction detail route.
 */
export const transactionIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Transaction ID is required' })
    .trim()
    .min(1, 'Transaction ID is required')
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      'Invalid transaction ID'
    ),
});

/**
 * Zod schema for the recordType query parameter that disambiguates the
 * transaction detail lookup across the unified tables.
 */
export const transactionDetailQuerySchema = z.object({
  recordType: z
    .enum(LEDGER_RECORD_TYPES_LIST, {
      errorMap: () => ({ message: 'Invalid ledger record type' }),
    })
    .optional(),
});
