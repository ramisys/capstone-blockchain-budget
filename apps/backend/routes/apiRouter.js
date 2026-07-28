import { Router } from 'express';
import authRoutes from './authRoutes.js';

const apiRouter = Router();

// Mount authentication feature routes
apiRouter.use('/auth', authRoutes);

export default apiRouter;
