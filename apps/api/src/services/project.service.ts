// src/services/project.service.ts
// Booking → project creation and the visit lifecycle.
//
// HARD RULES:
//   - No project exists until an agreed site-visit date/time is recorded.
//   - One booking per project and one project per confirmed conversation.
//   - Every change writes append-only history + an audit event in the same
//     transaction as the business state change.
import type { Request } from 'express';
import {
  BookingStatus,
  PaymentStatus,
  Prisma,
  ProjectStage,
  SurveyStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { extractRequestMeta, writeAudit, writeAuditTx } from './audit.service.js';
import {
  assertBookingManager,
  getProjectAccess,
  hasCompanyWideProjectVisibility,
  isLeadArchitect,
  type Actor,
} from './access.service.js';
import { findOrCreateContact, type ContactInput } from './conversation.service.js';
import { notify, notifyClientByEmail } from './notification.service.js';
import {
  formatProjectReference,
  isTerminalBookingStatus,
  validateAgreedVisitDate,
  validateChangeReason,
} from './rules.js';

export interface SiteDetailsInput {
  county: string;
  area: string;
  subCounty?: string | undefined;
  directions?: string | undefined;
  projectType?: string | undefined;
  description?: string | undefined;
}

export interface ConfirmBookingInput {
  idempotencyKey: string;
  scheduledAt: Date;
  site: SiteDetailsInput;
  conversationId?: string | undefined;
  contactId?: string | undefined;
  contact?: ContactInput | undefined;
  assignedOfficerId?: string | undefined;
  visitFeeKes?: number | undefined;
  specialInstructions?: string | undefined;
}

async function nextProjectReference(tx: Prisma.TransactionClient, year: number): Promise<string> {
  // Atomic upsert + increment. The row lock serialises concurrent bookings.
  const rows = await tx.$queryRaw<Array<{ counter: number }>>`
    INSERT INTO "project_sequences" ("year", "prefix", "counter")
    VALUES (${year}, 'MB', 1)
    ON CONFLICT ("year", "prefix")
    DO UPDATE SET "counter" = "project_sequences"."counter" + 1
    RETURNING "counter"
  `;
  const counter = rows[0]?.counter;
  if (counter === undefined) {
    throw httpError('Could not allocate a project reference', 500, 'SEQUENCE_FAILED');
  }
  return formatProjectReference(year, counter);
}

async function assertActiveVisitingOfficer(userId: string): Promise<void> {
  const officer = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });
  if (!officer || !officer.isActive || officer.role !== UserRole.VISITING_OFFICER) {
    throw httpError(
      'The assigned officer must be an active Visiting Officer',
      400,
      'INVALID_VISITING_OFFICER',
    );
  }
}

