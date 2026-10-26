import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Provide ALL required env vars here — this is the single source of truth
    // for test environment. vi.stubEnv() calls in test files are still useful
    // for per-test overrides but the config.ts guard must pass first.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',

      // JWT — single secret for HS256
      JWT_SECRET: 'test-jwt-secret-at-least-64-chars-long-for-vitest-unit-tests-xxxxxxxxxxx',
      JWT_ACCESS_EXPIRY_SECONDS: '900',
      JWT_STEP_UP_EXPIRY_SECONDS: '300',
      JWT_REFRESH_EXPIRY_DAYS: '7',

      // MFA encryption key — 64 hex chars (32 bytes)
      MFA_ENCRYPTION_KEY: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

      // Account lockout
      AUTH_MAX_FAILED_ATTEMPTS: '5',
      AUTH_LOCKOUT_MINUTES: '15',

      // API / infra
      API_PORT: '3001',
      CORS_ORIGIN: 'http://localhost:5173',
      LOG_LEVEL: 'silent',
      MINIO_ROOT_USER: 'minioadmin',
      MINIO_ROOT_PASSWORD: 'minioadmin',
      MINIO_ENDPOINT: 'localhost',
      MINIO_PORT: '9000',
      MINIO_USE_SSL: 'false',
      MINIO_BUCKET: 'mbms-test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['dist/**', 'prisma/**'],
    },
  },
});
