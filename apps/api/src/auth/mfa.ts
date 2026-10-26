// ─────────────────────────────────────────────────────────────────────────────
// MFA service — TOTP via otplib (RFC 6238)
// Secrets encrypted at rest using AES-256-GCM (configurable via MFA_ENCRYPTION_KEY)
// QR code returned only during setup; secret never returned again after that.
// ─────────────────────────────────────────────────────────────────────────────

import { generateSecret, generateURI, verifySync } from 'otplib';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { config } from '../config.js';

const KEY = Buffer.from(config.MFA_ENCRYPTION_KEY, 'hex'); // must be 32 bytes / 64 hex chars

const ALGO = 'aes-256-gcm';

// TOTP settings — SHA-1 / 6 digits / 30-second period (authenticator-app standard)
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

// ── Encrypt/decrypt secret at rest ───────────────────────────────────────────

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptSecret(stored: string): string {
  const [ivHex, tagHex, encHex] = stored.split(':');
  if (!ivHex || !tagHex || !encHex) {
    throw new Error('Malformed encrypted MFA secret');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString('utf8') + decipher.final('utf8');
}

// ── TOTP helpers ─────────────────────────────────────────────────────────────

export function generateMfaSecret(): string {
  return generateSecret();
}

export function buildTotpUri(secret: string, userEmail: string): string {
  return generateURI({
    issuer: 'MBMS',
    label: userEmail,
    secret,
    period: TOTP_PERIOD_SECONDS,
    digits: TOTP_DIGITS,
  });
}

export function verifyTotp(secret: string, token: string): boolean {
  try {
    const result = verifySync({
      secret,
      token: token.replace(/\s/g, ''),
      period: TOTP_PERIOD_SECONDS,
      digits: TOTP_DIGITS,
      // Allow ±1 step (30s) for clock drift
      epochTolerance: TOTP_PERIOD_SECONDS,
    });
    return result.valid;
  } catch {
    return false;
  }
}

// ── Backup codes ─────────────────────────────────────────────────────────────

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => randomBytes(5).toString('hex').toUpperCase());
}
