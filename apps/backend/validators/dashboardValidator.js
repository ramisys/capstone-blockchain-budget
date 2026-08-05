import { z } from 'zod';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';
import { TIMELINE_KINDS_LIST } from '../constants/timelineKinds.js';

/**
 * Zod schema for dashboard statistics query parameters.
 * Currently no parameters are required, but we keep the schema for future extension.
 */
export const dashboardStatsSchema = z.object({
  // Future query parameters can be added here
  // Example: timeframe: z.enum(['today', 'week', 'month', 'year']).optional(),
});

/**
 * Zod schema for dashboard charts query parameters.
 * Currently no parameters are required, but we keep the schema for future extension.
 */
export const dashboardChartsSchema = z.object({
  // Future query parameters can be added here
  // Example: chartType: z.enum(['bar', 'pie', 'line']).optional(),
});

/**
 * Zod schema for dashboard activities query parameters.
 * Currently no parameters are required, but we keep the schema for future extension.
 */
export const dashboardActivitiesSchema = z.object({
  // Future query parameters can be added here
  // Example: limit: z.number().int().positive().optional(),
});

/**
 * Zod schema for dashboard notifications query parameters.
 * Currently no parameters are required, but we keep the schema for future extension.
 */
export const dashboardNotificationsSchema = z.object({
  // Future query parameters can be added here
  // Example: limit: z.number().int().positive().optional(),
});

/**
 * Zod schema for dashboard blockchain status query parameters.
 * Currently no parameters are required, but we keep the schema for future extension.
 */
export const dashboardBlockchainSchema = z.object({
  // Future query parameters can be added here
  // Example: network: z.string().optional(),
});

/**
 * Zod schema for the financial activity timeline query parameters. `kind`
 * limits the merged feed to a single source table; `dateFrom`/`dateTo` bound
 * the chronological window across all sources.
 */
export const timelineQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100, 'Limit cannot exceed 100')),
  kind: z
    .enum(TIMELINE_KINDS_LIST, {
      errorMap: () => ({ message: 'Invalid timeline kind' }),
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
    .enum(['newest', 'oldest', 'kind', 'action', 'createdAt'])
    .optional()
    .default('newest'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});