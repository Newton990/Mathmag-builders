// packages/shared/src/enums.ts
// All business-rule enums for MBMS. These are the source of truth for
// state machines — both API and web import from here.

/** The six staff + client roles in the system. */
export enum UserRole {
  CLIENT_RELATIONS_OFFICER = 'CLIENT_RELATIONS_OFFICER',
  VISITING_OFFICER = 'VISITING_OFFICER',
  LEAD_ARCHITECT = 'LEAD_ARCHITECT',
  JUNIOR_ARCHITECT = 'JUNIOR_ARCHITECT',
  CLIENT = 'CLIENT',
  ADMIN_MANAGEMENT = 'ADMIN_MANAGEMENT',
}

/** Conversation (thread) states in the communications inbox. */
export enum ConversationStatus {
  OPEN = 'OPEN',
  IN_DISCUSSION = 'IN_DISCUSSION',
  VISIT_AGREED = 'VISIT_AGREED',
  LINKED_TO_PROJECT = 'LINKED_TO_PROJECT',
  CLOSED = 'CLOSED',
}

/** Visit booking lifecycle states. */
export enum BookingStatus {
  BOOKED = 'BOOKED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  VISIT_UNDERWAY = 'VISIT_UNDERWAY',
  VISIT_COMPLETED = 'VISIT_COMPLETED',
}

/** Site survey submission states. */
export enum SurveyStatus {
  NOT_STARTED = 'NOT_STARTED',
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  CORRECTIONS_REQUESTED = 'CORRECTIONS_REQUESTED',
  RESUBMITTED = 'RESUBMITTED',
}

/** Report version review states. */
export enum ReportApprovalState {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
}

/** Overall project stage (Module 1 scope). */
export enum ProjectStage {
  VISIT_BOOKED = 'VISIT_BOOKED',
  VISIT_UNDERWAY = 'VISIT_UNDERWAY',
  VISIT_COMPLETED = 'VISIT_COMPLETED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CORRECTIONS_REQUESTED = 'CORRECTIONS_REQUESTED',
  APPROVED = 'APPROVED',
  PUBLISHED_TO_CLIENT = 'PUBLISHED_TO_CLIENT',
  STAGE_1_COMPLETE = 'STAGE_1_COMPLETE',
}

/** Media asset categories for site surveys. */
export enum MediaKind {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  SKETCH = 'SKETCH',
  DOCUMENT = 'DOCUMENT',
}

/** Source channels for incoming enquiries. */
export enum SourceChannel {
  MANUAL = 'MANUAL',
  WALK_IN = 'WALK_IN',
  PHONE = 'PHONE',
  // Adapter stubs — implementations added later
  WHATSAPP = 'WHATSAPP',
  FACEBOOK = 'FACEBOOK',
  EMAIL = 'EMAIL',
}

/** Payment status for the site visit fee. */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  WAIVED = 'WAIVED',
}

/** Notification delivery channels. */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL', // Stub — pluggable later
  WHATSAPP = 'WHATSAPP', // Stub — pluggable later
}

/** Notification delivery status. */
export enum DeliveryStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
}
