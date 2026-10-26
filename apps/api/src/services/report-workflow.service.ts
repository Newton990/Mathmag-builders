// src/services/report-workflow.service.ts
// Report generation, Lead Architect review, junior assignment and explicit
// client publication.
//
// SEPARATION OF ACTIONS (never collapsed):
//   generated  → reviewed/approved → assigned → published
// A report that is merely approved is NOT visible in the client portal.
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import {
  Prisma,
  ProjectStage,
  ReportApprovalState,
  ReportGeneratorStatus,
  ReviewDecision,
  UserRole,
} from '@prisma/client';
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { extractRequestMeta, writeAudit, writeAuditTx } from './audit.service.js';
import {
  assertLeadArchitect,
  assertStaff,
  getProjectAccess,
  hasCompanyWideProjectVisibility,
  isLeadArchitect,
  type Actor,
} from './access.service.js';
import { generateReportFiles, type ReportSource } from './report.service.js';
import { buildStorageKey, getSignedUrl, putObject } from './storage.service.js';
import { notify, notifyClientByEmail } from './notification.service.js';
import { refreshProjectStage } from './project.service.js';
import { publicationAllowed } from './rules.js';

async function loadReportOrThrow(reportVersionId: string) {
  const report = await prisma.reportVersion.findUnique({
    where: { id: reportVersionId },
    include: {
      survey: {
        include: {
          booking: {
            include: {
              project: { include: { contact: true } },
              assignedOfficer: { select: { id: true, name: true } },
            },
          },
          media: true,
        },
      },
      reviews: { orderBy: { createdAt: 'asc' } },
      publications: { include: { permittedMedia: true } },
    },
  });
  if (!report) throw httpError('Report version not found', 404, 'REPORT_NOT_FOUND');
  return report;
}

export async function buildReportSource(reportVersionId: string): Promise<ReportSource> {
  const report = await loadReportOrThrow(reportVersionId);
  const survey = report.survey;
  const project = survey.booking.project;

  return {
    projectReference: project.reference,
    clientName: project.contact.fullName,
    clientPhone: project.contact.primaryPhone,
    clientEmail: project.contact.email,
    siteCounty: project.siteCounty,
    siteSubCounty: project.siteSubCounty,
    siteArea: project.siteArea,
    siteDirections: project.siteDirections,
    projectType: project.projectType,
    visitDate: survey.booking.scheduledAt,
    officerName: survey.booking.assignedOfficer?.name ?? 'Visiting officer',
    surveyVersion: survey.version,
    reportVersion: report.versionNumber,
    generatedAt: new Date(),
    sections: {
      a: survey.sectionA,
      b: survey.sectionB,
      c: survey.sectionC,
      d: survey.sectionD,
      e: survey.sectionE,
      f: survey.sectionF,
      g: survey.sectionG,
    },
    media: survey.media.map((item) => ({
      caption: item.caption,
      category: item.category,
      kind: item.kind,
      checksum: item.checksum,
    })),
  };
}

