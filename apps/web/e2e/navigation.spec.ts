// e2e/navigation.spec.ts
// Navigation tests — runs against the Vite dev server in demo mode.
// Onboarding guides are marked complete so no overlays intercept clicks.

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.context().addInitScript(() => {
    const roles = ['LEAD_ARCHITECT','JUNIOR_ARCHITECT','CLIENT_RELATIONS_OFFICER','ADMIN_MANAGEMENT','VISITING_OFFICER','CLIENT'];
    for (const role of roles) {
      window.localStorage.setItem(`mbms.guide.done.${role}`, 'done');
    }
  });
});

// Every test navigates directly — no login flow needed; demo mode
// auto-logs in as Demo Admin (LEAD_ARCHITECT). Backend returns empty
// demo data gracefully for unknown project IDs.

test.describe('Staff navigation', () => {
  test('dashboard shows page header and stat cards', async ({ page }) => {
    await page.goto('/staff');
    await expect(page.getByTestId('staff-dashboard')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Operations dashboard' })).toBeVisible();
  });

  test('inbox page renders', async ({ page }) => {
    await page.goto('/staff/inbox');
    await expect(page.getByRole('heading', { name: /inbox/i })).toBeVisible();
  });

  test('projects list page renders', async ({ page }) => {
    await page.goto('/staff/projects');
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();
  });

  test('reports list page renders', async ({ page }) => {
    await page.goto('/staff/reports');
    await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible();
  });

  test('governance page renders all 7 tabs', async ({ page }) => {
    await page.goto('/staff/governance');
    await expect(page.getByRole('heading', { name: 'Governance & Administration' })).toBeVisible();
    for (const label of ['Delegations', 'Acting Authorities', 'Exceptions', 'Protected Audits', 'Leave', 'Requisitions', 'Purchase Orders']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });
});

test.describe('Module 2 — Planning page', () => {
  const projectId = 'demo-project-001';

  test('planning page renders stat cards and design pipeline section', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/planning`);
    const planning = page.getByTestId('planning-page');
    await expect(planning).toBeVisible();
    await expect(planning.getByRole('heading', { name: /planning/i })).toBeVisible();
    await expect(planning.getByRole('heading', { name: 'Design Pipeline' })).toBeVisible();
  });

  test('planning page shows Tasks tab by default', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/planning`);
    const planning = page.getByTestId('planning-page');
    await expect(planning).toBeVisible();
    await expect(planning.getByRole('button', { name: 'Tasks' })).toBeVisible();
  });

  test('planning page tabs are clickable', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/planning`);
    await expect(page.getByTestId('planning-page')).toBeVisible();
    // Skip welcome guide overlay if it appears on first visit
    const skipGuide = page.getByRole('button', { name: 'Skip guide' });
    if (await skipGuide.isVisible()) {
      await skipGuide.click();
    }
    for (const label of ['Tasks', 'Client Approvals', 'Coordination Issues', 'Cost Estimates', 'Design Changes']) {
      // Dismiss spotlight tour overlay if it appears between tab clicks
      const skipTour = page.getByRole('button', { name: 'Skip tour' });
      if (await skipTour.isVisible()) {
        await skipTour.click();
      }
      await page.getByTestId('planning-page').getByRole('button', { name: label }).click();
      await expect(page.getByTestId('staff-layout')).toBeVisible();
    }
  });
});

test.describe('Module 3 — Acceptance page', () => {
  const projectId = 'demo-project-001';

  test('acceptance page renders with module subtitle', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/acceptance`);
    await expect(page.getByTestId('acceptance-page')).toBeVisible();
    await expect(page.getByText(/Module 3/)).toBeVisible();
    await expect(page.getByRole('heading', { name: /acceptance/i })).toBeVisible();
  });

  test('acceptance tabs exist', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/acceptance`);
    for (const name of ['Proposals', 'Payments', 'Releases']) {
      await expect(page.getByRole('button', { name: new RegExp(name, 'i') })).toBeVisible();
    }
  });
});

test.describe('Module 4 — Approvals page', () => {
  const projectId = 'demo-project-001';

  test('approvals page renders with module subtitle', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/approvals`);
    await expect(page.getByTestId('approvals-page')).toBeVisible();
    await expect(page.getByText(/Module 4/)).toBeVisible();
  });

  test('approvals page shows stat cards', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/approvals`);
    const approvals = page.getByTestId('approvals-page');
    await expect(approvals.getByText('Cases', { exact: true })).toBeVisible();
    await expect(approvals.getByText('Open', { exact: true })).toBeVisible();
    await expect(approvals.getByText('Cleared', { exact: true })).toBeVisible();
  });
});

test.describe('Module 5 — Contracts page', () => {
  const projectId = 'demo-project-001';

  test('contracts page renders with module subtitle', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/contracts`);
    await expect(page.getByTestId('contracts-page')).toBeVisible();
    await expect(page.getByText(/Module 5/)).toBeVisible();
  });

  test('contracts page shows stat cards', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/contracts`);
    const contracts = page.getByTestId('contracts-page');
    await expect(contracts.locator('p', { hasText: /^Contracts$/ })).toBeVisible();
    await expect(contracts.locator('p', { hasText: /^Active$/ })).toBeVisible();
    await expect(contracts.locator('p', { hasText: /^Total Value$/ })).toBeVisible();
  });

  test('contracts page tabs switch', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/contracts`);
    const contracts = page.getByTestId('contracts-page');
    await contracts.getByRole('button', { name: /engagements/i }).click();
    await expect(page.getByRole('button', { name: 'New Engagement' })).toBeVisible();
  });
});

