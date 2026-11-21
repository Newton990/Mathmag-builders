import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

afterEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
});

describe('config', () => {
  it('requires deployment secrets and database URL before startup', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.MFA_ENCRYPTION_KEY;
    delete process.env.CORS_ORIGIN;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;

    await expect(import('./config.js')).rejects.toThrow(/DATABASE_URL/);
  });

  it('accepts valid deployment settings', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://user:pass@db.example.com:5432/mbms';
    process.env.JWT_SECRET = 'a'.repeat(64);
    process.env.MFA_ENCRYPTION_KEY = 'b'.repeat(64);
    process.env.CORS_ORIGIN = 'https://app.example.com';

    const { config } = await import('./config.js');

    expect(config.DATABASE_URL).toBe(process.env.DATABASE_URL);
    expect(config.JWT_SECRET).toBe(process.env.JWT_SECRET);
    expect(config.MFA_ENCRYPTION_KEY).toBe(process.env.MFA_ENCRYPTION_KEY);
    expect(config.CORS_ORIGIN).toBe('https://app.example.com');
  });

  it('builds a secure PostgreSQL URL from Wasmer managed database variables', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    process.env.DB_HOST = 'db.example.com';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'mbms';
    process.env.DB_USERNAME = 'wasmer-user';
    process.env.DB_PASSWORD = 'password:/@#%';
    process.env.JWT_SECRET = 'a'.repeat(64);
    process.env.MFA_ENCRYPTION_KEY = 'b'.repeat(64);

    const { config } = await import('./config.js');

    expect(config.DATABASE_URL).toBe(
      'postgresql://wasmer-user:password%3A%2F%40%23%25@db.example.com:5432/mbms?sslmode=require',
    );
    expect(process.env.DATABASE_URL).toBe(config.DATABASE_URL);
  });

  it('rejects non-PostgreSQL database URLs', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'file:./dev.db';
    process.env.JWT_SECRET = 'a'.repeat(64);
    process.env.MFA_ENCRYPTION_KEY = 'b'.repeat(64);

    await expect(import('./config.js')).rejects.toThrow(/DATABASE_URL/);
  });
});