export async function confirmVisitBooking(
  actor: Actor,
  input: ConfirmBookingInput,
  req?: Request,
) {
  assertBookingManager(actor);

  const dateError = validateAgreedVisitDate(input.scheduledAt);
  if (dateError) {
    throw httpError(dateError, 400, 'AGREED_DATE_REQUIRED');
  }
  if (!input.idempotencyKey || input.idempotencyKey.trim().length < 8) {
    throw httpError('A stable idempotency key is required', 400, 'IDEMPOTENCY_KEY_REQUIRED');
  }
  if (!input.conversationId && !input.contactId && !input.contact) {
    throw httpError(
      'Link a conversation or provide client details before confirming a visit',
      400,
      'CLIENT_REQUIRED',
    );
  }
  if (input.assignedOfficerId) {
    await assertActiveVisitingOfficer(input.assignedOfficerId);
  }

  // Idempotent replay: return the same booking instead of creating a duplicate.
  const existing = await prisma.visitBooking.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { project: { include: { contact: true } } },
  });
  if (existing) {
    return { booking: existing, project: existing.project, created: false as const };
  }

  const conversation = input.conversationId
    ? await prisma.conversation.findUnique({
        where: { id: input.conversationId },
        include: { contact: true },
      })
    : null;
  if (input.conversationId && !conversation) {
    throw httpError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }
  if (conversation?.linkedProjectId) {
    throw httpError(
      'This conversation already has a project. Reschedule the existing booking instead.',
      409,
      'DUPLICATE_PROJECT',
    );
  }

  const contact =
    conversation?.contact ??
    (input.contactId
      ? await prisma.contact.findUnique({ where: { id: input.contactId } })
      : input.contact
        ? await findOrCreateContact(input.contact)
        : null);

  if (!contact) {
    throw httpError('Client contact not found', 404, 'CONTACT_NOT_FOUND');
  }
  if (conversation && contact.id !== conversation.contactId) {
    throw httpError(
      'The supplied contact does not match the conversation client',
      409,
      'CONTACT_MISMATCH',
    );
  }

  const now = new Date();
  const year = input.scheduledAt.getUTCFullYear();

  const result = await prisma.$transaction(async (tx) => {
    const reference = await nextProjectReference(tx, year);

    const project = await tx.project.create({
      data: {
        reference,
        contactId: contact.id,
        siteCounty: input.site.county,
        siteArea: input.site.area,
        currentStage: ProjectStage.VISIT_BOOKED,
        ...(input.site.subCounty !== undefined
          ? { siteSubCounty: input.site.subCounty }
          : {}),
        ...(input.site.directions !== undefined
          ? { siteDirections: input.site.directions }
          : {}),
        ...(input.site.projectType !== undefined
          ? { projectType: input.site.projectType }
          : {}),
        ...(input.site.description !== undefined
          ? { siteDescription: input.site.description }
          : {}),
        ...(conversation ? { createdFromConversationId: conversation.id } : {}),
      },
    });

    const booking = await tx.visitBooking.create({
      data: {
        projectId: project.id,
        scheduledAt: input.scheduledAt,
        idempotencyKey: input.idempotencyKey,
        bookedById: actor.userId,
        status: BookingStatus.BOOKED,
        ...(input.assignedOfficerId !== undefined
          ? { assignedOfficerId: input.assignedOfficerId }
          : {}),
        ...(input.visitFeeKes !== undefined
          ? { visitFeeKes: new Prisma.Decimal(input.visitFeeKes) }
          : {}),
        ...(input.specialInstructions !== undefined
          ? { specialInstructions: input.specialInstructions }
          : {}),
      },
    });

    await tx.bookingHistory.create({
      data: {
        bookingId: booking.id,
        oldStatus: BookingStatus.BOOKED,
        newStatus: BookingStatus.BOOKED,
        newScheduledAt: input.scheduledAt,
        reason: 'Initial site visit date agreed with the client',
        changedById: actor.userId,
      },
    });

    if (conversation) {
      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          status: 'LINKED_TO_PROJECT',
          linkedProjectId: project.id,
          lastActivityAt: now,
        },
      });
    }

    const meta = req ? extractRequestMeta(req) : {};
    await writeAuditTx(tx, {
      actorId: actor.userId,
      action: 'BOOKING_CONFIRMED',
      entityType: 'VisitBooking',
      entityId: booking.id,
      projectId: project.id,
      after: {
        reference: project.reference,
        scheduledAt: input.scheduledAt.toISOString(),
        assignedOfficerId: input.assignedOfficerId ?? null,
        conversationId: conversation?.id ?? null,
      },
      ...meta,
    });
    await writeAuditTx(tx, {
      actorId: actor.userId,
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: project.id,
      projectId: project.id,
      after: { reference: project.reference, contactId: contact.id },
      ...meta,
    });

    return { booking, project, created: true as const };
  });

  if (input.assignedOfficerId) {
    await notify({
      recipientId: input.assignedOfficerId,
      event: 'BOOKING_CONFIRMED',
      entityType: 'VisitBooking',
      entityId: result.booking.id,
      title: `Site visit booked — ${result.project.reference}`,
      body: `A site visit for ${contact.fullName} is scheduled for ${input.scheduledAt.toISOString()}.`,
    });
  }
  await notifyClientByEmail(contact.email, {
    event: 'BOOKING_CONFIRMED',
    entityType: 'Project',
    entityId: result.project.id,
    title: `Site visit confirmed — ${result.project.reference}`,
    body: `Your site visit is confirmed for ${input.scheduledAt.toISOString()} (Africa/Nairobi).`,
  });

  return result;
}

