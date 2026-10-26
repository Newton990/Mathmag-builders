// src/__tests__/module1-routes.test.ts
// Route wiring and authentication boundaries for Module 1. These do not touch
// the database: unauthenticated requests are rejected before any service call.
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

const protectedRoutes: Array<[method: 'get' | 'post' | 'patch', path: string]> = [
  ['get', '/api/conversations'],
  ['post', '/api/conversations'],
  ['get', '/api/bookings'],
  ['post', '/api/visits/confirm'],
  ['get', '/api/projects'],
  ['get', '/api/projects/abc'],
  ['get', '/api/surveys/abc'],
  ['patch', '/api/surveys/abc/draft'],
  ['get', '/api/media/abc/download'],
  ['get', '/api/reports'],
  ['post', '/api/reports/abc/lead-review'],
  ['post', '/api/publications'],
  ['get', '/api/portal/projects'],
];

describe('Module 1 route wiring', () => {
  it.each(protectedRoutes)('%s %s requires authentication', async (method, path) => {
    const response = await request(app)[method](path).send({});
    expect(response.status).toBe(401);
  });

  it('keeps the visit-confirmation alias reachable', async () => {
    const response = await request(app)
      .post('/api/visits/confirm')
      .send({ scheduledAt: '2030-01-01T09:00:00.000Z' });
    // 401 proves the route exists and is guarded; a missing route would be 404.
    expect(response.status).toBe(401);
  });
});
