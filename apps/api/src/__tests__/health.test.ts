// src/__tests__/health.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'mbms-api',
    });
    expect(typeof res.body.timestamp).toBe('string');
    expect(typeof res.body.version).toBe('string');
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
