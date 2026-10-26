// ─────────────────────────────────────────────────────────────────────────────
// Auth service unit tests — covers the pure logic without a real DB.
// DB calls are mocked via vi.mock.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Env vars are provided by vitest.config.ts — no stubEnv needed here.

// ── Mock DB ───────────────────────────────────────────────────────────────────
vi.mock('../db/client.js', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userMfa: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../services/audit.service.js', () => ({
  auditService: { log: vi.fn() },
}));

import { db } from '../db/client.js';
import { signAccessToken, signStepUpToken, verifyAccessToken } from './tokens.js';
import { encryptSecret, decryptSecret, generateMfaSecret, verifyTotp } from './mfa.js';
import { login, AuthError } from './auth.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// Token tests
// ─────────────────────────────────────────────────────────────────────────────

describe('JWT tokens', () => {
  it('signs and verifies an access token', () => {
    const token = signAccessToken({ sub: 'user-1', role: 'ADMIN_MANAGEMENT', mfaVerified: false });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('ADMIN_MANAGEMENT');
    expect(payload.mfaVerified).toBe(false);
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 'user-1', role: 'CLIENT', mfaVerified: true });
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('includes stepUp flag when signing step-up token', () => {
    const token = signStepUpToken('user-1', 'ADMIN_MANAGEMENT');
    const payload = verifyAccessToken(token);
    expect(payload.stepUp).toBe(true);
    expect(payload.mfaVerified).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MFA secret encryption
// ─────────────────────────────────────────────────────────────────────────────

describe('MFA secret encryption', () => {
  it('round-trips a TOTP secret through encrypt/decrypt', () => {
    const original = generateMfaSecret();
    const stored = encryptSecret(original);
    const recovered = decryptSecret(stored);
    expect(recovered).toBe(original);
  });

  it('produces different ciphertext for the same plaintext (random IV)', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const a = encryptSecret(secret);
    const b = encryptSecret(secret);
    expect(a).not.toBe(b);
    // But both decrypt to the same value
    expect(decryptSecret(a)).toBe(secret);
    expect(decryptSecret(b)).toBe(secret);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Login — happy path and failure paths
// ─────────────────────────────────────────────────────────────────────────────

describe('login()', () => {
  const fakeUser = {
    id: 'user-abc',
    email: 'pm@mathmag.co.ke',
    // argon2id hash of "Password123!" — pre-computed for test speed
    passwordHash: '',
    role: 'ADMIN_MANAGEMENT' as const,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
  };

  beforeEach(async () => {
    // Generate a real hash so argon2.verify passes
    const argon2 = await import('argon2');
    fakeUser.passwordHash = await argon2.hash('Password123!', { type: argon2.argon2id });

    vi.mocked(db.user.findUnique).mockResolvedValue(fakeUser as any);
    vi.mocked(db.user.update).mockResolvedValue(fakeUser as any);
    vi.mocked(db.userMfa.findUnique).mockResolvedValue(null); // no MFA
    vi.mocked(db.refreshToken.create).mockResolvedValue({} as any);
  });

  it('returns tokens on correct credentials (no MFA)', async () => {
    const result = await login('pm@mathmag.co.ke', 'Password123!');
    expect(result.requiresMfa).toBe(false);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('returns requiresMfa=true when MFA is enabled', async () => {
    vi.mocked(db.userMfa.findUnique).mockResolvedValue({
      userId: fakeUser.id,
      enabled: true,
      encryptedSecret: encryptSecret(generateMfaSecret()),
      backupCodeHashes: [],
    } as any);

    const result = await login('pm@mathmag.co.ke', 'Password123!');
    expect(result.requiresMfa).toBe(true);
    expect(result.mfaToken).toBeTruthy();
    expect(result.accessToken).toBeUndefined();
  });

  it('throws INVALID_CREDENTIALS for wrong password', async () => {
    await expect(login('pm@mathmag.co.ke', 'WrongPassword!')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('throws INVALID_CREDENTIALS for unknown email (constant time)', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    await expect(login('nobody@example.com', 'whatever')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('throws ACCOUNT_LOCKED when lockedUntil is in the future', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      ...fakeUser,
      lockedUntil: new Date(Date.now() + 60_000),
    } as any);

    await expect(login('pm@mathmag.co.ke', 'Password123!')).rejects.toMatchObject({
      code: 'ACCOUNT_LOCKED',
    });
  });

  it('throws ACCOUNT_INACTIVE for deactivated user', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ ...fakeUser, isActive: false } as any);
    await expect(login('pm@mathmag.co.ke', 'Password123!')).rejects.toMatchObject({
      code: 'ACCOUNT_INACTIVE',
    });
  });
});
