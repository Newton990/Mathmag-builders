// src/logger.ts — Structured logger using pino.
// IMPORTANT: Never log personal data, request bodies, or auth headers.
import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.logLevel,
  ...(config.nodeEnv === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      }
    : {}),
  // Redact any field that might contain personal data if accidentally logged
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token'],
    censor: '[REDACTED]',
  },
});
