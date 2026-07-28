import morgan from 'morgan';
import { config } from '../config/env.js';

/**
 * Configure Morgan request logger middleware.
 */
export const requestLogger = morgan(
  config.nodeEnv === 'development' ? 'dev' : 'combined'
);