export async function rescheduleBooking(
  actor: Actor,
  bookingId: string,
  newScheduledAt: Date,
  reason: string,
  req?: Request,
) {
  assertBookingManager(actor);
  const dateError = validateAgreedVisitDate(newScheduledAt);
  if (dateError) throw httpError(dateError, 400, 'AGREED_DATE_REQUIRED');
  const reasonError = validateChangeReason(reason);
  if (reasonError) throw httpError(reasonError, 400, 'REASON_REQUIRED');

  const booking = await prisma.visitBooking.findUnique({
    where: { id: bookingId },
    include: { project: { include: { contact: true } } },
  });
  if (!booking) throw httpError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (isTerminalBookingStatus(booking.status)) {
    throw httpError(
      `A ${booking.status.toLowerCase()} booking cannot be rescheduled`,
      409,
      'BOOKING_TERMINAL',
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.visitBooking.update({
      where: { id: bookingId },
      data: { scheduledAt: newScheduledAt, status: BookingStatus.RESCHEDULED },
    });
    await tx.bookingHistory.create({
      data: {
        bookingId,
        oldStatus: booking.status,
        newStatus: BookingStatus.RESCHEDULED,
        oldScheduledAt: booking.scheduledAt,
        newScheduledAt,
        reason,
        changedById: actor.userId,
      },
    });
    await writeAuditTx(tx, {
      actorId: actor.userId,
      action: 'BOOKING_RESCHEDULED',
      entityType: 'VisitBooking',
      entityId: bookingId,
      projectId: booking.projectId,
      before: { scheduledAt: booking.scheduledAt.toISOString(), status: booking.status },
      after: { scheduledAt: newScheduledAt.toISOString(), status: next.status },
      reason,
      ...(req ? extractRequestMeta(req) : {}),
    });
    return next;
  });

  // The project is NOT recreated; the booking and its history carry the change.
  if (booking.assignedOfficerId) {
    await notify({
      recipientId: booking.assignedOfficerId,
      event: 'BOOKING_RESCHEDULED',
      entityType: 'VisitBooking',
      entityId: bookingId,
      title: `Visit rescheduled — ${booking.project.reference}`,
      body: `New date: ${newScheduledAt.toISOString()}. Reason: ${reason}`,
    });
  }
  await notifyClientByEmail(booking.project.contact.email, {
    event: 'BOOKING_RESCHEDULED',
    entityType: 'VisitBooking',
    entityId: bookingId,
    title: `Site visit rescheduled — ${booking.project.reference}`,
    body: `Your site visit has been moved to ${newScheduledAt.toISOString()}. Reason: ${reason}`,
  });

  return updated;
}

export async function cancelBooking(
  actor: Actor,
  bookingId: string,
  reason: string,
  req?: Request,
) {
  assertBookingManager(actor);
  const reasonError = validateChangeReason(reason);
  if (reasonError) throw httpError(reasonError, 400, 'REASON_REQUIRED');

  const booking = await prisma.visitBooking.findUnique({
    where: { id: bookingId },
    include: { project: { include: { contact: true } } },
  });
  if (!booking) throw httpError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (isTerminalBookingStatus(booking.status)) {
    throw httpError('This booking is already closed', 409, 'BOOKING_TERMINAL');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.visitBooking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
    await tx.bookingHistory.create({
      data: {
        bookingId,
        oldStatus: booking.status,
        newStatus: BookingStatus.CANCELLED,
        oldScheduledAt: booking.scheduledAt,
        reason,
        changedById: actor.userId,
      },
    });
    await writeAuditTx(tx, {
      actorId: actor.userId,
      action: 'BOOKING_CANCELLED',
      entityType: 'VisitBooking',
      entityId: bookingId,
      projectId: booking.projectId,
      before: { status: booking.status },
      after: { status: next.status },
      reason,
      ...(req ? extractRequestMeta(req) : {}),
    });
    return next;
  });

  await notifyClientByEmail(booking.project.contact.email, {
    event: 'BOOKING_CANCELLED',
    entityType: 'VisitBooking',
    entityId: bookingId,
    title: `Site visit cancelled — ${booking.project.reference}`,
    body: `Your site visit has been cancelled. Reason: ${reason}`,
  });

  return updated;
}

