import { z } from 'zod';

/**
 * Accepted audit result filter values. These mirror the Prisma `AuditResult`
 * enum values ('Success' / 'Failure') used by the `audit_logs` table.
 */
export const AUDIT_RESULT_LIST = ['Success', 'Failure'];

/**
 * Accepted audit anchor status filter values, mirroring the Prisma
 * `AuditAnchorStatus` enum.
 */
export const AUDIT_ANCHOR_STATUS_LIST = ['Pending', 'Confirmed', 'Failed'];

/**
 * Zod schema for audit log list query parameters.
 */
export const auditLogQuerySchema = z.object({
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
  action: z.string().optional(),
  result: z.enum(AUDIT_RESULT_LIST, {
    errorMap: () => ({ message: 'Invalid audit result' }),
  }).optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  actorId: z.string().optional(),
  anchorStatus: z.enum(AUDIT_ANCHOR_STATUS_LIST, {
    errorMap: () => ({ message: 'Invalid audit anchor status' }),
  }).optional(),
  dateFrom: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid dateFrom value' })
    .optional(),
  dateTo: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid dateTo value' })
    .optional(),
  sortBy: z
    .enum(['newest', 'oldest', 'action', 'result', 'actorEmail', 'createdAt'])
    .optional()
    .default('newest'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Zod schema for the :id route parameter on audit log routes.
 */
export const auditLogIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Audit log ID is required' })
    .trim()
    .min(1, 'Audit log ID is required')
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      'Invalid audit log ID'
    ),
});
