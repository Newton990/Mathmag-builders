// src/middleware/requestLogger.ts
// Logs method, path, status and duration. No query strings, bodies, or auth headers.
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  // Mask the path after ?  (no query string in logs)
  const safePath = req.path;

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: safePath,
      status: res.statusCode,
      durationMs: duration,
    });
  });

  next();
}
