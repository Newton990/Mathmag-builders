// src/middleware/errorHandler.ts
// Central error handler. Stack traces shown only in development.
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger.js';
import { config } from '../config.js';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        fields: err.flatten().fieldErrors,
      },
    });
    return;
  }

  const status = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const message = status < 500 ? err.message : 'An unexpected error occurred';

  logger.error({
    code,
    message: err.message,
    path: req.path,
    method: req.method,
    ...(config.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });

  res.status(status).json({
    error: {
      code,
      message,
      ...(config.NODE_ENV === 'development' && status >= 500 ? { detail: err.message } : {}),
    },
  });
}

/** Convenience: create an HTTP error with a status code */
export function httpError(message: string, statusCode: number, code?: string): ApiError {
  const err = new Error(message) as ApiError;
  err.statusCode = statusCode;
  err.code = code ?? `HTTP_${statusCode}`;
  return err;
}
