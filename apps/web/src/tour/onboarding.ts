import type { UserRole } from '../lib/types';

export const GUIDE_KEY = (role: string) => `mbms.guide.done.${role}`;

export function getGuideKey(role: UserRole | string): string {
  return GUIDE_KEY(role);
}

export function hasCompletedGuide(role: UserRole | string): boolean {
  return localStorage.getItem(getGuideKey(role)) === 'done';
}

export function completeGuide(role: UserRole | string): void {
  localStorage.setItem(getGuideKey(role), 'done');
}
