// ─────────────────────────────────────────────────────────────────────────────
// Auth middleware tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Env vars are provided by vitest.config.ts

import { signAccessToken, signStepUpToken } from '../auth/tokens.js';
import { requireAuth, requireMfa, requireStepUp, requireRole } from './auth.middleware.js';

function mockRes(): { status: any; json: any; _status?: number; _body?: any } {
  const res: any = {};
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockImplementation((s: number) => { res._status = s; return res; });
  return res;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { headers: {}, ...overrides } as Request;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('requireAuth middleware', () => {
  it('calls next() with valid Bearer token', () => {
    const token = signAccessToken({ sub: 'u1', role: 'CLIENT', mfaVerified: false });
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).auth.userId).toBe('u1');
  });

  it('returns 401 when Authorization header is missing', () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a tampered token', () => {
    const token = signAccessToken({ sub: 'u1', role: 'CLIENT', mfaVerified: false });
    const tampered = token.slice(0, -4) + 'ZZZZ';
    const req = mockReq({ headers: { authorization: `Bearer ${tampered}` } });
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireMfa middleware', () => {
  it('calls next() when mfaVerified is true', () => {
    const token = signAccessToken({ sub: 'u1', role: 'CLIENT', mfaVerified: true });
    const req: any = mockReq({ headers: { authorization: `Bearer ${token}` } });
    req.auth = { sub: 'u1', userId: 'u1', role: 'CLIENT', mfaVerified: true };
    const res = mockRes();
    const next = vi.fn();

    requireMfa(req, res as any, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when mfaVerified is false', () => {
    const req: any = mockReq();
    req.auth = { userId: 'u1', role: 'CLIENT', mfaVerified: false };
    const res = mockRes();
    const next = vi.fn();

    requireMfa(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireStepUp middleware', () => {
  it('calls next() for a valid step-up token', () => {
    const req: any = mockReq();
    req.auth = { userId: 'u1', role: 'ADMIN_MANAGEMENT', mfaVerified: true, stepUp: true };
    const res = mockRes();
    const next = vi.fn();

    requireStepUp(req, res as any, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 for a regular access token (no stepUp flag)', () => {
    const req: any = mockReq();
    req.auth = { userId: 'u1', role: 'ADMIN_MANAGEMENT', mfaVerified: true, stepUp: false };
    const res = mockRes();
    const next = vi.fn();

    requireStepUp(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireRole middleware', () => {
  it('calls next() when role matches', () => {
    const req: any = mockReq();
    req.auth = { userId: 'u1', role: 'LEAD_ARCHITECT', mfaVerified: true };
    const res = mockRes();
    const next = vi.fn();

    requireRole('LEAD_ARCHITECT', 'ADMIN_MANAGEMENT')(req, res as any, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when role does not match', () => {
    const req: any = mockReq();
    req.auth = { userId: 'u1', role: 'CLIENT', mfaVerified: true };
    const res = mockRes();
    const next = vi.fn();

    requireRole('LEAD_ARCHITECT', 'ADMIN_MANAGEMENT')(req, res as any, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
