import { config } from './env.js';

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.cors.origin === '*' || config.cors.origin.split(',').includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};
