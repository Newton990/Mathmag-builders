// src/services/survey.service.ts
// Site survey sections A–G.
//
// Drafts are editable JSON. Submission is a one-way lock:
//   - all seven sections are strictly validated against the shared Zod schemas
//   - the officer must explicitly confirm the completion checklist
//   - the row is locked and a DB trigger makes it immutable
// Corrections never edit the locked original; a new version is created.
import type { Request } from 'express';
import {
  BookingStatus,
  Prisma,
  ProjectStage,
  SurveyStatus,
  UserRole,
} from '@prisma/client';
import {
  SectionASchema,
  SectionBSchema,
  SectionCSchema,
  SectionDSchema,
  SectionESchema,
  SectionFSchema,
  SectionGSchema,
} from '@mbms/shared';
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { extractRequestMeta, writeAudit, writeAuditTx } from './audit.service.js';
import { assertCanCaptureSurvey, getProjectAccess, type Actor } from './access.service.js';
import { nextVersionNumber } from './rules.js';

export type SurveySectionKey =
  | 'sectionB'
  | 'sectionC'
  | 'sectionD'
  | 'sectionE'
  | 'sectionF'
  | 'sectionG';

export interface SurveyDraftPatch {
  sectionB?: Record<string, unknown> | undefined;
  sectionC?: Record<string, unknown> | undefined;
  sectionD?: Record<string, unknown> | undefined;
  sectionE?: Record<string, unknown> | undefined;
  sectionF?: Record<string, unknown> | undefined;
  sectionG?: Record<string, unknown> | undefined;
}

const SECTION_KEYS: SurveySectionKey[] = [
  'sectionB',
  'sectionC',
  'sectionD',
  'sectionE',
  'sectionF',
  'sectionG',
];

async function buildSectionA(projectId: string, officerId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      contact: true,
      visitBooking: { include: { assignedOfficer: true } },
    },
  });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');
  if (!project.visitBooking) {
    throw httpError(
      'A survey cannot start before a confirmed site-visit booking',
      409,
      'BOOKING_REQUIRED',
    );
  }
  const officer =
    project.visitBooking.assignedOfficer ??
    (await prisma.user.findUnique({ where: { id: officerId } }));
  if (!officer) throw httpError('Officer not found', 404, 'OFFICER_NOT_FOUND');

  return {
    schemaVersion: '1.0' as const,
    projectReference: project.reference,
    clientName: project.contact.fullName,
    clientPhone: project.contact.primaryPhone,
    siteCounty: project.siteCounty,
    siteArea: project.siteArea,
    ...(project.siteDirections ? { siteDirections: project.siteDirections } : {}),
    visitDate: project.visitBooking.scheduledAt.toISOString(),
    officerName: officer.name,
    officerEmail: officer.email,
  };
}

/**
 * Get the editable draft for a project, or create one.
 * If the previous version is already submitted, a new version is only allowed
 * when that report was returned for corrections (or no report exists yet).
 */
