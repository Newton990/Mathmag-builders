// src/middleware/validate.ts
// Middleware factory that validates req.body against a Zod schema.
// Returns 400 with field-level errors on failure.
import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema } from 'zod';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          fields: result.error.flatten().fieldErrors,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
