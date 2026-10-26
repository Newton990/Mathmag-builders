// src/config.ts
// Loads and validates all required environment variables at startup.
// Fails fast with a clear message listing every missing variable.
import { createRequire } from 'module';

if (process.env['NODE_ENV'] !== 'test') {
  try {
    const require = createRequire(import.meta.url);
    const dotenv = require('dotenv') as { config: () => void };
    dotenv.config();
  } catch {
    // dotenv not available — rely on externally set environment variables
  }
}

// ── Exported config object (flat, typed) ─────────────────────────────────────
// All keys are SCREAMING_SNAKE_CASE to match env var conventions.

export interface AppConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  API_PORT: number;
  DATABASE_URL: string;

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

  // MinIO
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_USE_SSL: boolean;
  MINIO_ROOT_USER: string;
  MINIO_ROOT_PASSWORD: string;
  MINIO_BUCKET: string;

  // Argon2
  ARGON2_MEMORY_COST: number;
  ARGON2_TIME_COST: number;
  ARGON2_PARALLELISM: number;

  // Storage
  PGBOSS_SCHEMA: string;
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
    API_PORT: getInt('API_PORT', 3001),
    DATABASE_URL: get('DATABASE_URL'),

    JWT_SECRET: get('JWT_SECRET'),
    JWT_ACCESS_EXPIRY_SECONDS: getInt('JWT_ACCESS_EXPIRY_SECONDS', 900),
    JWT_STEP_UP_EXPIRY_SECONDS: getInt('JWT_STEP_UP_EXPIRY_SECONDS', 300),
    JWT_REFRESH_EXPIRY_MS: getInt('JWT_REFRESH_EXPIRY_DAYS', 7) * 24 * 60 * 60 * 1000,

    MFA_ENCRYPTION_KEY: get('MFA_ENCRYPTION_KEY'),

    AUTH_MAX_FAILED_ATTEMPTS: getInt('AUTH_MAX_FAILED_ATTEMPTS', 5),
    AUTH_LOCKOUT_DURATION_MS: getInt('AUTH_LOCKOUT_MINUTES', 15) * 60 * 1000,

    CORS_ORIGIN: get('CORS_ORIGIN', 'http://localhost:5173'),
    LOG_LEVEL: get('LOG_LEVEL', 'info'),

    MINIO_ENDPOINT: get('MINIO_ENDPOINT', 'localhost'),
    MINIO_PORT: getInt('MINIO_PORT', 9000),
    MINIO_USE_SSL: get('MINIO_USE_SSL', 'false') === 'true',
    MINIO_ROOT_USER: get('MINIO_ROOT_USER', 'minio'),
    MINIO_ROOT_PASSWORD: get('MINIO_ROOT_PASSWORD', 'minio123'),
    MINIO_BUCKET: get('MINIO_BUCKET', 'mbms-private'),

    ARGON2_MEMORY_COST: getInt('ARGON2_MEMORY_COST', 65536),
    ARGON2_TIME_COST: getInt('ARGON2_TIME_COST', 3),
    ARGON2_PARALLELISM: getInt('ARGON2_PARALLELISM', 4),

    PGBOSS_SCHEMA: get('PGBOSS_SCHEMA', 'pgboss'),
    MAX_UPLOAD_SIZE_BYTES: getInt('MAX_UPLOAD_SIZE_BYTES', 52428800),
    SIGNED_URL_TTL_SECONDS: getInt('SIGNED_URL_TTL_SECONDS', 300),
  };

  const strictlyRequired = ['DATABASE_URL', 'JWT_SECRET', 'MFA_ENCRYPTION_KEY'];
  const hard = strictlyRequired.filter((k) => !process.env[k]);

  if (hard.length > 0) {
    const list = hard.map((k) => `  • ${k}`).join('\n');
    throw new Error(
      `MBMS API cannot start — missing required environment variables:\n${list}\n\nCopy .env.example to .env and fill in the values.`,
    );
  }

  return cfg;
}

export const config = loadConfig();