export async function getOrCreateDraftSurvey(
  actor: Actor,
  projectId: string,
  req?: Request,
) {
  if (actor.role !== UserRole.VISITING_OFFICER) {
    throw httpError(
      'Only a Visiting Officer can capture a site survey',
      403,
      'FIELD_OFFICER_REQUIRED',
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      visitBooking: {
        include: { surveys: { orderBy: { version: 'desc' } } },
      },
    },
  });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');
  const booking = project.visitBooking;
  if (!booking) {
    throw httpError('Confirm a site visit before starting the survey', 409, 'BOOKING_REQUIRED');
  }
  if (booking.assignedOfficerId !== actor.userId) {
    throw httpError('Only the assigned officer may survey this project', 403, 'SURVEY_FORBIDDEN');
  }
  if (!booking.checkInAt && booking.status !== BookingStatus.VISIT_COMPLETED) {
    throw httpError('Check in at the site before capturing the survey', 409, 'CHECK_IN_REQUIRED');
  }

  const surveys = booking.surveys;
  const latest = surveys[0];
  if (latest && latest.lockedAt === null) {
    return { survey: latest, created: false as const };
  }

  if (latest) {
    const reports = await prisma.reportVersion.findMany({
      where: { surveyId: latest.id },
      select: { approvalState: true },
    });
    const blocked = reports.some(
      (report) => report.approvalState === 'IN_REVIEW' || report.approvalState === 'APPROVED',
    );
    if (blocked) {
      throw httpError(
        'The submitted survey is already in review or approved. A new version cannot start yet.',
        409,
        'SURVEY_ALREADY_SUBMITTED',
      );
    }
  }

  const sectionA = await buildSectionA(projectId, actor.userId);
  const previous = latest;

  const survey = await prisma.siteSurvey.create({
    data: {
      bookingId: booking.id,
      capturedById: actor.userId,
      version: nextVersionNumber(surveys.map((s) => s.version)),
      status: SurveyStatus.DRAFT,
      sectionA: sectionA as Prisma.InputJsonValue,
      ...(previous ? { previousVersionId: previous.id } : {}),
      // Carry forward the officer's previous answers but not media references:
      // media stays attached to the submitted original.
      ...(previous?.sectionB ? { sectionB: previous.sectionB } : {}),
      ...(previous?.sectionC ? { sectionC: previous.sectionC } : {}),
      ...(previous?.sectionE ? { sectionE: previous.sectionE } : {}),
      ...(previous?.sectionF ? { sectionF: previous.sectionF } : {}),
      ...(previous?.sectionG ? { sectionG: previous.sectionG } : {}),
    },
  });

  await writeAudit({
    actorId: actor.userId,
    action: previous ? 'SURVEY_VERSION_CREATED' : 'SURVEY_STARTED',
    entityType: 'SiteSurvey',
    entityId: survey.id,
    projectId,
    after: {
      version: survey.version,
      previousVersionId: previous?.id ?? null,
    },
    ...(req ? extractRequestMeta(req) : {}),
  });

  return { survey, created: true as const };
}

export async function saveSurveyDraft(
  actor: Actor,
  surveyId: string,
  patch: SurveyDraftPatch,
  req?: Request,
) {
  const { survey } = await assertCanCaptureSurvey(actor, surveyId);
  if (survey.lockedAt !== null) {
    throw httpError(
      'A submitted survey is immutable. Create a new version to make changes.',
      409,
      'SURVEY_LOCKED',
    );
  }
  if (survey.status !== SurveyStatus.DRAFT) {
    throw httpError('Only a draft survey can be edited', 409, 'SURVEY_NOT_DRAFT');
  }

  const changed: SurveySectionKey[] = [];
  const data: Prisma.SiteSurveyUpdateInput = {};
  for (const key of SECTION_KEYS) {
    const value = patch[key];
    if (value !== undefined) {
      data[key] = value as Prisma.InputJsonValue;
      changed.push(key);
    }
  }
  if (changed.length === 0) {
    throw httpError('No survey sections were supplied', 400, 'NOTHING_TO_SAVE');
  }

  const updated = await prisma.siteSurvey.update({
    where: { id: surveyId },
    data,
  });

  await writeAudit({
    actorId: actor.userId,
    action: 'SURVEY_DRAFT_SAVED',
    entityType: 'SiteSurvey',
    entityId: surveyId,
    projectId: survey.booking.projectId,
    after: { sections: changed },
    ...(req ? extractRequestMeta(req) : {}),
  });

  return updated;
}

function parseOrThrow<T>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T; error?: unknown } }, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success || result.data === undefined) {
    throw httpError(`${label} is incomplete or invalid`, 400, 'SURVEY_SECTION_INVALID');
  }
  return result.data;
}

