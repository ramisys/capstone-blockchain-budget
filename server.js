import app from './app.js';
import { config } from './config/env.js';
import prisma from './models/prismaClient.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Authentication Backend Server running on port ${PORT}`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
  console.log(`=======================================================`);
});

// Graceful Shutdown handling
const handleShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down server gracefully...`);
  server.close(async () => {
    console.log('HTTP Server closed.');
    await prisma.$disconnect();
    console.log('Prisma Database client disconnected.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});