export async function generateReportForSurvey(
  actor: Actor,
  surveyId: string,
  req?: Request,
) {
  const survey = await prisma.siteSurvey.findUnique({
    where: { id: surveyId },
    include: {
      booking: { select: { projectId: true } },
      reports: { orderBy: { versionNumber: 'desc' } },
    },
  });
  if (!survey) throw httpError('Survey not found', 404, 'SURVEY_NOT_FOUND');
  if (survey.lockedAt === null) {
    throw httpError('Submit the survey before generating its report', 409, 'SURVEY_NOT_SUBMITTED');
  }

  const latest = survey.reports[0];
  if (
    latest &&
    latest.generatorStatus === ReportGeneratorStatus.GENERATED &&
    latest.approvalState !== ReportApprovalState.RETURNED
  ) {
    return { report: latest, created: false as const };
  }

  const versionNumber =
    survey.reports.length === 0
      ? 1
      : Math.max(...survey.reports.map((report) => report.versionNumber)) + 1;

  const report = await prisma.reportVersion.create({
    data: {
      surveyId,
      versionNumber,
      generatorStatus: ReportGeneratorStatus.GENERATING,
      approvalState: ReportApprovalState.DRAFT,
    },
  });

  try {
    const source = await buildReportSource(report.id);
    const files = await generateReportFiles(source);

    const base = buildStorageKey([
      'projects',
      survey.booking.projectId,
      'surveys',
      surveyId,
      'reports',
      `v${versionNumber}`,
    ]);
    const docxKey = `${base}/report.docx`;
    const pdfKey = `${base}/report.pdf`;

    await putObject(
      docxKey,
      files.docx,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      { 'x-amz-meta-report-id': report.id },
    );
    await putObject(pdfKey, files.pdf, 'application/pdf', {
      'x-amz-meta-report-id': report.id,
    });

    const generated = await prisma.reportVersion.update({
      where: { id: report.id },
      data: {
        docxKey,
        pdfKey,
        generatorStatus: ReportGeneratorStatus.GENERATED,
        generatedAt: new Date(),
      },
    });

    await writeAudit({
      actorId: actor.userId,
      action: 'REPORT_GENERATED',
      entityType: 'ReportVersion',
      entityId: report.id,
      projectId: survey.booking.projectId,
      after: { versionNumber, surveyId, docxKey, pdfKey },
      ...(req ? extractRequestMeta(req) : {}),
    });
    await refreshProjectStage(survey.booking.projectId);

    return { report: generated, created: true as const };
  } catch (err) {
    await prisma.reportVersion.update({
      where: { id: report.id },
      data: {
        generatorStatus: ReportGeneratorStatus.FAILED,
        generatorError: err instanceof Error ? err.message : String(err),
      },
    });
    await writeAudit({
      actorId: actor.userId,
      action: 'REPORT_GENERATION_FAILED',
      entityType: 'ReportVersion',
      entityId: report.id,
      projectId: survey.booking.projectId,
      reason: err instanceof Error ? err.message : String(err),
      ...(req ? extractRequestMeta(req) : {}),
    });
    throw httpError(
      'The report could not be generated. The survey is safe; retry generation.',
      502,
      'REPORT_GENERATION_FAILED',
    );
  }
}

export async function submitReportForReview(
  actor: Actor,
  reportVersionId: string,
  req?: Request,
) {
  const report = await loadReportOrThrow(reportVersionId);
  await getProjectAccess(actor, report.survey.booking.projectId);
  if (report.generatorStatus !== ReportGeneratorStatus.GENERATED) {
    throw httpError('Generate the report before sending it for review', 409, 'REPORT_NOT_GENERATED');
  }
  if (
    report.approvalState !== ReportApprovalState.DRAFT &&
    report.approvalState !== ReportApprovalState.RETURNED
  ) {
    throw httpError(
      `A report in ${report.approvalState} cannot be sent for review`,
      409,
      'INVALID_REPORT_STATE',
    );
  }

  const updated = await prisma.reportVersion.update({
    where: { id: reportVersionId },
    data: { approvalState: ReportApprovalState.IN_REVIEW },
  });
  await writeAudit({
    actorId: actor.userId,
    action: 'REPORT_SUBMITTED_FOR_REVIEW',
    entityType: 'ReportVersion',
    entityId: reportVersionId,
    projectId: report.survey.booking.projectId,
    before: { approvalState: report.approvalState },
    after: { approvalState: updated.approvalState },
    ...(req ? extractRequestMeta(req) : {}),
  });
  await refreshProjectStage(report.survey.booking.projectId);
  return updated;
}

export async function reviewReport(
  actor: Actor,
  reportVersionId: string,
  decision: ReviewDecision,
  comments: string | undefined,
  req?: Request,
) {
  assertLeadArchitect(actor);
  const report = await loadReportOrThrow(reportVersionId);
  if (report.approvalState !== ReportApprovalState.IN_REVIEW) {
    throw httpError(
      'Only a report that is in review can be approved or returned',
      409,
      'REPORT_NOT_IN_REVIEW',
    );
  }
  if (decision === ReviewDecision.RETURNED && (!comments || comments.trim().length < 5)) {
    throw httpError(
      'Returning a report requires correction comments',
      400,
      'COMMENTS_REQUIRED',
    );
  }

  const projectId = report.survey.booking.projectId;
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.reportVersion.update({
      where: { id: reportVersionId },
      data:
        decision === ReviewDecision.APPROVED
          ? {
              approvalState: ReportApprovalState.APPROVED,
              approvedById: actor.userId,
              approvedAt: now,
            }
          : { approvalState: ReportApprovalState.RETURNED },
    });
    await tx.review.create({
      data: {
        reportVersionId,
        reviewerId: actor.userId,
        decision,
        comments: comments?.trim() ?? '',
      },
    });
    await writeAuditTx(tx, {
      actorId: actor.userId,
      action:
        decision === ReviewDecision.APPROVED ? 'REPORT_APPROVED' : 'REPORT_RETURNED',
      entityType: 'ReportVersion',
      entityId: reportVersionId,
      projectId,
      before: { approvalState: report.approvalState },
      after: { approvalState: next.approvalState, comments: comments ?? null },
      ...(req ? extractRequestMeta(req) : {}),
    });
    await tx.project.update({
      where: { id: projectId },
      data: {
        currentStage:
          decision === ReviewDecision.APPROVED
            ? ProjectStage.APPROVED
            : ProjectStage.CORRECTIONS_REQUESTED,
      },
    });
    return next;
  });

  if (report.survey.booking.assignedOfficer) {
    await notify({
      recipientId: report.survey.booking.assignedOfficer.id,
      event:
        decision === ReviewDecision.APPROVED
          ? 'REPORT_APPROVED'
          : 'CORRECTIONS_REQUESTED',
      entityType: 'ReportVersion',
      entityId: reportVersionId,
      title:
        decision === ReviewDecision.APPROVED
          ? `Report approved — ${report.survey.booking.project.reference}`
          : `Corrections requested — ${report.survey.booking.project.reference}`,
      body:
        decision === ReviewDecision.APPROVED
          ? 'The Lead Architect approved your site report.'
          : `The Lead Architect returned the report: ${comments ?? ''}`,
    });
  }

  await refreshProjectStage(projectId);
  return updated;
}