async function assertAssignedOfficer(actor: Actor, bookingId: string) {
  const booking = await prisma.visitBooking.findUnique({
    where: { id: bookingId },
    include: { project: true },
  });
  if (!booking) throw httpError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  const allowed =
    isLeadArchitect(actor.role) ||
    actor.role === UserRole.ADMIN_MANAGEMENT ||
    booking.assignedOfficerId === actor.userId;
  if (actor.role !== UserRole.VISITING_OFFICER && !isLeadArchitect(actor.role) && actor.role !== UserRole.ADMIN_MANAGEMENT) {
    throw httpError('Only field staff may check in to a visit', 403, 'FIELD_OFFICER_REQUIRED');
  }
  if (!allowed) {
    throw httpError('Only the assigned officer may check in to this visit', 403, 'BOOKING_FORBIDDEN');
  }
  return booking;
}

export async function checkInToVisit(
  actor: Actor,
  bookingId: string,
  gps: Record<string, unknown>,
  req?: Request,
) {
  const booking = await assertAssignedOfficer(actor, bookingId);
  if (gps['latitude'] === undefined || gps['longitude'] === undefined) {
    throw httpError('Check-in requires GPS latitude and longitude', 400, 'GPS_REQUIRED');
  }
  if (booking.status !== BookingStatus.BOOKED && booking.status !== BookingStatus.RESCHEDULED) {
    throw httpError('This visit cannot be checked in from its current state', 409, 'INVALID_BOOKING_STATE');
  }

  return prisma.$transaction(async (tx) => {
    const next = await tx.visitBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.VISIT_UNDERWAY,
        checkInAt: new Date(),
        checkInGps: gps as Prisma.InputJsonValue,
      },
    });
    await tx.project.update({
      where: { id: booking.projectId },
      data: { currentStage: ProjectStage.VISIT_UNDERWAY },
    });
    await tx.bookingHistory.create({
      data: {
        bookingId,
        oldStatus: booking.status,
        newStatus: BookingStatus.VISIT_UNDERWAY,
        reason: 'Visiting officer checked in at site',
        changedById: actor.userId,
      },
    });
    await writeAuditTx(tx, {
      actorId: actor.userId,
      action: 'VISIT_CHECKED_IN',
      entityType: 'VisitBooking',
      entityId: bookingId,
      projectId: booking.projectId,
      after: { checkInAt: next.checkInAt?.toISOString() ?? null },
      ...(req ? extractRequestMeta(req) : {}),
    });
    return next;
  });
}

export async function checkOutOfVisit(
  actor: Actor,
  bookingId: string,
  gps: Record<string, unknown>,
  req?: Request,
) {
  const booking = await assertAssignedOfficer(actor, bookingId);
  if (booking.status !== BookingStatus.VISIT_UNDERWAY) {
    throw httpError('Check-in is required before check-out', 409, 'CHECK_IN_REQUIRED');
  }
  if (gps['latitude'] === undefined || gps['longitude'] === undefined) {
    throw httpError('Check-out requires GPS latitude and longitude', 400, 'GPS_REQUIRED');
  }

  return prisma.$transaction(async (tx) => {
    const next = await tx.visitBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.VISIT_COMPLETED,
        checkOutAt: new Date(),
        checkOutGps: gps as Prisma.InputJsonValue,
      },
    });
    await tx.project.update({
      where: { id: booking.projectId },
      data: { currentStage: ProjectStage.VISIT_COMPLETED },
    });
    await tx.bookingHistory.create({
      data: {
        bookingId,
        oldStatus: BookingStatus.VISIT_UNDERWAY,
        newStatus: BookingStatus.VISIT_COMPLETED,
        reason: 'Visiting officer completed the site visit',
        changedById: actor.userId,
      },
    });
    await writeAuditTx(tx, {
      actorId: actor.userId,
      action: 'VISIT_CHECKED_OUT',
      entityType: 'VisitBooking',
      entityId: bookingId,
      projectId: booking.projectId,
      after: { checkOutAt: next.checkOutAt?.toISOString() ?? null },
      ...(req ? extractRequestMeta(req) : {}),
    });
    return next;
  });
}

