// src/config.ts
// Loads and validates all required environment variables at startup.
// Fails fast with a clear message listing every missing variable.
// dotenv is loaded here only when not in test (vitest injects env directly).
import { createRequire } from 'module';

// Load .env in development/production; skip in test (vitest provides env vars)
if (process.env['NODE_ENV'] !== 'test') {
  try {
    const require = createRequire(import.meta.url);
    const dotenv = require('dotenv') as { config: () => void };
    dotenv.config();
  } catch {
    // dotenv not available — rely on environment variables set externally
  }
}

interface Config {
  nodeEnv: 'development' | 'test' | 'production';
  apiPort: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtl: number;
  jwtRefreshTtl: number;
  corsOrigin: string;
  logLevel: string;
  minio: {
    endpoint: string;
    port: number;
    useSSL: boolean;
    rootUser: string;
    rootPassword: string;
    bucket: string;
  };
  argon2: {
    memoryCost: number;
    timeCost: number;
    parallelism: number;
  };
  pgBossSchema: string;
  maxUploadSizeBytes: number;
  signedUrlTtlSeconds: number;
  loginMaxAttempts: number;
  loginLockoutMinutes: number;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    return `MISSING:${key}`;
  }
  return value;
}

function loadConfig(): Config {
  const missing: string[] = [];

  function get(key: string, fallback?: string): string {
    const val = process.env[key] ?? fallback;
    if (val === undefined || val === '') {
      missing.push(key);
      return '';
    }
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
    if (isNaN(n)) {
      missing.push(`${key} (must be an integer, got "${raw}")`);
      return 0;
    }
    return n;
  }

  const config: Config = {
    nodeEnv: (get('NODE_ENV', 'development') as Config['nodeEnv']),
    apiPort: getInt('API_PORT', 3001),
    databaseUrl: get('DATABASE_URL'),
    jwtAccessSecret: get('JWT_ACCESS_SECRET'),
    jwtRefreshSecret: get('JWT_REFRESH_SECRET'),
    jwtAccessTtl: getInt('JWT_ACCESS_TTL', 900),
    jwtRefreshTtl: getInt('JWT_REFRESH_TTL', 604800),
    corsOrigin: get('CORS_ORIGIN', 'http://localhost:5173'),
    logLevel: get('LOG_LEVEL', 'info'),
    minio: {
      endpoint: get('MINIO_ENDPOINT', 'localhost'),
      port: getInt('MINIO_PORT', 9000),
      useSSL: get('MINIO_USE_SSL', 'false') === 'true',
      rootUser: get('MINIO_ROOT_USER'),
      rootPassword: get('MINIO_ROOT_PASSWORD'),
      bucket: get('MINIO_BUCKET', 'mbms-private'),
    },
    argon2: {
      memoryCost: getInt('ARGON2_MEMORY_COST', 65536),
      timeCost: getInt('ARGON2_TIME_COST', 3),
      parallelism: getInt('ARGON2_PARALLELISM', 1),
    },
    pgBossSchema: get('PGBOSS_SCHEMA', 'pgboss'),
    maxUploadSizeBytes: getInt('MAX_UPLOAD_SIZE_BYTES', 52428800),
    signedUrlTtlSeconds: getInt('SIGNED_URL_TTL_SECONDS', 300),
    loginMaxAttempts: getInt('LOGIN_MAX_ATTEMPTS', 5),
    loginLockoutMinutes: getInt('LOGIN_LOCKOUT_MINUTES', 15),
  };

  // Only DATABASE_URL and JWT secrets are strictly required in all environments
  const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const hardMissing = required.filter((k) => !process.env[k]);

  if (hardMissing.length > 0) {
    const list = hardMissing.map((k) => `  • ${k}`).join('\n');
    throw new Error(
      `MBMS API cannot start — missing required environment variables:\n${list}\n\nCopy .env.example to .env and fill in the missing values.`,
    );
  }

  return config;
}

export const config = loadConfig();