export interface AssignJuniorInput {
  reportVersionId: string;
  juniorArchitectId: string;
  dueDate?: Date | undefined;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | undefined;
  instructions?: string | undefined;
}

export async function assignJuniorArchitect(
  actor: Actor,
  projectId: string,
  input: AssignJuniorInput,
  req?: Request,
) {
  assertLeadArchitect(actor);
  await getProjectAccess(actor, projectId);

  const report = await prisma.reportVersion.findUnique({
    where: { id: input.reportVersionId },
    include: { survey: { select: { booking: { select: { projectId: true } } } } },
  });
  if (!report) throw httpError('Report version not found', 404, 'REPORT_NOT_FOUND');
  if (report.survey.booking.projectId !== projectId) {
    throw httpError('The report does not belong to this project', 409, 'PROJECT_MISMATCH');
  }
  if (report.approvalState !== ReportApprovalState.APPROVED) {
    throw httpError(
      'Only an Lead Architect-approved report can be assigned',
      409,
      'REPORT_NOT_APPROVED',
    );
  }

  const junior = await prisma.user.findUnique({
    where: { id: input.juniorArchitectId },
    select: { role: true, isActive: true, name: true },
  });
  if (!junior || !junior.isActive || junior.role !== UserRole.JUNIOR_ARCHITECT) {
    throw httpError(
      'The assignee must be an active Junior Architect',
      400,
      'INVALID_JUNIOR_ARCHITECT',
    );
  }

  const duplicate = await prisma.juniorAssignment.findFirst({
    where: {
      reportVersionId: input.reportVersionId,
      juniorArchitectId: input.juniorArchitectId,
    },
  });
  if (duplicate) {
    return { assignment: duplicate, created: false as const };
  }

  const assignment = await prisma.juniorAssignment.create({
    data: {
      projectId,
      reportVersionId: input.reportVersionId,
      juniorArchitectId: input.juniorArchitectId,
      assignedById: actor.userId,
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
    },
  });

  await writeAudit({
    actorId: actor.userId,
    action: 'JUNIOR_ASSIGNED',
    entityType: 'JuniorAssignment',
    entityId: assignment.id,
    projectId,
    after: {
      reportVersionId: input.reportVersionId,
      juniorArchitectId: input.juniorArchitectId,
    },
    ...(req ? extractRequestMeta(req) : {}),
  });
  await notify({
    recipientId: input.juniorArchitectId,
    event: 'JUNIOR_ASSIGNED',
    entityType: 'Project',
    entityId: projectId,
    title: 'New architectural assignment',
    body: 'A Lead Architect assigned you an approved site brief for Module 2 work.',
  });
  await refreshProjectStage(projectId);

  return { assignment, created: true as const };
}

