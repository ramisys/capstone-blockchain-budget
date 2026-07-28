import { PrismaClient } from '@prisma/client';

/**
 * Singleton instance of PrismaClient for database access.
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;