test.describe('Module 6 — Construction page', () => {
  const projectId = 'demo-project-001';

  test('construction page renders with module subtitle', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/construction`);
    await expect(page.getByTestId('construction-page')).toBeVisible();
    await expect(page.getByText(/Module 6/)).toBeVisible();
  });

  test('construction page shows all 6 tabs', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/construction`);
    const construction = page.getByTestId('construction-page');
    await expect(construction.getByRole('button', { name: /^Overview$/ })).toBeVisible();
    await expect(construction.getByRole('button', { name: /^Site Logs/ })).toBeVisible();
    await expect(construction.getByRole('button', { name: /^GRNs/ })).toBeVisible();
    await expect(construction.getByRole('button', { name: /^Holds/ })).toBeVisible();
    await expect(construction.getByRole('button', { name: /^Variations/ })).toBeVisible();
    await expect(construction.getByRole('button', { name: /^Handover$/ })).toBeVisible();
  });

  test('construction tabs are clickable', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/construction`);
    const construction = page.getByTestId('construction-page');
    await construction.getByRole('button', { name: /site logs/i }).click();
    await expect(page.getByRole('button', { name: /add log/i })).toBeVisible();

    await construction.getByRole('button', { name: /grns/i }).click();
    await expect(page.getByRole('button', { name: /new grn/i })).toBeVisible();

    await construction.getByRole('button', { name: /variations/i }).click();
    await expect(page.getByRole('button', { name: /new variation/i })).toBeVisible();

    await construction.getByRole('button', { name: /handover/i }).click();
    await expect(page.getByRole('button', { name: /initiate handover/i })).toBeVisible();
  });
});

test.describe('Module 7 — Governance page tabs', () => {
  test('governance page renders with testid', async ({ page }) => {
    await page.goto('/staff/governance');
    await expect(page.getByTestId('governance-page')).toBeVisible();
  });

  test('delegations tab shows create button', async ({ page }) => {
    await page.goto('/staff/governance');
    await expect(page.getByRole('button', { name: '+ New Delegation' })).toBeVisible();
  });

  test('acting authorities tab shows create button', async ({ page }) => {
    await page.goto('/staff/governance');
    await page.getByRole('button', { name: 'Acting Authorities' }).click();
    await expect(page.getByRole('button', { name: '+ New Acting Authority' })).toBeVisible();
  });

  test('exceptions tab shows request button', async ({ page }) => {
    await page.goto('/staff/governance');
    await page.getByRole('button', { name: 'Exceptions' }).click();
    await expect(page.getByRole('button', { name: '+ Request Exception' })).toBeVisible();
  });

  test('leave tab shows request button', async ({ page }) => {
    await page.goto('/staff/governance');
    await page.getByRole('button', { name: 'Leave' }).click();
    await expect(page.getByRole('button', { name: '+ Request Leave' })).toBeVisible();
  });

  test('requisitions tab shows new requisition button', async ({ page }) => {
    await page.goto('/staff/governance');
    await page.getByRole('button', { name: 'Requisitions' }).click();
    await expect(page.getByRole('button', { name: '+ New Requisition' })).toBeVisible();
  });
});

test.describe('Field officer routes', () => {
  test('field dashboard renders', async ({ page }) => {
    await page.goto('/field');
    await expect(page.getByTestId('field-dashboard')).toBeVisible();
  });
});

test.describe('Client portal routes', () => {
  test('portal redirects non-client role to /staff in demo mode', async ({ page }) => {
    // Demo mode auto-logs in as LEAD_ARCHITECT (not CLIENT), so the
    // RequireRole(['CLIENT']) guard redirects back to the staff home.
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/staff/);
  });
});

test.describe('Deep link breadcrumb navigation', () => {
  const projectId = 'demo-project-001';

  test('planning page has back link to project', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/planning`);
    const planning = page.getByTestId('planning-page');
    await expect(planning.getByRole('link', { name: /← project/i })).toBeVisible();
  });

  test('acceptance page has navigation links', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/acceptance`);
    const acceptance = page.getByTestId('acceptance-page');
    await expect(acceptance.getByRole('link', { name: /← project/i })).toBeVisible();
    await expect(acceptance.getByRole('link', { name: /approvals/i })).toBeVisible();
  });

  test('contracts page has ← approvals link', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/contracts`);
    await expect(page.getByRole('link', { name: /← approvals/i })).toBeVisible();
  });

  test('construction page has ← contracts link', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/construction`);
    await expect(page.getByRole('link', { name: /← contracts/i })).toBeVisible();
  });
});