export interface BookingFilter {
  status?: BookingStatus | undefined;
  officerId?: string | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
  skip?: number | undefined;
  take?: number | undefined;
}

export async function listBookings(actor: Actor, filter: BookingFilter) {
  const where: Prisma.VisitBookingWhereInput = {
    ...(filter.status !== undefined ? { status: filter.status } : {}),
    ...(filter.officerId !== undefined ? { assignedOfficerId: filter.officerId } : {}),
    ...(filter.from !== undefined || filter.to !== undefined
      ? {
          scheduledAt: {
            ...(filter.from !== undefined ? { gte: filter.from } : {}),
            ...(filter.to !== undefined ? { lte: filter.to } : {}),
          },
        }
      : {}),
  };

  if (actor.role === UserRole.VISITING_OFFICER) {
    where.assignedOfficerId = actor.userId;
  } else if (actor.role === UserRole.JUNIOR_ARCHITECT) {
    where.project = {
      juniorAssignments: { some: { juniorArchitectId: actor.userId } },
    };
  } else if (actor.role === UserRole.CLIENT) {
    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      select: { email: true },
    });
    where.project = {
      contact: { email: { equals: user?.email ?? '__none__', mode: 'insensitive' } },
    };
  } else if (!hasCompanyWideProjectVisibility(actor.role)) {
    throw httpError('Booking list is not available for this role', 403, 'FORBIDDEN');
  }

  const [items, total] = await Promise.all([
    prisma.visitBooking.findMany({
      where,
      include: {
        project: { include: { contact: true } },
        assignedOfficer: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      skip: filter.skip ?? 0,
      take: Math.min(filter.take ?? 50, 200),
    }),
    prisma.visitBooking.count({ where }),
  ]);

  return { items, total };
}

export async function getBooking(actor: Actor, bookingId: string) {
  const booking = await prisma.visitBooking.findUnique({
    where: { id: bookingId },
    include: {
      project: { include: { contact: true } },
      assignedOfficer: { select: { id: true, name: true, email: true } },
      history: { orderBy: { createdAt: 'asc' } },
      surveys: { orderBy: { version: 'desc' } },
    },
  });
  if (!booking) throw httpError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  await getProjectAccess(actor, booking.projectId);
  return booking;
}

export interface ProjectFilter {
  stage?: ProjectStage | undefined;
  search?: string | undefined;
  skip?: number | undefined;
  take?: number | undefined;
}

export async function listProjects(actor: Actor, filter: ProjectFilter) {
  const where: Prisma.ProjectWhereInput = {
    ...(filter.stage !== undefined ? { currentStage: filter.stage } : {}),
    ...(filter.search
      ? {
          OR: [
            { reference: { contains: filter.search, mode: 'insensitive' } },
            { contact: { fullName: { contains: filter.search, mode: 'insensitive' } } },
            { siteArea: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  if (actor.role === UserRole.VISITING_OFFICER) {
    where.OR = [
      { visitBooking: { is: { assignedOfficerId: actor.userId } } },
      { visitBooking: { is: { surveys: { some: { capturedById: actor.userId } } } } },
    ];
  } else if (actor.role === UserRole.JUNIOR_ARCHITECT) {
    where.juniorAssignments = { some: { juniorArchitectId: actor.userId } };
  } else if (actor.role === UserRole.CLIENT) {
    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      select: { email: true },
    });
    where.contact = {
      email: { equals: user?.email ?? '__none__', mode: 'insensitive' },
    };
  } else if (!hasCompanyWideProjectVisibility(actor.role)) {
    throw httpError('Project list is not available for this role', 403, 'FORBIDDEN');
  }

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        contact: true,
        visitBooking: {
          include: { assignedOfficer: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: filter.skip ?? 0,
      take: Math.min(filter.take ?? 50, 200),
    }),
    prisma.project.count({ where }),
  ]);

  return { items, total };
}

export async function getProject(actor: Actor, projectId: string) {
  const { project, access } = await getProjectAccess(actor, projectId);
  return { ...project, access };
}

export async function getProjectByConversation(actor: Actor, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { linkedProjectId: true },
  });
  if (!conversation?.linkedProjectId) {
    throw httpError('Conversation is still an enquiry; no project exists yet', 404, 'NO_PROJECT');
  }
  return getProject(actor, conversation.linkedProjectId);
}

