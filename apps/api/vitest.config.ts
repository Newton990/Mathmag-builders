import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Provide required env vars for tests without needing a real .env
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_ACCESS_SECRET: 'test-access-secret-at-least-64-chars-long-for-vitest-unit-tests-ok',
      JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-64-chars-long-for-vitest-unit-tests-ok',
      API_PORT: '3001',
      CORS_ORIGIN: 'http://localhost:5173',
      LOG_LEVEL: 'silent',
      MINIO_ROOT_USER: 'minioadmin',
      MINIO_ROOT_PASSWORD: 'minioadmin',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['dist/**', 'prisma/**'],
    },
  },
});