export async function listAssignments(actor: Actor, projectId: string) {
  await getProjectAccess(actor, projectId);
  return prisma.juniorAssignment.findMany({
    where: { projectId },
    include: {
      juniorArchitect: { select: { id: true, name: true, email: true } },
      assignedBy: { select: { id: true, name: true } },
      reportVersion: { select: { id: true, versionNumber: true, approvalState: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function publishReport(
  actor: Actor,
  reportVersionId: string,
  permittedMediaIds: string[],
  req?: Request,
) {
  assertLeadArchitect(actor);
  const report = await loadReportOrThrow(reportVersionId);
  const projectId = report.survey.booking.projectId;
  const contact = report.survey.booking.project.contact;

  if (!publicationAllowed(report.approvalState)) {
    throw httpError(
      'An unapproved report cannot be published to the client portal',
      409,
      'REPORT_NOT_APPROVED',
    );
  }
  if (report.generatorStatus !== ReportGeneratorStatus.GENERATED) {
    throw httpError('The report files are not generated yet', 409, 'REPORT_NOT_GENERATED');
  }

  const uniqueMediaIds = [...new Set(permittedMediaIds)];
  if (uniqueMediaIds.length > 0) {
    const media = await prisma.surveyMedia.findMany({
      where: { id: { in: uniqueMediaIds } },
      select: { id: true, surveyId: true },
    });
    if (
      media.length !== uniqueMediaIds.length ||
      media.some((item) => item.surveyId !== report.surveyId)
    ) {
      throw httpError(
        'Only media from this survey can be published',
        400,
        'MEDIA_REFERENCE_INVALID',
      );
    }
  }

  const publicationId = randomUUID();
  const now = new Date();

  const publication = await prisma.$transaction(async (tx) => {
    const active = await tx.portalPublication.findMany({
      where: {
        revokedAt: null,
        reportVersion: { survey: { booking: { projectId } } },
      },
      select: { id: true },
    });

    const created = await tx.portalPublication.create({
      data: {
        id: publicationId,
        reportVersionId,
        publishedById: actor.userId,
        publishedAt: now,
        ...(uniqueMediaIds.length > 0
          ? { permittedMedia: { connect: uniqueMediaIds.map((id) => ({ id })) } }
          : {}),
      },
    });

    if (active.length > 0) {
      await tx.portalPublication.updateMany({
        where: { id: { in: active.map((item) => item.id) } },
        data: {
          revokedAt: now,
          revokedById: actor.userId,
          revokeReason: 'Superseded by a newer publication',
          supersededById: created.id,
        },
      });
    }

    await tx.project.update({
      where: { id: projectId },
      data: { currentStage: ProjectStage.PUBLISHED_TO_CLIENT },
    });

    await writeAuditTx(tx, {
      actorId: actor.userId,
      action: 'REPORT_PUBLISHED',
      entityType: 'PortalPublication',
      entityId: created.id,
      projectId,
      after: {
        reportVersionId,
        permittedMediaIds: uniqueMediaIds,
        supersededPublicationIds: active.map((item) => item.id),
      },
      ...(req ? extractRequestMeta(req) : {}),
    });

    return created;
  });

  await notifyClientByEmail(contact.email, {
    event: 'REPORT_PUBLISHED',
    entityType: 'PortalPublication',
    entityId: publication.id,
    title: `Your site report is available — ${report.survey.booking.project.reference}`,
    body: 'The Lead Architect has published your site visit report to the client portal.',
  });
  await refreshProjectStage(projectId);

  return publication;
}

export async function revokePublication(
  actor: Actor,
  publicationId: string,
  reason: string,
  req?: Request,
) {
  if (!isLeadArchitect(actor.role) && actor.role !== UserRole.ADMIN_MANAGEMENT) {
    throw httpError(
      'Only the Lead Architect or management may revoke a publication',
      403,
      'PUBLICATION_REVOKE_FORBIDDEN',
    );
  }
  if (!reason || reason.trim().length < 5) {
    throw httpError('A revocation reason is required', 400, 'REASON_REQUIRED');
  }

  const publication = await prisma.portalPublication.findUnique({
    where: { id: publicationId },
    include: {
      reportVersion: {
        include: {
          survey: {
            include: { booking: { include: { project: { include: { contact: true } } } } },
          },
        },
      },
    },
  });
  if (!publication) throw httpError('Publication not found', 404, 'PUBLICATION_NOT_FOUND');
  if (publication.revokedAt !== null) {
    return publication;
  }

  const projectId = publication.reportVersion.survey.booking.projectId;
  const updated = await prisma.portalPublication.update({
    where: { id: publicationId },
    data: {
      revokedAt: new Date(),
      revokedById: actor.userId,
      revokeReason: reason,
    },
  });

  await writeAudit({
    actorId: actor.userId,
    action: 'PUBLICATION_REVOKED',
    entityType: 'PortalPublication',
    entityId: publicationId,
    projectId,
    before: { revokedAt: null },
    after: { revokedAt: updated.revokedAt?.toISOString() ?? null },
    reason,
    ...(req ? extractRequestMeta(req) : {}),
  });
  await notifyClientByEmail(publication.reportVersion.survey.booking.project.contact.email, {
    event: 'PUBLICATION_REVOKED',
    entityType: 'PortalPublication',
    entityId: publicationId,
    title: 'A published report was withdrawn',
    body: `Your site report is no longer available in the portal. Reason: ${reason}`,
  });
  await refreshProjectStage(projectId);

  return updated;
}

export interface ReportFilter {
  projectId?: string | undefined;
  approvalState?: ReportApprovalState | undefined;
  skip?: number | undefined;
  take?: number | undefined;
}

export async function listReports(actor: Actor, filter: ReportFilter) {
  if (!hasCompanyWideProjectVisibility(actor.role) && actor.role !== UserRole.VISITING_OFFICER && actor.role !== UserRole.JUNIOR_ARCHITECT) {
    throw httpError('Report list is not available for this role', 403, 'FORBIDDEN');
  }

  const where: Prisma.ReportVersionWhereInput = {
    ...(filter.approvalState !== undefined
      ? { approvalState: filter.approvalState }
      : {}),
    ...(filter.projectId !== undefined
      ? { survey: { booking: { projectId: filter.projectId } } }
      : {}),
  };

  if (actor.role === UserRole.VISITING_OFFICER) {
    where.survey = { capturedById: actor.userId };
  } else if (actor.role === UserRole.JUNIOR_ARCHITECT) {
    where.juniorAssignments = { some: { juniorArchitectId: actor.userId } };
  }

  const [items, total] = await Promise.all([
    prisma.reportVersion.findMany({
      where,
      include: {
        survey: {
          select: {
            id: true,
            version: true,
            status: true,
            booking: {
              select: {
                projectId: true,
                project: {
                  select: { id: true, reference: true, contact: { select: { fullName: true } } },
                },
              },
            },
          },
        },
        _count: { select: { reviews: true, juniorAssignments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: filter.skip ?? 0,
      take: Math.min(filter.take ?? 50, 200),
    }),
    prisma.reportVersion.count({ where }),
  ]);

  return { items, total };
}

export async function getReport(actor: Actor, reportVersionId: string) {
  const report = await loadReportOrThrow(reportVersionId);
  await getProjectAccess(actor, report.survey.booking.projectId);
  return report;
}

/**
 * Staff view of every publication for a project, including revoked and
 * superseded ones. Clients must use /api/portal, which only exposes active
 * publications of their own project.
 */
export async function listProjectPublications(actor: Actor, projectId: string) {
  assertStaff(actor);
  await getProjectAccess(actor, projectId);
  return prisma.portalPublication.findMany({
    where: { reportVersion: { survey: { booking: { projectId } } } },
    include: {
      reportVersion: {
        select: { id: true, versionNumber: true, approvalState: true },
      },
      publishedBy: { select: { id: true, name: true } },
      permittedMedia: {
        select: { id: true, kind: true, category: true, caption: true },
      },
    },
    orderBy: { publishedAt: 'desc' },
  });
}

export async function getReportDownloadUrl(
  actor: Actor,
  reportVersionId: string,
  format: 'pdf' | 'docx',
) {
  const report = await loadReportOrThrow(reportVersionId);
  const projectId = report.survey.booking.projectId;

  if (actor.role === UserRole.CLIENT) {
    if (format === 'docx') {
      throw httpError(
        'Only the client-facing PDF is available in the portal',
        403,
        'DOCX_NOT_PORTAL',
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      select: { email: true },
    });
    const contactEmail = report.survey.booking.project.contact.email;
    const ownsProject =
      user !== null &&
      contactEmail !== null &&
      user.email.toLowerCase() === contactEmail.toLowerCase();
    const published = report.publications.some(
      (publication) =>
        publication.revokedAt === null &&
        publication.reportVersionId === reportVersionId,
    );
    if (
      !ownsProject ||
      !published ||
      !publicationAllowed(report.approvalState)
    ) {
      throw httpError('Report not found', 404, 'REPORT_NOT_FOUND');
    }
  } else {
    await getProjectAccess(actor, projectId);
  }

  if (report.generatorStatus !== ReportGeneratorStatus.GENERATED) {
    throw httpError('Report files are not available', 409, 'REPORT_NOT_GENERATED');
  }

  const key = format === 'docx' ? report.docxKey : report.pdfKey;
  if (!key) {
    throw httpError(`The ${format.toUpperCase()} file is not available`, 404, 'FILE_NOT_FOUND');
  }

  return {
    reportVersionId,
    format,
    url: await getSignedUrl(key),
  };
}