/**
 * Recompute the derived Stage 1 state after survey/report/assignment changes.
 * Stored so list screens can filter, but always derived from the source rows.
 */
export async function refreshProjectStage(projectId: string): Promise<ProjectStage> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      visitBooking: {
        include: { surveys: { orderBy: { version: 'desc' } } },
      },
      juniorAssignments: true,
    },
  });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');

  const latestSurvey = project.visitBooking?.surveys[0];
  const reports = latestSurvey
    ? await prisma.reportVersion.findMany({
        where: { surveyId: latestSurvey.id },
        orderBy: { versionNumber: 'desc' },
      })
    : [];
  const latestReport = reports[0];

  let stage: ProjectStage = ProjectStage.VISIT_BOOKED;
  if (project.visitBooking?.checkOutAt) stage = ProjectStage.VISIT_COMPLETED;
  else if (project.visitBooking?.checkInAt) stage = ProjectStage.VISIT_UNDERWAY;

  if (latestSurvey && latestSurvey.lockedAt) {
    stage = ProjectStage.REPORT_GENERATING;
  }
  if (latestReport?.generatorStatus === 'GENERATED') {
    stage = ProjectStage.REPORT_GENERATED;
  }
  if (latestReport?.approvalState === 'IN_REVIEW') {
    stage = ProjectStage.UNDER_REVIEW;
  }
  if (latestReport?.approvalState === 'RETURNED') {
    stage = ProjectStage.CORRECTIONS_REQUESTED;
  }
  if (latestReport?.approvalState === 'APPROVED') {
    stage = ProjectStage.APPROVED;
  }
  const publication = latestReport
    ? await prisma.portalPublication.findFirst({
        where: { reportVersionId: latestReport.id, revokedAt: null },
      })
    : null;
  if (publication) stage = ProjectStage.PUBLISHED_TO_CLIENT;

  const surveySubmitted =
    latestSurvey?.status === SurveyStatus.SUBMITTED ||
    latestSurvey?.status === SurveyStatus.RESUBMITTED;
  if (
    surveySubmitted &&
    latestReport?.approvalState === 'APPROVED' &&
    project.juniorAssignments.length > 0
  ) {
    stage = ProjectStage.STAGE_1_COMPLETE;
  }

  await prisma.project.update({ where: { id: projectId }, data: { currentStage: stage } });
  return stage;
}

export async function getBookingFeeSummary(bookingId: string) {
  const booking = await prisma.visitBooking.findUnique({
    where: { id: bookingId },
    select: {
      visitFeeKes: true,
      paymentStatus: true,
    },
  });
  return {
    visitFeeKes: booking?.visitFeeKes?.toFixed(2) ?? null,
    paymentStatus: booking?.paymentStatus ?? PaymentStatus.PENDING,
  };
}

export async function recordVisitFee(
  actor: Actor,
  bookingId: string,
  paymentStatus: PaymentStatus,
  req?: Request,
) {
  assertBookingManager(actor);
  const booking = await prisma.visitBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw httpError('Booking not found', 404, 'BOOKING_NOT_FOUND');

  const updated = await prisma.visitBooking.update({
    where: { id: bookingId },
    data: { paymentStatus },
  });
  await writeAudit({
    actorId: actor.userId,
    action: 'VISIT_FEE_STATUS_CHANGED',
    entityType: 'VisitBooking',
    entityId: bookingId,
    projectId: booking.projectId,
    before: { paymentStatus: booking.paymentStatus },
    after: { paymentStatus: updated.paymentStatus },
    ...(req ? extractRequestMeta(req) : {}),
  });
  return updated;
}
