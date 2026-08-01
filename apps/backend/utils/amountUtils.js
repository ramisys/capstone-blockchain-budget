import { Prisma } from '@prisma/client';

/**
 * Maximum value accepted for monetary amounts stored in DECIMAL(14, 2).
 */
export const MAX_AMOUNT = 999999999999.99;

/**
 * Convert a Prisma.Decimal (or number/string/null) into a plain JS number.
 *
 * DECIMAL columns are returned as Prisma.Decimal instances which JSON-serialize
 * as strings. This helper normalizes them so API responses and tests work with
 * plain numbers without floating-point drift for values up to MAX_AMOUNT.
 *
 * @param {import('@prisma/client').Prisma.Decimal | number | string | null | undefined} value
 * @returns {number}
 */
export const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value instanceof Prisma.Decimal) return value.toNumber();
  return Number(value);
};
