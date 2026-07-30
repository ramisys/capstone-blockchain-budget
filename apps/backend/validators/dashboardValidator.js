import { z } from 'zod';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';

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