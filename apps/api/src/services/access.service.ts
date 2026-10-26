// src/services/access.service.ts
// Server-side authorization for Module 1.
//
// Rules encoded here (never trusted from the client):
//   - Staff are scoped to the projects they may work on.
//   - A visiting officer may only work on the booking assigned to them
//     (or a survey they captured).
//   - A junior architect may only see projects they are assigned to.
//   - A client may only see their own project, and only published content.
//   - Only the Lead Architect may review, assign juniors and publish.
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';

export interface Actor {
  userId: string;
  role: string;
}

export function actorFromRequest(req: Request): Actor {
  if (!req.auth) {
    throw httpError('Not authenticated', 401, 'UNAUTHORIZED');
  }
  return { userId: req.auth.userId, role: req.auth.role };
}

export function isStaffRole(role: string): boolean {
  return role !== UserRole.CLIENT;
}

export function isLeadArchitect(role: string): boolean {
  return role === UserRole.LEAD_ARCHITECT;
}

export function isAdminOrLead(role: string): boolean {
  return role === UserRole.ADMIN_MANAGEMENT || role === UserRole.LEAD_ARCHITECT;
}

/** Roles that may see every project (management overview + audit). */
export function hasCompanyWideProjectVisibility(role: string): boolean {
  return (
    role === UserRole.ADMIN_MANAGEMENT ||
    role === UserRole.LEAD_ARCHITECT ||
    role === UserRole.CLIENT_RELATIONS_OFFICER
  );
}

export interface ProjectAccessFacts {
  role: string;
  actorId: string;
  actorEmail: string | null;
  contactEmail: string | null;
  assignedOfficerId: string | null;
  surveyCapturerIds: string[];
  juniorArchitectIds: string[];
}

export interface ProjectAccess {
  isStaff: boolean;
  isCompanyWide: boolean;
  isAssignedOfficer: boolean;
  isJuniorArchitect: boolean;
  isClientOwner: boolean;
  canView: boolean;
}

/**
 * Pure access resolver — no database calls, so it can be unit-tested directly.
 * The service below feeds it facts loaded from the database.
 */
export function resolveProjectAccess(facts: ProjectAccessFacts): ProjectAccess {
  const isStaff = isStaffRole(facts.role);
  const isCompanyWide = hasCompanyWideProjectVisibility(facts.role);
  const isAssignedOfficer =
    facts.role === UserRole.VISITING_OFFICER &&
    (facts.assignedOfficerId === facts.actorId ||
      facts.surveyCapturerIds.includes(facts.actorId));
  const isJuniorArchitect =
    facts.role === UserRole.JUNIOR_ARCHITECT &&
    facts.juniorArchitectIds.includes(facts.actorId);
  const isClientOwner =
    facts.role === UserRole.CLIENT &&
    facts.actorEmail !== null &&
    facts.contactEmail !== null &&
    facts.actorEmail.toLowerCase() === facts.contactEmail.toLowerCase();

  return {
    isStaff,
    isCompanyWide,
    isAssignedOfficer,
    isJuniorArchitect,
    isClientOwner,
    canView: isCompanyWide || isAssignedOfficer || isJuniorArchitect || isClientOwner,
  };
}

const projectInclude = {
  contact: true,
  visitBooking: {
    include: {
      assignedOfficer: true,
      surveys: { orderBy: { version: 'desc' as const } },
    },
  },
  juniorAssignments: true,
} as const;

export type ProjectWithRelations = Awaited<
  ReturnType<typeof loadProjectOrThrow>
>['project'];

async function loadActorEmail(actor: Actor): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: { email: true, isActive: true },
  });
  if (!user || !user.isActive) {
    throw httpError('Account is not active', 403, 'ACCOUNT_INACTIVE');
  }
  return user.email;
}

async function loadProjectOrThrow(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude,
  });
  if (!project) {
    throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }
  return { project };
}

export interface ProjectContext {
  project: ProjectWithRelations;
  actor: Actor;
  access: ProjectAccess;
}

export async function getProjectAccess(
  actor: Actor,
  projectId: string,
): Promise<ProjectContext> {
  const [{ project }, actorEmail] = await Promise.all([
    loadProjectOrThrow(projectId),
    loadActorEmail(actor),
  ]);

  const access = resolveProjectAccess({
    role: actor.role,
    actorId: actor.userId,
    actorEmail,
    contactEmail: project.contact.email,
    assignedOfficerId: project.visitBooking?.assignedOfficerId ?? null,
    surveyCapturerIds: (project.visitBooking?.surveys ?? []).map(
      (survey) => survey.capturedById,
    ),
    juniorArchitectIds: project.juniorAssignments.map(
      (assignment) => assignment.juniorArchitectId,
    ),
  });

  if (!access.canView) {
    throw httpError('You do not have access to this project', 403, 'PROJECT_FORBIDDEN');
  }

  return { project, actor, access };
}

export async function requireProjectEditing(actor: Actor, projectId: string): Promise<ProjectContext> {
  const context = await getProjectAccess(actor, projectId);
  if (!context.access.isCompanyWide && !context.access.isAssignedOfficer) {
    throw httpError('You cannot modify this project', 403, 'PROJECT_FORBIDDEN');
  }
  return context;
}

export function assertLeadArchitect(actor: Actor): void {
  if (!isLeadArchitect(actor.role)) {
    throw httpError(
      'Only the Lead Architect may perform this action',
      403,
      'LEAD_ARCHITECT_REQUIRED',
    );
  }
}

export function assertAdminOrLead(actor: Actor): void {
  if (!isAdminOrLead(actor.role)) {
    throw httpError(
      'Only management or the Lead Architect may perform this action',
      403,
      'MANAGEMENT_REQUIRED',
    );
  }
}

export function assertBookingManager(actor: Actor): void {
  if (
    actor.role !== UserRole.CLIENT_RELATIONS_OFFICER &&
    actor.role !== UserRole.ADMIN_MANAGEMENT
  ) {
    throw httpError(
      'Only Client Relations or management may manage bookings',
      403,
      'BOOKING_MANAGER_REQUIRED',
    );
  }
}

export function assertStaff(actor: Actor): void {
  if (!isStaffRole(actor.role)) {
    throw httpError('Staff access required', 403, 'STAFF_REQUIRED');
  }
}

/** Only the assigned visiting officer (or the officer who captured the survey). */
export async function assertCanCaptureSurvey(actor: Actor, surveyId: string) {
  const survey = await prisma.siteSurvey.findUnique({
    where: { id: surveyId },
    include: {
      booking: { select: { projectId: true, assignedOfficerId: true } },
      media: { select: { id: true } },
    },
  });
  if (!survey) {
    throw httpError('Survey not found', 404, 'SURVEY_NOT_FOUND');
  }

  const assigned =
    survey.booking.assignedOfficerId === actor.userId ||
    survey.capturedById === actor.userId;
  if (actor.role !== UserRole.VISITING_OFFICER || !assigned) {
    throw httpError(
      'Only the officer assigned to this visit may edit its survey',
      403,
      'SURVEY_FORBIDDEN',
    );
  }
  return { survey };
}

export async function assertCanViewSurvey(actor: Actor, surveyId: string) {
  const survey = await prisma.siteSurvey.findUnique({
    where: { id: surveyId },
    include: {
      booking: { include: { project: { include: { contact: true } } } },
      media: true,
      sketches: true,
      reports: true,
    },
  });
  if (!survey) {
    throw httpError('Survey not found', 404, 'SURVEY_NOT_FOUND');
  }
  await getProjectAccess(actor, survey.booking.projectId);
  return survey;
}