export async function submitSurvey(actor: Actor, surveyId: string, req?: Request) {
  const { survey } = await assertCanCaptureSurvey(actor, surveyId);
  if (survey.lockedAt !== null) {
    throw httpError('This survey has already been submitted', 409, 'SURVEY_LOCKED');
  }
  if (survey.status !== SurveyStatus.DRAFT) {
    throw httpError('Only a draft survey can be submitted', 409, 'SURVEY_NOT_DRAFT');
  }

  const booking = await prisma.visitBooking.findUnique({
    where: { id: survey.bookingId },
  });
  if (!booking) throw httpError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (!booking.checkInAt && booking.status !== BookingStatus.VISIT_COMPLETED) {
    throw httpError('Check in at the site before submitting the survey', 409, 'CHECK_IN_REQUIRED');
  }

  const missing = SECTION_KEYS.filter((key) => survey[key] === null);
  if (missing.length > 0) {
    throw httpError(
      `Survey is incomplete. Missing: ${missing.join(', ')}`,
      400,
      'SURVEY_INCOMPLETE',
    );
  }

  const sectionA = parseOrThrow(SectionASchema, survey.sectionA, 'Section A');
  const sectionB = parseOrThrow(SectionBSchema, survey.sectionB, 'Section B');
  const sectionC = parseOrThrow(SectionCSchema, survey.sectionC, 'Section C');
  const sectionD = parseOrThrow(SectionDSchema, survey.sectionD, 'Section D');
  const sectionE = parseOrThrow(SectionESchema, survey.sectionE, 'Section E');
  const sectionF = parseOrThrow(SectionFSchema, survey.sectionF, 'Section F');
  const sectionG = parseOrThrow(SectionGSchema, survey.sectionG, 'Section G');

  if (sectionG.completionChecklist.length === 0) {
    throw httpError(
      'The pre-submission checklist must be completed before submission',
      400,
      'CHECKLIST_REQUIRED',
    );
  }
  if (!sectionG.officerConfirmedAt) {
    throw httpError(
      'The officer must explicitly confirm the checklist before submission',
      400,
      'OFFICER_CONFIRMATION_REQUIRED',
    );
  }

  const media = await prisma.surveyMedia.findMany({
    where: { id: { in: sectionD.mediaIds } },
    select: { id: true, surveyId: true },
  });
  const invalidMedia = media.filter((item) => item.surveyId !== surveyId);
  if (media.length !== sectionD.mediaIds.length || invalidMedia.length > 0) {
    throw httpError(
      'Section D references media that does not belong to this survey',
      400,
      'MEDIA_REFERENCE_INVALID',
    );
  }

  const now = new Date();
  const submitted = await prisma.$transaction(async (tx) => {
    const row = await tx.siteSurvey.update({
      where: { id: surveyId },
      data: {
        sectionA: sectionA as Prisma.InputJsonValue,
        sectionB: sectionB as Prisma.InputJsonValue,
        sectionC: sectionC as Prisma.InputJsonValue,
        sectionD: sectionD as Prisma.InputJsonValue,
        sectionE: sectionE as Prisma.InputJsonValue,
        sectionF: sectionF as Prisma.InputJsonValue,
        sectionG: sectionG as Prisma.InputJsonValue,
        status:
          survey.previousVersionId === null
            ? SurveyStatus.SUBMITTED
            : SurveyStatus.RESUBMITTED,
        lockedAt: now,
        submittedAt: now,
        checkInAt: booking.checkInAt ?? now,
        checkOutAt: booking.checkOutAt,
      },
    });
    await tx.project.update({
      where: { id: survey.booking.projectId },
      data: { currentStage: ProjectStage.REPORT_GENERATING },
    });
    await writeAuditTx(tx, {
      actorId: actor.userId,
      action: 'SURVEY_SUBMITTED',
      entityType: 'SiteSurvey',
      entityId: surveyId,
      projectId: survey.booking.projectId,
      after: {
        version: row.version,
        submittedAt: now.toISOString(),
        mediaCount: media.length,
      },
      ...(req ? extractRequestMeta(req) : {}),
    });
    return row;
  });

  return submitted;
}

export async function getSurvey(actor: Actor, surveyId: string) {
  const survey = await prisma.siteSurvey.findUnique({
    where: { id: surveyId },
    include: {
      booking: {
        include: {
          project: { include: { contact: true } },
          assignedOfficer: { select: { id: true, name: true, email: true } },
        },
      },
      media: { orderBy: { uploadedAt: 'asc' } },
      sketches: { orderBy: { version: 'desc' } },
      reports: { orderBy: { versionNumber: 'desc' } },
    },
  });
  if (!survey) throw httpError('Survey not found', 404, 'SURVEY_NOT_FOUND');
  await getProjectAccess(actor, survey.booking.projectId);
  return survey;
}

export async function listSurveys(actor: Actor, projectId: string) {
  const { project } = await getProjectAccess(actor, projectId);
  const surveys = await prisma.siteSurvey.findMany({
    where: { booking: { projectId: project.id } },
    orderBy: { version: 'desc' },
    include: {
      capturedBy: { select: { id: true, name: true } },
      reports: { orderBy: { versionNumber: 'desc' } },
    },
  });
  return { items: surveys };
}

/** Internal helper used by the report workflow to resolve the project. */
export async function getProjectIdForSurvey(surveyId: string): Promise<string> {
  const survey = await prisma.siteSurvey.findUnique({
    where: { id: surveyId },
    select: { booking: { select: { projectId: true } } },
  });
  if (!survey) throw httpError('Survey not found', 404, 'SURVEY_NOT_FOUND');
  return survey.booking.projectId;
}
