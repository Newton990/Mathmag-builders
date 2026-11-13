import { afterEach, describe, expect, it } from 'vitest';
import { completeGuide, getGuideKey, hasCompletedGuide } from './onboarding';

describe('user onboarding state', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('starts incomplete for a new user', () => {
    expect(hasCompletedGuide('LEAD_ARCHITECT')).toBe(false);
    expect(localStorage.getItem(getGuideKey('LEAD_ARCHITECT'))).toBeNull();
  });

  it('marks the guide as completed once a user finishes onboarding', () => {
    completeGuide('CLIENT');

    expect(hasCompletedGuide('CLIENT')).toBe(true);
    expect(localStorage.getItem(getGuideKey('CLIENT'))).toBe('done');
  });
});
