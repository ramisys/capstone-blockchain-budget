import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import fiscalYearRoutes from './fiscalYearRoutes.js';
import fundSourceRoutes from './fundSourceRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import budgetCategoryRoutes from './budgetCategoryRoutes.js';
import budgetProgramRoutes from './budgetProgramRoutes.js';
import allocationRoutes from './allocationRoutes.js';
import blockchainRoutes from './blockchainRoutes.js';

const apiRouter = Router();

// Mount authentication feature routes
apiRouter.use('/auth', authRoutes);

// Mount user management routes
apiRouter.use('/users', userRoutes);

// Mount dashboard routes
apiRouter.use('/dashboard', dashboardRoutes);

// Mount fiscal year routes
apiRouter.use('/fiscal-years', fiscalYearRoutes);

// Mount fund source routes
apiRouter.use('/fund-sources', fundSourceRoutes);

// Mount department routes
apiRouter.use('/departments', departmentRoutes);

// Mount budget category routes
apiRouter.use('/budget-categories', budgetCategoryRoutes);

// Mount budget program routes
apiRouter.use('/budget-programs', budgetProgramRoutes);

// Mount budget allocation routes
apiRouter.use('/allocations', allocationRoutes);

// Mount blockchain ledger routes
apiRouter.use('/blockchain', blockchainRoutes);

export default apiRouter;