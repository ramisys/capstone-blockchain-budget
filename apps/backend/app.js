import express from 'express';
import { helmetOptions } from './config/helmet.js';
import { corsOptions } from './config/cors.js';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import apiRouter from './routes/apiRouter.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust reverse proxy (Nginx, AWS ALB, Cloudflare) for accurate client IP resolution
app.set('trust proxy', 1);

// Security Middlewares
app.use(helmetOptions);
app.use(cors(corsOptions));

// Logging Middleware
app.use(requestLogger);

// Body Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// API Routes with Global Rate Limiting
app.use('/api', globalLimiter, apiRouter);

// 404 & Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
