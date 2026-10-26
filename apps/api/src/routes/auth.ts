// ─────────────────────────────────────────────────────────────────────────────
// Auth routes — all public except /me, /refresh (cookie), /logout, /mfa/*
// Rate limiting is applied at the router level.
// Refresh token is set as an httpOnly, Secure, SameSite=Strict cookie.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  login,
  verifyMfaAndIssueTokens,
  issueStepUpToken,
  refreshTokens,
  logout,
  logoutAll,
  initiateMfaSetup,
  confirmMfaSetup,
  disableMfa,
  AuthError,
} from '../auth/auth.service.js';
import { requireAuth, requireMfa } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { config } from '../config.js';

export const authRouter = Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' },
  keyGenerator: (req) => req.ip ?? 'unknown',
});

const mfaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: 'RATE_LIMITED', message: 'Too many MFA attempts. Try again in 5 minutes.' },
  keyGenerator: (req) => req.ip ?? 'unknown',
});

// ── Schemas ───────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});

const MfaVerifySchema = z.object({
  body: z.object({
    mfaToken: z.string().min(10),
    code: z.string().min(6).max(8).regex(/^\d+$/),
  }),
});

const StepUpSchema = z.object({
  body: z.object({
    code: z.string().min(6).max(8).regex(/^\d+$/),
  }),
});

const MfaConfirmSchema = z.object({
  body: z.object({
    code: z.string().min(6).max(8).regex(/^\d+$/),
  }),
});

const MfaDisableSchema = z.object({
  body: z.object({
    code: z.string().min(6).max(8).regex(/^\d+$/),
    reason: z.string().min(5).max(500),
  }),
});

// ── Cookie helpers ────────────────────────────────────────────────────────────

const REFRESH_COOKIE = 'mbms_refresh';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: config.JWT_REFRESH_EXPIRY_MS,
    path: '/api/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

// ── Error handler ─────────────────────────────────────────────────────────────

function handleAuthError(err: unknown, res: Response): void {
  if (err instanceof AuthError) {
    const status =
      err.code === 'INVALID_CREDENTIALS' || err.code === 'ACCOUNT_INACTIVE'
        ? 401
        : err.code === 'ACCOUNT_LOCKED' || err.code === 'RATE_LIMITED'
          ? 429
          : err.code === 'MFA_REQUIRED' || err.code === 'STEP_UP_REQUIRED'
            ? 403
            : 400;
    res.status(status).json({ error: err.code, message: err.message });
  } else {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Authentication failed' });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ═════════════════════════════════════════════════════════════════════════════

authRouter.post('/login', loginLimiter, validate(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body as z.infer<typeof LoginSchema>['body'];
    const result = await login(email, password, req.ip, req.get('user-agent'));

    if (result.requiresMfa) {
      res.status(200).json({ requiresMfa: true, mfaToken: result.mfaToken });
      return;
    }

    setRefreshCookie(res, result.refreshToken!);
    res.status(200).json({ accessToken: result.accessToken });
  } catch (err) {
    handleAuthError(err, res);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/mfa/verify  — second factor after login
// ═════════════════════════════════════════════════════════════════════════════

authRouter.post('/mfa/verify', mfaLimiter, validate(MfaVerifySchema), async (req, res) => {
  try {
    const { mfaToken, code } = req.body as z.infer<typeof MfaVerifySchema>['body'];
    const pair = await verifyMfaAndIssueTokens(mfaToken, code, req.ip, req.get('user-agent'));

    setRefreshCookie(res, pair.refreshToken);
    res.status(200).json({ accessToken: pair.accessToken });
  } catch (err) {
    handleAuthError(err, res);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/step-up  — re-authenticate for critical operations
// ═════════════════════════════════════════════════════════════════════════════

authRouter.post('/step-up', requireAuth, mfaLimiter, validate(StepUpSchema), async (req, res) => {
  try {
    const { code } = req.body as z.infer<typeof StepUpSchema>['body'];
    const stepUpToken = await issueStepUpToken(
      req.auth!.userId,
      req.auth!.role,
      code,
      req.ip,
      req.get('user-agent'),
    );
    res.status(200).json({ stepUpToken });
  } catch (err) {
    handleAuthError(err, res);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/refresh  — rotate refresh token from httpOnly cookie
// ═════════════════════════════════════════════════════════════════════════════

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    res.status(401).json({ error: 'NO_REFRESH_TOKEN', message: 'No refresh token' });
    return;
  }
  try {
    const pair = await refreshTokens(token, req.ip, req.get('user-agent'));
    setRefreshCookie(res, pair.refreshToken);
    res.status(200).json({ accessToken: pair.accessToken });
  } catch (err) {
    clearRefreshCookie(res);
    handleAuthError(err, res);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/logout
// ═════════════════════════════════════════════════════════════════════════════

authRouter.post('/logout', requireAuth, async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await logout(token, req.auth!.userId, req.ip, req.get('user-agent'));
  }
  clearRefreshCookie(res);
  res.status(204).send();
});

authRouter.post('/logout-all', requireAuth, async (req, res) => {
  await logoutAll(req.auth!.userId, req.ip, req.get('user-agent'));
  clearRefreshCookie(res);
  res.status(204).send();
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me — current user info (no passwords, no secrets)
// ═════════════════════════════════════════════════════════════════════════════

authRouter.get('/me', requireAuth, async (req, res) => {
  const { db } = await import('../db/client.js');
  const user = await db.user.findUnique({
    where: { id: req.auth!.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true },
  });
  if (!user) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    return;
  }
  const mfa = await db.userMfa.findUnique({ where: { userId: user.id }, select: { enabled: true } });
  res.json({ ...user, mfaEnabled: mfa?.enabled ?? false });
});

// ═════════════════════════════════════════════════════════════════════════════
// MFA setup routes (authenticated users only)
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/auth/mfa/setup — generate secret and QR code
authRouter.post('/mfa/setup', requireAuth, async (req, res) => {
  const { db } = await import('../db/client.js');
  const user = await db.user.findUnique({ where: { id: req.auth!.userId }, select: { email: true } });
  if (!user) { res.status(404).json({ error: 'NOT_FOUND' }); return; }

  try {
    const result = await initiateMfaSetup(req.auth!.userId, user.email);
    // Return QR code and backup codes ONCE — never again
    res.status(200).json({
      qrCodeDataUrl: result.qrCodeDataUrl,
      backupCodes: result.backupCodes,
      message: 'Save your backup codes now — they will not be shown again.',
    });
  } catch (err) {
    handleAuthError(err, res);
  }
});

// POST /api/auth/mfa/confirm — confirm setup with a valid TOTP code
authRouter.post('/mfa/confirm', requireAuth, mfaLimiter, validate(MfaConfirmSchema), async (req, res) => {
  try {
    const { code } = req.body as z.infer<typeof MfaConfirmSchema>['body'];
    await confirmMfaSetup(req.auth!.userId, code);
    res.status(200).json({ message: 'MFA enabled successfully' });
  } catch (err) {
    handleAuthError(err, res);
  }
});

// POST /api/auth/mfa/disable — disable MFA (requires current TOTP + reason)
authRouter.post('/mfa/disable', requireAuth, requireMfa, mfaLimiter, validate(MfaDisableSchema), async (req, res) => {
  try {
    const { code, reason } = req.body as z.infer<typeof MfaDisableSchema>['body'];
    await disableMfa(req.auth!.userId, code, reason, req.auth!.userId);
    res.status(200).json({ message: 'MFA disabled' });
  } catch (err) {
    handleAuthError(err, res);
  }
});
