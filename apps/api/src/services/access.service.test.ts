// src/services/access.service.test.ts
// Pure authorization resolver: no database, no Express.
import { describe, expect, it } from 'vitest';
import { UserRole } from '@prisma/client';
import {
  hasCompanyWideProjectVisibility,
  isStaffRole,
  resolveProjectAccess,
  type ProjectAccessFacts,
} from './access.service.js';

function facts(overrides: Partial<ProjectAccessFacts> = {}): ProjectAccessFacts {
  return {
    role: UserRole.VISITING_OFFICER,
    actorId: 'officer-1',
    actorEmail: 'officer@mathmag.dev',
    contactEmail: 'client@example.dev',
    assignedOfficerId: 'officer-1',
    surveyCapturerIds: [],
    juniorArchitectIds: [],
    ...overrides,
  };
}

describe('role classification', () => {
  it('treats every role except CLIENT as staff', () => {
    expect(isStaffRole(UserRole.CLIENT)).toBe(false);
    expect(isStaffRole(UserRole.VISITING_OFFICER)).toBe(true);
    expect(isStaffRole(UserRole.JUNIOR_ARCHITECT)).toBe(true);
  });

  it('gives company-wide visibility to management, lead and client relations only', () => {
    expect(hasCompanyWideProjectVisibility(UserRole.ADMIN_MANAGEMENT)).toBe(true);
    expect(hasCompanyWideProjectVisibility(UserRole.LEAD_ARCHITECT)).toBe(true);
    expect(hasCompanyWideProjectVisibility(UserRole.CLIENT_RELATIONS_OFFICER)).toBe(true);
    expect(hasCompanyWideProjectVisibility(UserRole.VISITING_OFFICER)).toBe(false);
    expect(hasCompanyWideProjectVisibility(UserRole.JUNIOR_ARCHITECT)).toBe(false);
    expect(hasCompanyWideProjectVisibility(UserRole.CLIENT)).toBe(false);
  });
});

describe('project access', () => {
  it('lets management, lead architect and client relations see every project', () => {
    for (const role of [
      UserRole.ADMIN_MANAGEMENT,
      UserRole.LEAD_ARCHITECT,
      UserRole.CLIENT_RELATIONS_OFFICER,
    ]) {
      const access = resolveProjectAccess(facts({ role, assignedOfficerId: null }));
      expect(access.isCompanyWide).toBe(true);
      expect(access.canView).toBe(true);
    }
  });

  it('lets the assigned visiting officer see the project', () => {
    const access = resolveProjectAccess(facts());
    expect(access.isAssignedOfficer).toBe(true);
    expect(access.canView).toBe(true);
  });

  it('lets an officer who captured a survey see the project', () => {
    const access = resolveProjectAccess(
      facts({ assignedOfficerId: 'someone-else', surveyCapturerIds: ['officer-1'] }),
    );
    expect(access.isAssignedOfficer).toBe(true);
    expect(access.canView).toBe(true);
  });

  it('denies an unassigned visiting officer', () => {
    const access = resolveProjectAccess(
      facts({ assignedOfficerId: 'someone-else', surveyCapturerIds: [] }),
    );
    expect(access.isAssignedOfficer).toBe(false);
    expect(access.canView).toBe(false);
  });

  it('lets only assigned junior architects see the project', () => {
    const assigned = resolveProjectAccess(
      facts({ role: UserRole.JUNIOR_ARCHITECT, juniorArchitectIds: ['officer-1'] }),
    );
    expect(assigned.isJuniorArchitect).toBe(true);
    expect(assigned.canView).toBe(true);

    const other = resolveProjectAccess(
      facts({ role: UserRole.JUNIOR_ARCHITECT, juniorArchitectIds: ['junior-2'] }),
    );
    expect(other.isJuniorArchitect).toBe(false);
    expect(other.canView).toBe(false);
  });

  it('lets the client whose email matches the contact email see the project', () => {
    const access = resolveProjectAccess(
      facts({
        role: UserRole.CLIENT,
        actorId: 'client-user',
        actorEmail: 'CLIENT@example.dev',
        contactEmail: 'client@example.dev',
        assignedOfficerId: null,
      }),
    );
    expect(access.isClientOwner).toBe(true);
    expect(access.canView).toBe(true);
  });

  it('denies clients without a matching email', () => {
    const otherEmail = resolveProjectAccess(
      facts({
        role: UserRole.CLIENT,
        actorEmail: 'intruder@example.dev',
        assignedOfficerId: null,
      }),
    );
    expect(otherEmail.isClientOwner).toBe(false);
    expect(otherEmail.canView).toBe(false);

    const noEmail = resolveProjectAccess(
      facts({
        role: UserRole.CLIENT,
        actorEmail: null,
        assignedOfficerId: null,
      }),
    );
    expect(noEmail.canView).toBe(false);
  });

  it('never treats a client as an assigned officer', () => {
    const access = resolveProjectAccess(
      facts({ role: UserRole.CLIENT, actorId: 'officer-1' }),
    );
    expect(access.isAssignedOfficer).toBe(false);
  });
});
