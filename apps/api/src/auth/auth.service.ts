// ─────────────────────────────────────────────────────────────────────────────
// Auth service — login, refresh, logout, MFA setup, MFA verify, step-up
// All critical decisions (wrong password, locked account, etc.) are audit-logged.
// ─────────────────────────────────────────────────────────────────────────────

import argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { db } from '../db/client.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import {
  signAccessToken,
  signStepUpToken,
  verifyAccessToken,
  generateRefreshToken,
  type AccessTokenPayload,
} from './tokens.js';
import {
  generateMfaSecret,
  buildTotpUri,
  verifyTotp,
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
} from './mfa.js';
import { auditService } from '../services/audit.service.js';
import * as QRCode from 'qrcode';

// ── Argon2 parameters (tuned for server, not mobile) ─────────────────────────
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoginResult {
  requiresMfa: boolean;
  mfaToken?: string;        // short-lived ephemeral token to present at /auth/mfa/verify
  accessToken?: string;
  refreshToken?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<LoginResult> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Constant-time rejection for unknown users (prevents timing oracle)
  if (!user) {
    await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$dummy$dummy', 'dummy').catch(() => {});
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Account lock check
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AuthError(
      'ACCOUNT_LOCKED',
      `Account locked until ${user.lockedUntil.toISOString()}`,
    );
  }

  if (!user.isActive) {
    throw new AuthError('ACCOUNT_INACTIVE', 'Account is deactivated');
  }

  const valid = await argon2.verify(user.passwordHash, password);

  if (!valid) {
    const attempts = user.failedAttempts + 1;
    const lockUntil =
      attempts >= config.AUTH_MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + config.AUTH_LOCKOUT_DURATION_MS)
        : undefined;

    await db.user.update({
      where: { id: user.id },
      data: { failedAttempts: attempts, lockedUntil: lockUntil ?? undefined },
    });

    await auditService.log({
      actorId: user.id,
      action: 'AUTH_LOGIN_FAILED',
      entityType: 'User',
      entityId: user.id,
      reason: `Failed attempt ${attempts}/${config.AUTH_MAX_FAILED_ATTEMPTS}`,
      ipAddress,
      userAgent,
    });

    if (lockUntil) {
      throw new AuthError('ACCOUNT_LOCKED', `Too many attempts. Account locked for ${config.AUTH_LOCKOUT_DURATION_MS / 60000} minutes.`);
    }
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Reset failed attempts on success
  await db.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  // Check if MFA is configured
  const mfaRecord = await db.userMfa.findUnique({ where: { userId: user.id } });

  if (mfaRecord?.enabled) {
    // Issue a short-lived MFA challenge token (not a full access token)
    const mfaToken = signAccessToken({
      sub: user.id,
      role: user.role,
      mfaVerified: false,
    });

    await auditService.log({
      actorId: user.id,
      action: 'AUTH_MFA_CHALLENGE_ISSUED',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return { requiresMfa: true, mfaToken };
  }

  // No MFA — issue full tokens
  const pair = await issueTokenPair(user.id, user.role, false, ipAddress, userAgent);

  await auditService.log({
    actorId: user.id,
    action: 'AUTH_LOGIN_SUCCESS',
    entityType: 'User',
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  return { requiresMfa: false, ...pair };
}

// ── MFA verify (second factor) ────────────────────────────────────────────────

export async function verifyMfaAndIssueTokens(
  mfaToken: string,
  totpCode: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<TokenPair> {
  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(mfaToken);
  } catch {
    throw new AuthError('INVALID_TOKEN', 'MFA challenge token is invalid or expired');
  }

  if (payload.mfaVerified) {
    throw new AuthError('INVALID_TOKEN', 'Token already verified');
  }

  const mfaRecord = await db.userMfa.findUnique({ where: { userId: payload.sub } });
  if (!mfaRecord?.enabled) {
    throw new AuthError('MFA_NOT_CONFIGURED', 'MFA not configured for this account');
  }

  const secret = decryptSecret(mfaRecord.encryptedSecret);
  const valid = verifyTotp(secret, totpCode);

  if (!valid) {
    // Check backup codes
    const backupMatch = mfaRecord.backupCodeHashes.find((h) => h === hashBackupCode(totpCode));
    if (!backupMatch) {
      await auditService.log({
        actorId: payload.sub,
        action: 'AUTH_MFA_VERIFY_FAILED',
        entityType: 'User',
        entityId: payload.sub,
        ipAddress,
        userAgent,
      });
      throw new AuthError('INVALID_MFA_CODE', 'Invalid MFA code');
    }

    // Consume backup code (remove it so it can't be reused)
    await db.userMfa.update({
      where: { userId: payload.sub },
      data: {
        backupCodeHashes: mfaRecord.backupCodeHashes.filter((h) => h !== backupMatch),
      },
    });
  }

  const pair = await issueTokenPair(payload.sub, payload.role, true, ipAddress, userAgent);

  await auditService.log({
    actorId: payload.sub,
    action: 'AUTH_MFA_VERIFY_SUCCESS',
    entityType: 'User',
    entityId: payload.sub,
    ipAddress,
    userAgent,
  });

  return pair;
}

// ── Step-up (critical operations: sign contracts, approve payments, etc.) ──────

export async function issueStepUpToken(
  userId: string,
  role: string,
  totpCode: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<string> {
  const mfaRecord = await db.userMfa.findUnique({ where: { userId } });
  if (!mfaRecord?.enabled) {
    throw new AuthError('MFA_REQUIRED', 'Step-up requires MFA to be enabled');
  }

  const secret = decryptSecret(mfaRecord.encryptedSecret);
  if (!verifyTotp(secret, totpCode)) {
    await auditService.log({
      actorId: userId,
      action: 'AUTH_STEP_UP_FAILED',
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
    throw new AuthError('INVALID_MFA_CODE', 'Invalid step-up code');
  }

  await auditService.log({
    actorId: userId,
    action: 'AUTH_STEP_UP_ISSUED',
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
  });

  return signStepUpToken(userId, role);
}

// ── Refresh ───────────────────────────────────────────────────────────────────

export async function refreshTokens(
  rawRefreshToken: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<TokenPair> {
  const record = await db.refreshToken.findUnique({
    where: { token: rawRefreshToken },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    if (record && !record.revokedAt) {
      // Token reuse detected — revoke all tokens for this user (rotation attack)
      await db.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'REUSE_DETECTED' },
      });
      await auditService.log({
        actorId: record.userId,
        action: 'AUTH_REFRESH_TOKEN_REUSE',
        entityType: 'User',
        entityId: record.userId,
        ipAddress,
        userAgent,
      });
    }
    throw new AuthError('INVALID_TOKEN', 'Refresh token is invalid, expired or revoked');
  }

  if (!record.user.isActive) {
    throw new AuthError('ACCOUNT_INACTIVE', 'Account is deactivated');
  }

  // Rotate: revoke old, issue new
  await db.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date(), revokeReason: 'ROTATED' },
  });

  const mfaVerified = record.mfaVerified;
  return issueTokenPair(record.userId, record.user.role, mfaVerified, ipAddress, userAgent);
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout(
  rawRefreshToken: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await db.refreshToken.updateMany({
    where: { token: rawRefreshToken, userId, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: 'LOGOUT' },
  });

  await auditService.log({
    actorId: userId,
    action: 'AUTH_LOGOUT',
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
  });
}

export async function logoutAll(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
  await db.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: 'LOGOUT_ALL' },
  });

  await auditService.log({
    actorId: userId,
    action: 'AUTH_LOGOUT_ALL',
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
  });
}

// ── MFA Setup ─────────────────────────────────────────────────────────────────

export async function initiateMfaSetup(
  userId: string,
  userEmail: string,
): Promise<{ qrCodeDataUrl: string; backupCodes: string[] }> {
  const secret = generateMfaSecret();
  const uri = buildTotpUri(secret, userEmail);
  const qrCodeDataUrl = await QRCode.toDataURL(uri);
  const backupCodes = generateBackupCodes(8);

  const encryptedSecret = encryptSecret(secret);
  const backupCodeHashes = backupCodes.map(hashBackupCode);

  // Store pending — not yet enabled until user confirms with a valid TOTP
  await db.userMfa.upsert({
    where: { userId },
    create: {
      userId,
      encryptedSecret,
      backupCodeHashes,
      enabled: false, // enabled only after confirmation
    },
    update: {
      encryptedSecret,
      backupCodeHashes,
      enabled: false,
    },
  });

  return { qrCodeDataUrl, backupCodes };
}

export async function confirmMfaSetup(userId: string, totpCode: string): Promise<void> {
  const record = await db.userMfa.findUnique({ where: { userId } });
  if (!record) throw new AuthError('MFA_NOT_INITIATED', 'Call /auth/mfa/setup first');

  const secret = decryptSecret(record.encryptedSecret);
  if (!verifyTotp(secret, totpCode)) {
    throw new AuthError('INVALID_MFA_CODE', 'TOTP code does not match — scan again');
  }

  await db.userMfa.update({ where: { userId }, data: { enabled: true, enabledAt: new Date() } });

  await auditService.log({
    actorId: userId,
    action: 'AUTH_MFA_ENABLED',
    entityType: 'User',
    entityId: userId,
  });
}

export async function disableMfa(
  userId: string,
  totpCode: string,
  reason: string,
  actorId: string,
): Promise<void> {
  const record = await db.userMfa.findUnique({ where: { userId } });
  if (!record?.enabled) throw new AuthError('MFA_NOT_CONFIGURED', 'MFA is not enabled');

  const secret = decryptSecret(record.encryptedSecret);
  if (!verifyTotp(secret, totpCode)) {
    throw new AuthError('INVALID_MFA_CODE', 'Invalid TOTP code');
  }

  await db.userMfa.update({
    where: { userId },
    data: { enabled: false, disabledAt: new Date() },
  });

  await auditService.log({
    actorId,
    action: 'AUTH_MFA_DISABLED',
    entityType: 'User',
    entityId: userId,
    reason,
  });
}

// ── Password hash ─────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function issueTokenPair(
  userId: string,
  role: string,
  mfaVerified: boolean,
  ipAddress?: string,
  userAgent?: string,
): Promise<TokenPair> {
  const accessToken = signAccessToken({ sub: userId, role, mfaVerified });
  const rawRefreshToken = generateRefreshToken();

  await db.refreshToken.create({
    data: {
      id: randomUUID(),
      userId,
      token: rawRefreshToken,
      mfaVerified,
      expiresAt: new Date(Date.now() + config.JWT_REFRESH_EXPIRY_MS),
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    },
  });

  return { accessToken, refreshToken: rawRefreshToken };
}

import { createHash } from 'node:crypto';
function hashBackupCode(code: string): string {
  return createHash('sha256').update(code.toUpperCase().replace(/\s/g, '')).digest('hex');
}

// ── Error class ───────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
