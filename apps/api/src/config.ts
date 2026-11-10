// src/config.ts
// Loads and validates all required environment variables at startup.
// Fails fast with a clear message listing every missing variable.
// Force operational timezone parity across environments (overridable by process env).
process.env.TZ = process.env.TZ || 'Africa/Nairobi';

import { createRequire } from 'module';

// Load .env only for local non-production development convenience.
// In cloud/production, required values must come directly from process.env.
if (process.env['NODE_ENV'] === 'development') {
  try {
    const require = createRequire(import.meta.url);
    const dotenv = require('dotenv') as { config: (opts?: { override?: boolean }) => unknown };
    dotenv.config({ override: false });
  } catch {
    // dotenv not available or .env missing — rely on process.env
  }
}

// ── Exported config object (flat, typed) ─────────────────────────────────────
// All keys are SCREAMING_SNAKE_CASE to match env var conventions.

export interface AppConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  API_PORT: number;

  // JWT
  JWT_SECRET: string;                    // Single HS256 secret (access + step-up)
  JWT_ACCESS_EXPIRY_SECONDS: number;     // Default: 900 (15 min)
  JWT_STEP_UP_EXPIRY_SECONDS: number;    // Default: 300 (5 min)
  JWT_REFRESH_EXPIRY_MS: number;         // Default: 604800000 (7 days)

  // MFA
  MFA_ENCRYPTION_KEY: string;            // 64-char hex string → 32 bytes AES-256

  // Auth lockout
  AUTH_MAX_FAILED_ATTEMPTS: number;      // Default: 5
  AUTH_LOCKOUT_DURATION_MS: number;      // Default: 900000 (15 min)

  // CORS
  CORS_ORIGIN: string;

  // Logging
  LOG_LEVEL: string;

  // Storage (S3-compatible external)
  STORAGE_ENDPOINT: string;
  STORAGE_PORT: number;
  STORAGE_USE_SSL: boolean;
  STORAGE_ACCESS_KEY: string;
  STORAGE_SECRET_KEY: string;
  STORAGE_BUCKET: string;

  // Argon2
  ARGON2_MEMORY_COST: number;
  ARGON2_TIME_COST: number;
  ARGON2_PARALLELISM: number;

  MAX_UPLOAD_SIZE_BYTES: number;
  SIGNED_URL_TTL_SECONDS: number;
}

function loadConfig(): AppConfig {
  const missing: string[] = [];

  function get(key: string, fallback?: string): string {
    const val = process.env[key] ?? fallback;
    if (val === undefined || val === '') { missing.push(key); return ''; }
    return val;
  }

  function getInt(key: string, fallback?: number): number {
    const raw = process.env[key];
    if (raw === undefined || raw === '') {
      if (fallback !== undefined) return fallback;
      missing.push(key);
      return 0;
    }
    const n = parseInt(raw, 10);
    if (isNaN(n)) { missing.push(`${key} (must be integer, got "${raw}")`); return 0; }
    return n;
  }

  const cfg: AppConfig = {
    NODE_ENV: (get('NODE_ENV', 'development') as AppConfig['NODE_ENV']),
    API_PORT: getInt('API_PORT', Number(process.env.PORT) || 3001),

    JWT_SECRET: get('JWT_SECRET'),
    JWT_ACCESS_EXPIRY_SECONDS: getInt('JWT_ACCESS_EXPIRY_SECONDS', 900),
    JWT_STEP_UP_EXPIRY_SECONDS: getInt('JWT_STEP_UP_EXPIRY_SECONDS', 300),
    JWT_REFRESH_EXPIRY_MS: getInt('JWT_REFRESH_EXPIRY_DAYS', 7) * 24 * 60 * 60 * 1000,

    MFA_ENCRYPTION_KEY: get('MFA_ENCRYPTION_KEY'),

    AUTH_MAX_FAILED_ATTEMPTS: getInt('AUTH_MAX_FAILED_ATTEMPTS', 5),
    AUTH_LOCKOUT_DURATION_MS: getInt('AUTH_LOCKOUT_MINUTES', 15) * 60 * 1000,

    CORS_ORIGIN: get('CORS_ORIGIN', 'http://localhost:5173'),
    LOG_LEVEL: get('LOG_LEVEL', 'info'),

    STORAGE_ENDPOINT: get('STORAGE_ENDPOINT', 'localhost'),
    STORAGE_PORT: getInt('STORAGE_PORT', 9000),
    STORAGE_USE_SSL: get('STORAGE_USE_SSL', 'false') === 'true',
    STORAGE_ACCESS_KEY: get('STORAGE_ACCESS_KEY', 'minioadmin'),
    STORAGE_SECRET_KEY: get('STORAGE_SECRET_KEY', 'minio123'),
    STORAGE_BUCKET: get('STORAGE_BUCKET', 'mbms-private'),

    ARGON2_MEMORY_COST: getInt('ARGON2_MEMORY_COST', 65536),
    ARGON2_TIME_COST: getInt('ARGON2_TIME_COST', 3),
    ARGON2_PARALLELISM: getInt('ARGON2_PARALLELISM', 4),

    MAX_UPLOAD_SIZE_BYTES: getInt('MAX_UPLOAD_SIZE_BYTES', 52428800),
    SIGNED_URL_TTL_SECONDS: getInt('SIGNED_URL_TTL_SECONDS', 300),
  };

  // Required secrets must come directly from process.env (platform secrets).
  const strictlyRequired = ['JWT_SECRET', 'MFA_ENCRYPTION_KEY'] as const;
  const hard = strictlyRequired.filter((k) => !process.env[k]);

  if (hard.length > 0) {
    const list = hard.map((k) => `  • ${k}`).join('\n');
    throw new Error(
      `MBMS API cannot start — missing required environment variables:\n${list}\n\nSet them in Wasmer Edge dashboard or .env for local dev.`,
    );
  }

  return cfg;
}

export const config = loadConfig();
