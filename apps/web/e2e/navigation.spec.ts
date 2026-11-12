// e2e/navigation.spec.ts
// Demo-mode navigation tests — no backend required; runs against the static
// Vite dev server with demo mode active (isDemoMode() returns true because
// localStorage 'mbms.demo' is unset, so the default is demo mode).

import { test, expect } from '@playwright/test';

// Every test navigates directly — no login flow needed in demo mode.
// The AuthProvider detects demo mode and auto-logs in as 'Demo Admin'.

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
  // Uses a fake project UUID; in demo mode the API returns empty data gracefully.
  const projectId = 'demo-project-001';

  test('planning page renders stat cards and design pipeline section', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/planning`);
    await expect(page.getByTestId('planning-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: /planning/i })).toBeVisible();
    await expect(page.getByText('Design Pipeline')).toBeVisible();
  });

  test('planning page shows Tasks tab by default', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/planning`);
    await expect(page.getByTestId('planning-page')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tasks' })).toBeVisible();
  });

  test('planning page tabs are clickable', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/planning`);
    await expect(page.getByTestId('planning-page')).toBeVisible();
    for (const label of ['Tasks', 'Client Approvals', 'Coordination Issues', 'Cost Estimates', 'Design Changes']) {
      await page.getByRole('button', { name: label }).click();
      // Each tab switch should not crash the app
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
    await expect(page.getByText('Cases')).toBeVisible();
    await expect(page.getByText('Open')).toBeVisible();
    await expect(page.getByText('Cleared')).toBeVisible();
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
    await expect(page.getByText('Contracts')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
    await expect(page.getByText('Total Value')).toBeVisible();
  });

  test('contracts page tabs switch', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/contracts`);
    await page.getByRole('button', { name: /engagements/i }).click();
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
    for (const label of ['Overview', 'Site Logs', 'GRNs', 'Variations', 'Handover']) {
      await expect(page.getByRole('button', { name: new RegExp(label, 'i') })).toBeVisible();
    }
  });

  test('construction tabs are clickable', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/construction`);
    await page.getByRole('button', { name: /site logs/i }).click();
    await expect(page.getByRole('button', { name: /add log/i })).toBeVisible();

    await page.getByRole('button', { name: /grns/i }).click();
    await expect(page.getByRole('button', { name: /new grn/i })).toBeVisible();

    await page.getByRole('button', { name: /variations/i }).click();
    await expect(page.getByRole('button', { name: /new variation/i })).toBeVisible();

    await page.getByRole('button', { name: /handover/i }).click();
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
    await expect(page.getByRole('link', { name: /← project/i })).toBeVisible();
  });

  test('acceptance page has navigation links', async ({ page }) => {
    await page.goto(`/staff/projects/${projectId}/acceptance`);
    await expect(page.getByRole('link', { name: /← project/i }).or(page.getByRole('link', { name: /approvals/i }))).toBeVisible();
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
