import { afterEach, describe, expect, it } from 'vitest';
import { isDemoMode } from './api';

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
});
