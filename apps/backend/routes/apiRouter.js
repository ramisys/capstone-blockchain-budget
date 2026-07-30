import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const apiRouter = Router();

// Mount authentication feature routes
apiRouter.use('/auth', authRoutes);

// Mount user management routes
apiRouter.use('/users', userRoutes);

// Mount dashboard routes
apiRouter.use('/dashboard', dashboardRoutes);

export default apiRouter;