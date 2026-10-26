// src/middleware/validate.ts
// Middleware factory that validates an envelope of { body, query, params }.
// Route schemas should declare the parts they use, e.g. z.object({ body: ... }).
// Validated values replace the raw request values, so handlers only ever see
// parsed/transformed data.
import type { Request, Response, NextFunction } from 'express';
import { type ZodTypeAny } from 'zod';

interface RequestEnvelope {
  body: unknown;
  query: unknown;
  params: unknown;
}

export function validate<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const envelope: RequestEnvelope = {
      body: req.body,
      query: req.query,
      params: req.params,
    };

    const result = schema.safeParse(envelope);
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

    const parsed = result.data as Partial<RequestEnvelope>;
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) req.query = parsed.query as Request['query'];
    if (parsed.params !== undefined) req.params = parsed.params as Request['params'];
    next();
  };
}
