// src/app.ts
// Express application factory — separate from server startup for testability.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { conversationsRouter } from './routes/conversations.js';
import { bookingsRouter } from './routes/bookings.js';
import { projectsRouter } from './routes/projects.js';
import { surveysRouter } from './routes/surveys.js';
import { mediaRouter } from './routes/media.js';
import { reportsRouter } from './routes/reports.js';
import { publicationsRouter } from './routes/publications.js';
import { portalRouter } from './routes/portal.js';
import { directoryRouter } from './routes/directory.js';
import { planningRouter } from './routes/planning.js';
import { acceptanceRouter } from './routes/acceptance.js';
import { approvalsRouter } from './routes/approvals.js';
import { contractsRouter } from './routes/contracts.js';

export function createApp(): express.Application {
  const app = express();

  // Prisma returns BigInt for byte counts; JSON has no BigInt type.
  app.set('json replacer', (_key: string, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value,
  );

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Idempotency-Key'],
    }),
  );

  // ── Global rate limit ─────────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down.' } },
    }),
  );

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ── Request logging (no personal data) ───────────────────────────────────
  app.use(requestLogger);

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/conversations', conversationsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/visits', bookingsRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/surveys', surveysRouter);
  app.use('/api/media', mediaRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/publications', publicationsRouter);
  app.use('/api/portal', portalRouter);
  app.use('/api/directory', directoryRouter);
  app.use('/api/planning', planningRouter);
  app.use('/api/acceptance', acceptanceRouter);
  app.use('/api/approvals', approvalsRouter);
  app.use('/api/contracts', contractsRouter);

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // ── Central error handler (must be last) ──────────────────────────────────
  app.use(errorHandler);

  return app;
}
