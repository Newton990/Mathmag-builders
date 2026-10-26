// src/routes/schemas.ts
// Shared request schemas for Module 1 routes. Every schema follows the
// { body, query, params } envelope understood by validate().
import { z } from 'zod';
import { PhoneNumberSchema } from '@mbms/shared';
import {
  BookingStatus,
  ConversationStatus,
  MediaKind,
  PaymentStatus,
  Priority,
  ProjectStage,
  ReportApprovalState,
  ReviewDecision,
  SourceChannel,
} from '@prisma/client';

export const IdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const PaginationSchema = z.object({
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
});

export const ContactInputSchema = z.object({
  fullName: z.string().min(2).max(200),
  primaryPhone: PhoneNumberSchema,
  organisation: z.string().max(200).optional(),
  alternatePhone: PhoneNumberSchema.optional(),
  email: z.string().email().optional(),
  sourceChannel: z.nativeEnum(SourceChannel).optional(),
  consentMarketing: z.boolean().optional(),
  consentDataProc: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export const SiteDetailsSchema = z.object({
  county: z.string().min(2).max(100),
  area: z.string().min(2).max(200),
  subCounty: z.string().max(100).optional(),
  directions: z.string().max(2000).optional(),
  projectType: z.string().max(100).optional(),
  description: z.string().max(4000).optional(),
});

export const GpsSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().nonnegative().optional(),
    capturedAt: z.string().datetime().optional(),
    note: z.string().max(500).optional(),
  })
  .passthrough();

export const ConfirmBookingSchema = z.object({
  body: z.object({
    idempotencyKey: z.string().min(8).max(120),
    scheduledAt: z.coerce.date(),
    site: SiteDetailsSchema,
    conversationId: z.string().min(1).optional(),
    contactId: z.string().min(1).optional(),
    contact: ContactInputSchema.optional(),
    assignedOfficerId: z.string().min(1).optional(),
    visitFeeKes: z.number().nonnegative().max(100_000_000).optional(),
    specialInstructions: z.string().max(2000).optional(),
  }),
});

export const ConversationListQuery = z.object({
  query: PaginationSchema.extend({
    status: z.nativeEnum(ConversationStatus).optional(),
    assignedStaffId: z.string().min(1).optional(),
    q: z.string().max(200).optional(),
  }),
});

export const CreateConversationSchema = z.object({
  body: z.object({
    contactId: z.string().min(1).optional(),
    contact: ContactInputSchema.optional(),
    channel: z.nativeEnum(SourceChannel),
    subject: z.string().max(200).optional(),
    assignedStaffId: z.string().min(1).optional(),
    externalThreadId: z.string().max(200).optional(),
    initialMessage: z.string().max(10_000).optional(),
    followUpAt: z.coerce.date().optional(),
  }),
});

export const UpdateConversationSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    assignedStaffId: z.string().min(1).nullable().optional(),
    status: z.nativeEnum(ConversationStatus).optional(),
    subject: z.string().max(200).optional(),
    followUpAt: z.coerce.date().nullable().optional(),
  }),
});

export const AddMessageSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    content: z.string().min(1).max(10_000),
    isNote: z.boolean().optional(),
  }),
});

export const BookingListQuery = z.object({
  query: PaginationSchema.extend({
    status: z.nativeEnum(BookingStatus).optional(),
    officerId: z.string().min(1).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});

export const RescheduleBookingSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    scheduledAt: z.coerce.date(),
    reason: z.string().min(5).max(1000),
  }),
});

export const CancelBookingSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ reason: z.string().min(5).max(1000) }),
});

export const GpsBodySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ gps: GpsSchema }),
});

export const ProjectListQuery = z.object({
  query: PaginationSchema.extend({
    stage: z.nativeEnum(ProjectStage).optional(),
    q: z.string().max(200).optional(),
  }),
});

const SectionObject = z.record(z.unknown());

export const SurveyDraftPatchSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    sectionB: SectionObject.optional(),
    sectionC: SectionObject.optional(),
    sectionD: SectionObject.optional(),
    sectionE: SectionObject.optional(),
    sectionF: SectionObject.optional(),
    sectionG: SectionObject.optional(),
  }),
});

export const MediaUploadMetaSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    kind: z.nativeEnum(MediaKind),
    category: z.string().min(1).max(100),
    caption: z.string().max(500).optional(),
    capturedAt: z.coerce.date().optional(),
    idempotencyKey: z.string().min(8).max(120),
  }),
});

export const ReportListQuery = z.object({
  query: PaginationSchema.extend({
    projectId: z.string().min(1).optional(),
    approvalState: z.nativeEnum(ReportApprovalState).optional(),
  }),
});

export const ReviewReportSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    decision: z.nativeEnum(ReviewDecision),
    comments: z.string().max(4000).optional(),
  }),
});

export const AssignJuniorSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    reportVersionId: z.string().min(1),
    juniorArchitectId: z.string().min(1),
    dueDate: z.coerce.date().optional(),
    priority: z.nativeEnum(Priority).optional(),
    instructions: z.string().max(4000).optional(),
  }),
});

export const PublishReportSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    permittedMediaIds: z.array(z.string().min(1)).max(500).default([]),
  }),
});

export const RevokePublicationSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ reason: z.string().min(5).max(1000) }),
});

export const CreatePublicationSchema = z.object({
  body: z.object({
    reportVersionId: z.string().min(1),
    permittedMediaIds: z.array(z.string().min(1)).max(500).default([]),
  }),
});

export const DownloadQuery = z.object({
  query: z.object({ format: z.enum(['pdf', 'docx']).default('pdf') }),
});

export const RecordVisitFeeSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ paymentStatus: z.nativeEnum(PaymentStatus) }),
});
