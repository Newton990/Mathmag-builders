/** All staff and client roles in the system. */
export declare enum UserRole {
    CLIENT_RELATIONS_OFFICER = "CLIENT_RELATIONS_OFFICER",
    VISITING_OFFICER = "VISITING_OFFICER",
    LEAD_ARCHITECT = "LEAD_ARCHITECT",
    JUNIOR_ARCHITECT = "JUNIOR_ARCHITECT",
    CLIENT = "CLIENT",
    ADMIN_MANAGEMENT = "ADMIN_MANAGEMENT",
    GENERAL_MANAGER = "GENERAL_MANAGER",
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD",
    PROJECT_MANAGER = "PROJECT_MANAGER",
    SITE_SUPERVISOR = "SITE_SUPERVISOR",
    STOREKEEPER = "STOREKEEPER",
    INDEPENDENT_AUDITOR = "INDEPENDENT_AUDITOR",
    QUALIFIED_PROFESSIONAL = "QUALIFIED_PROFESSIONAL",
    SUBCONTRACTOR = "SUBCONTRACTOR",
    SUPPLIER = "SUPPLIER"
}
/** Conversation (thread) states in the communications inbox. */
export declare enum ConversationStatus {
    OPEN = "OPEN",
    IN_DISCUSSION = "IN_DISCUSSION",
    VISIT_AGREED = "VISIT_AGREED",
    LINKED_TO_PROJECT = "LINKED_TO_PROJECT",
    CLOSED = "CLOSED"
}
/** Visit booking lifecycle states. */
export declare enum BookingStatus {
    BOOKED = "BOOKED",
    RESCHEDULED = "RESCHEDULED",
    CANCELLED = "CANCELLED",
    VISIT_UNDERWAY = "VISIT_UNDERWAY",
    VISIT_COMPLETED = "VISIT_COMPLETED"
}
/** Site survey submission states. */
export declare enum SurveyStatus {
    NOT_STARTED = "NOT_STARTED",
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    CORRECTIONS_REQUESTED = "CORRECTIONS_REQUESTED",
    RESUBMITTED = "RESUBMITTED"
}
/** Report version review states. */
export declare enum ReportApprovalState {
    DRAFT = "DRAFT",
    IN_REVIEW = "IN_REVIEW",
    APPROVED = "APPROVED",
    RETURNED = "RETURNED"
}
/** Overall project stage (Module 1 scope). */
export declare enum ProjectStage {
    VISIT_BOOKED = "VISIT_BOOKED",
    VISIT_UNDERWAY = "VISIT_UNDERWAY",
    VISIT_COMPLETED = "VISIT_COMPLETED",
    REPORT_GENERATING = "REPORT_GENERATING",
    REPORT_GENERATED = "REPORT_GENERATED",
    UNDER_REVIEW = "UNDER_REVIEW",
    CORRECTIONS_REQUESTED = "CORRECTIONS_REQUESTED",
    APPROVED = "APPROVED",
    PUBLISHED_TO_CLIENT = "PUBLISHED_TO_CLIENT",
    STAGE_1_COMPLETE = "STAGE_1_COMPLETE"
}
/** Media asset categories for site surveys. */
export declare enum MediaKind {
    PHOTO = "PHOTO",
    VIDEO = "VIDEO",
    SKETCH = "SKETCH",
    DOCUMENT = "DOCUMENT"
}
/** Source channels for incoming enquiries. */
export declare enum SourceChannel {
    MANUAL = "MANUAL",
    WALK_IN = "WALK_IN",
    PHONE = "PHONE",
    WHATSAPP = "WHATSAPP",
    FACEBOOK = "FACEBOOK",
    EMAIL = "EMAIL"
}
/** Payment status for the site visit fee. */
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    WAIVED = "WAIVED"
}
/** Notification delivery channels. */
export declare enum NotificationChannel {
    IN_APP = "IN_APP",
    EMAIL = "EMAIL",// Stub — pluggable later
    WHATSAPP = "WHATSAPP"
}
/** Notification delivery status. */
export declare enum DeliveryStatus {
    PENDING = "PENDING",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED",
    READ = "READ"
}
/** Disciplines for design work in Module 2. */
export declare enum DesignDiscipline {
    ARCHITECTURAL_2D = "ARCHITECTURAL_2D",
    ARCHITECTURAL_3D = "ARCHITECTURAL_3D",
    STRUCTURAL = "STRUCTURAL",
    MECHANICAL_PLUMBING = "MECHANICAL_PLUMBING",
    ELECTRICAL = "ELECTRICAL",
    QUANTITY_SURVEYING = "QUANTITY_SURVEYING"
}
/** Design task lifecycle states. */
export declare enum DesignTaskStatus {
    DRAFT = "DRAFT",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    SUBMITTED_FOR_REVIEW = "SUBMITTED_FOR_REVIEW",
    RETURNED_WITH_COMMENTS = "RETURNED_WITH_COMMENTS",
    TECHNICALLY_APPROVED = "TECHNICALLY_APPROVED",
    RELEASED = "RELEASED",
    SUPERSEDED = "SUPERSEDED"
}
/** Working file categories. */
export declare enum WorkingFileKind {
    NATIVE_CAD = "NATIVE_CAD",
    PDF = "PDF",
    IMAGE = "IMAGE",
    CALCULATION = "CALCULATION",
    SCHEDULE = "SCHEDULE",
    OTHER = "OTHER"
}
/** Client design approval types. */
export declare enum DesignApprovalType {
    TWO_D = "TWO_D",
    THREE_D = "THREE_D"
}
/** Design approval status. */
export declare enum DesignApprovalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
/** Coordination issue status. */
export declare enum CoordinationIssueStatus {
    OPEN = "OPEN",
    ASSIGNED = "ASSIGNED",
    IN_RESOLUTION = "IN_RESOLUTION",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED"
}
/** Design change classification. */
export declare enum DesignChangeType {
    MINOR = "MINOR",
    MAJOR = "MAJOR"
}
/** Cost estimate status. */
export declare enum EstimateStatus {
    DRAFT = "DRAFT",
    IN_REVIEW = "IN_REVIEW",
    APPROVED = "APPROVED",
    SUPERSEDED = "SUPERSEDED"
}
export declare enum ProposalStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    UNDER_REVIEW = "UNDER_REVIEW",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    SUPERSEDED = "SUPERSEDED"
}
export declare enum AcceptanceMethod {
    PORTAL = "PORTAL",
    SIGNED_FORM = "SIGNED_FORM",
    MEETING = "MEETING"
}
export declare enum AcceptanceStatus {
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    RETURNED_FOR_CLARIFICATION = "RETURNED_FOR_CLARIFICATION",
    REJECTED = "REJECTED",
    ACCEPTED = "ACCEPTED"
}
export declare enum PaymentMilestoneStatus {
    PENDING = "PENDING",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    PAID = "PAID",
    WAIVED = "WAIVED"
}
export declare enum ModuleReleaseStatus {
    PENDING = "PENDING",
    RELEASED = "RELEASED",
    BLOCKED = "BLOCKED"
}
export declare enum ApprovalCaseStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    SUBMITTED = "SUBMITTED",
    RETURNED = "RETURNED",
    CLEARED = "CLEARED",
    REJECTED = "REJECTED"
}
export declare enum PermitStatus {
    PENDING = "PENDING",
    APPLIED = "APPLIED",
    ISSUED = "ISSUED",
    EXPIRED = "EXPIRED",
    SUSPENDED = "SUSPENDED",
    REJECTED = "REJECTED"
}
export declare enum PrintingStatus {
    PENDING = "PENDING",
    PRINTED = "PRINTED",
    STAMPED = "STAMPED",
    ISSUED = "ISSUED"
}
export declare enum ContractStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    UNDER_NEGOTIATION = "UNDER_NEGOTIATION",
    EXECUTED = "EXECUTED",
    TERMINATED = "TERMINATED",
    EXPIRED = "EXPIRED"
}
export declare enum ServiceEngagementType {
    DESIGN_ONLY = "DESIGN_ONLY",
    PRINTING_ONLY = "PRINTING_ONLY",
    APPROVALS_ONLY = "APPROVALS_ONLY",
    TECHNICAL_INSPECTION = "TECHNICAL_INSPECTION",
    LABOUR_ONLY = "LABOUR_ONLY",
    FULL_CONSTRUCTION = "FULL_CONSTRUCTION"
}
export declare enum DelegationStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    REVOKED = "REVOKED",
    EXPIRED = "EXPIRED"
}
export declare enum ActingAuthorityStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    REVOKED = "REVOKED"
}
export declare enum ExceptionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CLOSED = "CLOSED"
}
export declare enum ProtectedAuditStatus {
    OPEN = "OPEN",
    TRIAGED = "TRIAGED",
    INVESTIGATING = "INVESTIGATING",
    ACTIONS_PENDING = "ACTIONS_PENDING",
    CLOSED = "CLOSED",
    ESCALATED = "ESCALATED"
}
export declare enum LeaveStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}
export declare enum RequisitionStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PO_CREATED = "PO_CREATED",
    CLOSED = "CLOSED"
}
export declare enum POStatus {
    DRAFT = "DRAFT",
    APPROVED = "APPROVED",
    SENT = "SENT",
    RECEIVED = "RECEIVED",
    CLOSED = "CLOSED",
    CANCELLED = "CANCELLED"
}
//# sourceMappingURL=enums.d.ts.map