// src/db/client.ts
// Prisma client singleton — one connection pool for the whole process.
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger.js';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e) => {
  logger.error({ msg: 'Prisma error', target: e.target, message: e.message });
});

prisma.$on('warn', (e) => {
  logger.warn({ msg: 'Prisma warning', target: e.target, message: e.message });
});

export { prisma };
