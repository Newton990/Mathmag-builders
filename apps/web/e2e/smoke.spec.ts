import { test, expect } from '@playwright/test';

test.describe('MBMS App Smoke Test', () => {
  test('root redirects to login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders heading and form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Mathmag Builders' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
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

  test('/portal renders client portal layout', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.getByTestId('portal-layout')).toBeVisible();
    await expect(page.getByTestId('client-portal')).toBeVisible();
  });

  test('unknown routes redirect to login', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page).toHaveURL(/\/login/);
  });
});
