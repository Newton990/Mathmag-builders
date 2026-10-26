// src/index.ts
// Server entry point. Loads config (fails fast on missing vars), then starts Express.
import { config } from './config.js';
import { createApp } from './app.js';
import { logger } from './logger.js';
import { prisma } from './db/client.js';

async function main(): Promise<void> {
  const app = createApp();

  // Verify DB connection before accepting traffic
  try {
    await prisma.$connect();
    logger.info('Database connection established');
  } catch (err) {
    logger.error({ msg: 'Failed to connect to database', error: String(err) });
    process.exit(1);
  }

  const server = app.listen(config.API_PORT, () => {
    logger.info(`MBMS API running on port ${config.API_PORT} [${config.NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Database disconnected. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void main();
