// src/middleware/asyncHandler.ts
// Express 4 does not catch rejected promises from async handlers, so every
// async route is wrapped here and forwarded to the central error handler.
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}
