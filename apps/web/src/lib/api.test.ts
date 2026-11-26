import { afterEach, describe, expect, it } from 'vitest';
import { apiRequest, isDemoMode } from './api';

describe('demo mode defaults', () => {
  afterEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('defaults to demo mode for local demo use', () => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');

    expect(isDemoMode()).toBe(true);
    expect(window.localStorage.getItem('mbms.demo')).toBe('true');
  });

  it('allows live mode when explicitly requested', () => {
    window.localStorage.setItem('mbms.demo', 'true');
    window.history.pushState({}, '', '/?live=true');

    expect(isDemoMode()).toBe(false);
    expect(window.localStorage.getItem('mbms.demo')).toBe('false');
  });

  it('returns realistic sample data for the onboarding dashboard flow', async () => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');

    const projects = await apiRequest<{ items: Array<Record<string, unknown>> }>('/projects?take=100');
    const conversations = await apiRequest<{ items: Array<Record<string, unknown>> }>('/conversations?take=100');
    const reports = await apiRequest<{ items: Array<Record<string, unknown>> }>('/reports?take=100');
    const bookings = await apiRequest<{ items: Array<Record<string, unknown>> }>('/bookings?take=100');
    const portal = await apiRequest<{ items: Array<Record<string, unknown>> }>('/portal/projects');
    const login = await apiRequest<{ accessToken?: string }>('/auth/login', {
      method: 'POST',
      body: { email: 'demo@mathmag.co.ke', password: 'demo' },
    });

    expect(projects.items.length).toBeGreaterThan(0);
    expect(conversations.items.length).toBeGreaterThan(0);
    expect(reports.items.length).toBeGreaterThan(0);
    expect(bookings.items.length).toBeGreaterThan(0);
    expect(portal.items.length).toBeGreaterThan(0);
    expect(login.accessToken).toBeTruthy();
  });

  it('creates a demo signup profile for first-time users and stores the selected role', async () => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');

    const signup = await apiRequest<{ accessToken?: string; user?: { role?: string; email?: string } }>('/auth/signup', {
      method: 'POST',
      body: { fullName: 'Jane Demo', email: 'jane@demo.co.ke', password: 'SecurePass123', role: 'CLIENT' },
    });

    expect(signup.accessToken).toBeTruthy();
    expect(signup.user?.email).toBe('jane@demo.co.ke');
    expect(signup.user?.role).toBe('CLIENT');
    // Raw api.ts demo signup sets demo mode; AuthContext.signup() overrides to live mode for real users.
    expect(window.localStorage.getItem('mbms.demo')).toBe('true');
    expect(window.localStorage.getItem('mbms.demoRole')).toBe('CLIENT');
  });
});
