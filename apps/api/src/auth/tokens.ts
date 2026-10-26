// ─────────────────────────────────────────────────────────────────────────────
// Auth tokens — JWT access + opaque refresh token pair
// Access token: 15 min, signed HS256, contains userId + role + mfaVerified
// Refresh token: 7 days, opaque UUID stored in DB (RefreshToken table)
// Step-up token: 5 min, issued after MFA verification for critical operations
// ─────────────────────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { config } from '../config.js';

export interface AccessTokenPayload {
  sub: string;        // userId
  role: string;       // UserRole
  mfaVerified: boolean;
  stepUp?: boolean;   // true only in short-lived step-up tokens
  iat?: number;
  exp?: number;
}

// ── Access token (short-lived, stateless) ────────────────────────────────────

export function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY_SECONDS,
    issuer: 'mbms',
    audience: 'mbms-api',
  });
}

export function signStepUpToken(userId: string, role: string): string {
  return jwt.sign(
    { sub: userId, role, mfaVerified: true, stepUp: true },
    config.JWT_SECRET,
    { expiresIn: config.JWT_STEP_UP_EXPIRY_SECONDS, issuer: 'mbms', audience: 'mbms-api' },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_SECRET, {
    issuer: 'mbms',
    audience: 'mbms-api',
  }) as AccessTokenPayload;
}

// ── Refresh token (opaque; stored in DB) ─────────────────────────────────────

export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex');
}
