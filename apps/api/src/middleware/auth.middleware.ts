// ─────────────────────────────────────────────────────────────────────────────
// requireAuth middleware — validates JWT, loads minimal user context
// requireStepUp middleware — enforces step-up token for critical operations
// requireRole middleware — role-based access control
// ─────────────────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type AccessTokenPayload } from '../auth/tokens.js';
import { logger } from '../logger.js';

// Extend Express Request to carry the authenticated user context
declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload & { userId: string };
    }
  }
}

// ── requireAuth ───────────────────────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.auth = { ...payload, userId: payload.sub };
    next();
  } catch (err: unknown) {
    const expired = err instanceof Error && err.name === 'TokenExpiredError';
    res.status(401).json({
      error: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: expired ? 'Access token has expired' : 'Invalid access token',
    });
  }
}

// ── requireMfa — ensures the session passed MFA ───────────────────────────────

export function requireMfa(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated' });
    return;
  }
  if (!req.auth.mfaVerified) {
    res.status(403).json({ error: 'MFA_REQUIRED', message: 'MFA verification required' });
    return;
  }
  next();
}

// ── requireStepUp — enforces step-up token for highly sensitive operations ────

export function requireStepUp(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth?.stepUp) {
    res.status(403).json({
      error: 'STEP_UP_REQUIRED',
      message: 'This operation requires a fresh step-up MFA token',
    });
    return;
  }
  next();
}

// ── requireRole ───────────────────────────────────────────────────────────────

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      logger.warn({ userId: req.auth.userId, role: req.auth.role, required: roles }, 'Role check failed');
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Role '${req.auth.role}' is not permitted for this resource`,
      });
      return;
    }
    next();
  };
}

// ── requireOwnerOrRole — allows access if userId matches OR role is in list ──

export function requireOwnerOrRole(userIdParam: string, ...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }
    const paramId = req.params[userIdParam];
    if (req.auth.userId === paramId || roles.includes(req.auth.role)) {
      next();
      return;
    }
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
  };
}
