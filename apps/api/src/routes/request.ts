// src/routes/request.ts
// Small typed accessors for validated request values.
import type { Request } from 'express';
import { httpError } from '../middleware/errorHandler.js';

/** Read a route parameter that validate() has already required. */
export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw httpError(`Missing route parameter: ${name}`, 400, 'MISSING_PARAMETER');
  }
  return value;
}
