import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mark all onboarding guides complete so no full-screen overlays
  // intercept pointer events during navigation. Demo mode stays on so
  // the AuthProvider auto-logs in as Demo Admin (LEAD_ARCHITECT).
  await page.addInitScript(() => {
    const roles = ['LEAD_ARCHITECT','JUNIOR_ARCHITECT','CLIENT_RELATIONS_OFFICER','ADMIN_MANAGEMENT','VISITING_OFFICER','CLIENT'];
    for (const role of roles) {
      window.localStorage.setItem(`mbms.guide.done.${role}`, 'done');
    }
  });
});

test.describe('MBMS App Smoke Test', () => {
  test('root redirects to staff dashboard in demo mode', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/staff/);
  });

  test('login page redirects to staff dashboard in demo mode', async ({ page }) => {
    // Demo mode auto-logs in as Demo Admin, so /login immediately redirects.
    await page.goto('/login');
    await expect(page).toHaveURL(/\/staff/);
  });

  test('/staff renders staff layout', async ({ page }) => {
    await page.goto('/staff');
    await expect(page.getByTestId('staff-layout')).toBeVisible();
    await expect(page.getByTestId('staff-dashboard')).toBeVisible();
  });

  test('/field renders field layout with mobile nav', async ({ page }) => {
    await page.goto('/field');
    await expect(page.getByTestId('field-layout')).toBeVisible();
    await expect(page.getByTestId('field-dashboard')).toBeVisible();
  });

  test('/portal redirects non-client role to /staff in demo mode', async ({ page }) => {
    // Demo mode auto-logs in as LEAD_ARCHITECT (not CLIENT), so the
    // RequireRole(['CLIENT']) guard redirects back to the staff home.
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/staff/);
  });

  test('unknown routes redirect to staff dashboard in demo mode', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page).toHaveURL(/\/staff/);
  });
});
