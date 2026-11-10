// ================================================================================
// MBMS — Authentication (Wasmer Edge)
// JWT verification using jsonwebtoken. No session storage — stateless.
// ================================================================================

import jwt from 'jsonwebtoken';
import { config } from './config.js';

export interface JWTPayload {
  sub: string;
  userId: string;
  email: string;
  role: string;
  mfaVerified?: boolean;
  stepUp?: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  mfaVerified: boolean;
  stepUp: boolean;
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    return payload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new Error('INVALID_TOKEN');
    }
    throw err;
  }
}

export function extractAuth(request: Request): AuthContext | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      mfaVerified: !!payload.mfaVerified,
      stepUp: !!payload.stepUp,
    };
  } catch {
    return null;
  }
}

export function requireAuth(request: Request): AuthContext {
  const auth = extractAuth(request);
  if (!auth) {
    throw new Error('UNAUTHORIZED');
  }
  return auth;
}

export function requireMfa(auth: AuthContext): void {
  if (!auth.mfaVerified) {
    throw new Error('MFA_REQUIRED');
  }
}

export function requireStepUp(auth: AuthContext): void {
  if (!auth.stepUp) {
    throw new Error('STEP_UP_REQUIRED');
  }
}

export function requireRole(auth: AuthContext, ...roles: string[]): void {
  if (!roles.includes(auth.role)) {
    throw new Error(`FORBIDDEN: Role '${auth.role}' not permitted`);
  }
}

export function isLeadArchitect(auth: AuthContext): boolean {
  return auth.role === 'LEAD_ARCHITECT';
}

export function isStaffRole(role: string): boolean {
  return role !== 'CLIENT';
}
