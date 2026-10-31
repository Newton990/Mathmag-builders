// packages/shared/src/enums.ts
// All business-rule enums for MBMS. These are the source of truth for
// state machines — both API and web import from here.

/** All staff and client roles in the system. */
export enum UserRole {
  CLIENT_RELATIONS_OFFICER = 'CLIENT_RELATIONS_OFFICER',
  VISITING_OFFICER = 'VISITING_OFFICER',
  LEAD_ARCHITECT = 'LEAD_ARCHITECT',
  JUNIOR_ARCHITECT = 'JUNIOR_ARCHITECT',
  CLIENT = 'CLIENT',
  ADMIN_MANAGEMENT = 'ADMIN_MANAGEMENT',
  GENERAL_MANAGER = 'GENERAL_MANAGER',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  SITE_SUPERVISOR = 'SITE_SUPERVISOR',
  STOREKEEPER = 'STOREKEEPER',
  INDEPENDENT_AUDITOR = 'INDEPENDENT_AUDITOR',
  QUALIFIED_PROFESSIONAL = 'QUALIFIED_PROFESSIONAL',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  SUPPLIER = 'SUPPLIER',
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
  REPORT_GENERATING = 'REPORT_GENERATING',
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

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2 — Planning & Technical Design
// ═══════════════════════════════════════════════════════════════════════════════

/** Disciplines for design work in Module 2. */
export enum DesignDiscipline {
  ARCHITECTURAL_2D = 'ARCHITECTURAL_2D',
  ARCHITECTURAL_3D = 'ARCHITECTURAL_3D',
  STRUCTURAL = 'STRUCTURAL',
  MECHANICAL_PLUMBING = 'MECHANICAL_PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  QUANTITY_SURVEYING = 'QUANTITY_SURVEYING',
}

/** Design task lifecycle states. */
export enum DesignTaskStatus {
  DRAFT = 'DRAFT',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED_FOR_REVIEW = 'SUBMITTED_FOR_REVIEW',
  RETURNED_WITH_COMMENTS = 'RETURNED_WITH_COMMENTS',
  TECHNICALLY_APPROVED = 'TECHNICALLY_APPROVED',
  RELEASED = 'RELEASED',
  SUPERSEDED = 'SUPERSEDED',
}

/** Working file categories. */
export enum WorkingFileKind {
  NATIVE_CAD = 'NATIVE_CAD',
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  CALCULATION = 'CALCULATION',
  SCHEDULE = 'SCHEDULE',
  OTHER = 'OTHER',
}

/** Client design approval types. */
export enum DesignApprovalType {
  TWO_D = 'TWO_D',
  THREE_D = 'THREE_D',
}

/** Design approval status. */
export enum DesignApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/** Coordination issue status. */
export enum CoordinationIssueStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_RESOLUTION = 'IN_RESOLUTION',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

/** Design change classification. */
export enum DesignChangeType {
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
}

/** Cost estimate status. */
export enum EstimateStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  SUPERSEDED = 'SUPERSEDED',
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3 — Client Acceptance & Budget
// ═══════════════════════════════════════════════════════════════════════════════

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum AcceptanceMethod {
  PORTAL = 'PORTAL',
  SIGNED_FORM = 'SIGNED_FORM',
  MEETING = 'MEETING',
}

export enum AcceptanceStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  RETURNED_FOR_CLARIFICATION = 'RETURNED_FOR_CLARIFICATION',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
}

export enum PaymentMilestoneStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  WAIVED = 'WAIVED',
}

export enum ModuleReleaseStatus {
  PENDING = 'PENDING',
  RELEASED = 'RELEASED',
  BLOCKED = 'BLOCKED',
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — Approvals
// ═══════════════════════════════════════════════════════════════════════════════

export enum ApprovalCaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  RETURNED = 'RETURNED',
  CLEARED = 'CLEARED',
  REJECTED = 'REJECTED',
}

export enum PermitStatus {
  PENDING = 'PENDING',
  APPLIED = 'APPLIED',
  ISSUED = 'ISSUED',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum PrintingStatus {
  PENDING = 'PENDING',
  PRINTED = 'PRINTED',
  STAMPED = 'STAMPED',
  ISSUED = 'ISSUED',
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 5 — Contracts
// ═══════════════════════════════════════════════════════════════════════════════

export enum ContractStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  UNDER_NEGOTIATION = 'UNDER_NEGOTIATION',
  EXECUTED = 'EXECUTED',
  TERMINATED = 'TERMINATED',
  EXPIRED = 'EXPIRED',
}

export enum ServiceEngagementType {
  DESIGN_ONLY = 'DESIGN_ONLY',
  PRINTING_ONLY = 'PRINTING_ONLY',
  APPROVALS_ONLY = 'APPROVALS_ONLY',
  TECHNICAL_INSPECTION = 'TECHNICAL_INSPECTION',
  LABOUR_ONLY = 'LABOUR_ONLY',
  FULL_CONSTRUCTION = 'FULL_CONSTRUCTION',
}



// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 7 — Central Administration & Governance
// ═══════════════════════════════════════════════════════════════════════════════

export enum DelegationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum ActingAuthorityStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum ExceptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

export enum ProtectedAuditStatus {
  OPEN = 'OPEN',
  TRIAGED = 'TRIAGED',
  INVESTIGATING = 'INVESTIGATING',
  ACTIONS_PENDING = 'ACTIONS_PENDING',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum RequisitionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PO_CREATED = 'PO_CREATED',
  CLOSED = 'CLOSED',
}

export enum POStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}
