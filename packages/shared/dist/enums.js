// packages/shared/src/enums.ts
// All business-rule enums for MBMS. These are the source of truth for
// state machines — both API and web import from here.
/** All staff and client roles in the system. */
export var UserRole;
(function (UserRole) {
    UserRole["CLIENT_RELATIONS_OFFICER"] = "CLIENT_RELATIONS_OFFICER";
    UserRole["VISITING_OFFICER"] = "VISITING_OFFICER";
    UserRole["LEAD_ARCHITECT"] = "LEAD_ARCHITECT";
    UserRole["JUNIOR_ARCHITECT"] = "JUNIOR_ARCHITECT";
    UserRole["CLIENT"] = "CLIENT";
    UserRole["ADMIN_MANAGEMENT"] = "ADMIN_MANAGEMENT";
    UserRole["GENERAL_MANAGER"] = "GENERAL_MANAGER";
    UserRole["DEPARTMENT_HEAD"] = "DEPARTMENT_HEAD";
    UserRole["PROJECT_MANAGER"] = "PROJECT_MANAGER";
    UserRole["SITE_SUPERVISOR"] = "SITE_SUPERVISOR";
    UserRole["STOREKEEPER"] = "STOREKEEPER";
    UserRole["INDEPENDENT_AUDITOR"] = "INDEPENDENT_AUDITOR";
    UserRole["QUALIFIED_PROFESSIONAL"] = "QUALIFIED_PROFESSIONAL";
    UserRole["SUBCONTRACTOR"] = "SUBCONTRACTOR";
    UserRole["SUPPLIER"] = "SUPPLIER";
})(UserRole || (UserRole = {}));
/** Conversation (thread) states in the communications inbox. */
export var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["OPEN"] = "OPEN";
    ConversationStatus["IN_DISCUSSION"] = "IN_DISCUSSION";
    ConversationStatus["VISIT_AGREED"] = "VISIT_AGREED";
    ConversationStatus["LINKED_TO_PROJECT"] = "LINKED_TO_PROJECT";
    ConversationStatus["CLOSED"] = "CLOSED";
})(ConversationStatus || (ConversationStatus = {}));
/** Visit booking lifecycle states. */
export var BookingStatus;
(function (BookingStatus) {
    BookingStatus["BOOKED"] = "BOOKED";
    BookingStatus["RESCHEDULED"] = "RESCHEDULED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["VISIT_UNDERWAY"] = "VISIT_UNDERWAY";
    BookingStatus["VISIT_COMPLETED"] = "VISIT_COMPLETED";
})(BookingStatus || (BookingStatus = {}));
/** Site survey submission states. */
export var SurveyStatus;
(function (SurveyStatus) {
    SurveyStatus["NOT_STARTED"] = "NOT_STARTED";
    SurveyStatus["DRAFT"] = "DRAFT";
    SurveyStatus["SUBMITTED"] = "SUBMITTED";
    SurveyStatus["CORRECTIONS_REQUESTED"] = "CORRECTIONS_REQUESTED";
    SurveyStatus["RESUBMITTED"] = "RESUBMITTED";
})(SurveyStatus || (SurveyStatus = {}));
/** Report version review states. */
export var ReportApprovalState;
(function (ReportApprovalState) {
    ReportApprovalState["DRAFT"] = "DRAFT";
    ReportApprovalState["IN_REVIEW"] = "IN_REVIEW";
    ReportApprovalState["APPROVED"] = "APPROVED";
    ReportApprovalState["RETURNED"] = "RETURNED";
})(ReportApprovalState || (ReportApprovalState = {}));
/** Overall project stage (Module 1 scope). */
export var ProjectStage;
(function (ProjectStage) {
    ProjectStage["VISIT_BOOKED"] = "VISIT_BOOKED";
    ProjectStage["VISIT_UNDERWAY"] = "VISIT_UNDERWAY";
    ProjectStage["VISIT_COMPLETED"] = "VISIT_COMPLETED";
    ProjectStage["REPORT_GENERATING"] = "REPORT_GENERATING";
    ProjectStage["REPORT_GENERATED"] = "REPORT_GENERATED";
    ProjectStage["UNDER_REVIEW"] = "UNDER_REVIEW";
    ProjectStage["CORRECTIONS_REQUESTED"] = "CORRECTIONS_REQUESTED";
    ProjectStage["APPROVED"] = "APPROVED";
    ProjectStage["PUBLISHED_TO_CLIENT"] = "PUBLISHED_TO_CLIENT";
    ProjectStage["STAGE_1_COMPLETE"] = "STAGE_1_COMPLETE";
})(ProjectStage || (ProjectStage = {}));
/** Media asset categories for site surveys. */
export var MediaKind;
(function (MediaKind) {
    MediaKind["PHOTO"] = "PHOTO";
    MediaKind["VIDEO"] = "VIDEO";
    MediaKind["SKETCH"] = "SKETCH";
    MediaKind["DOCUMENT"] = "DOCUMENT";
})(MediaKind || (MediaKind = {}));
/** Source channels for incoming enquiries. */
export var SourceChannel;
(function (SourceChannel) {
    SourceChannel["MANUAL"] = "MANUAL";
    SourceChannel["WALK_IN"] = "WALK_IN";
    SourceChannel["PHONE"] = "PHONE";
    // Adapter stubs — implementations added later
    SourceChannel["WHATSAPP"] = "WHATSAPP";
    SourceChannel["FACEBOOK"] = "FACEBOOK";
    SourceChannel["EMAIL"] = "EMAIL";
})(SourceChannel || (SourceChannel = {}));
/** Payment status for the site visit fee. */
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["WAIVED"] = "WAIVED";
})(PaymentStatus || (PaymentStatus = {}));
/** Notification delivery channels. */
export var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["IN_APP"] = "IN_APP";
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["WHATSAPP"] = "WHATSAPP";
})(NotificationChannel || (NotificationChannel = {}));
/** Notification delivery status. */
export var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "PENDING";
    DeliveryStatus["DELIVERED"] = "DELIVERED";
    DeliveryStatus["FAILED"] = "FAILED";
    DeliveryStatus["READ"] = "READ";
})(DeliveryStatus || (DeliveryStatus = {}));
// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2 — Planning & Technical Design
// ═══════════════════════════════════════════════════════════════════════════════
/** Disciplines for design work in Module 2. */
export var DesignDiscipline;
(function (DesignDiscipline) {
    DesignDiscipline["ARCHITECTURAL_2D"] = "ARCHITECTURAL_2D";
    DesignDiscipline["ARCHITECTURAL_3D"] = "ARCHITECTURAL_3D";
    DesignDiscipline["STRUCTURAL"] = "STRUCTURAL";
    DesignDiscipline["MECHANICAL_PLUMBING"] = "MECHANICAL_PLUMBING";
    DesignDiscipline["ELECTRICAL"] = "ELECTRICAL";
    DesignDiscipline["QUANTITY_SURVEYING"] = "QUANTITY_SURVEYING";
})(DesignDiscipline || (DesignDiscipline = {}));
/** Design task lifecycle states. */
export var DesignTaskStatus;
(function (DesignTaskStatus) {
    DesignTaskStatus["DRAFT"] = "DRAFT";
    DesignTaskStatus["ASSIGNED"] = "ASSIGNED";
    DesignTaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    DesignTaskStatus["SUBMITTED_FOR_REVIEW"] = "SUBMITTED_FOR_REVIEW";
    DesignTaskStatus["RETURNED_WITH_COMMENTS"] = "RETURNED_WITH_COMMENTS";
    DesignTaskStatus["TECHNICALLY_APPROVED"] = "TECHNICALLY_APPROVED";
    DesignTaskStatus["RELEASED"] = "RELEASED";
    DesignTaskStatus["SUPERSEDED"] = "SUPERSEDED";
})(DesignTaskStatus || (DesignTaskStatus = {}));
/** Working file categories. */
export var WorkingFileKind;
(function (WorkingFileKind) {
    WorkingFileKind["NATIVE_CAD"] = "NATIVE_CAD";
    WorkingFileKind["PDF"] = "PDF";
    WorkingFileKind["IMAGE"] = "IMAGE";
    WorkingFileKind["CALCULATION"] = "CALCULATION";
    WorkingFileKind["SCHEDULE"] = "SCHEDULE";
    WorkingFileKind["OTHER"] = "OTHER";
})(WorkingFileKind || (WorkingFileKind = {}));
/** Client design approval types. */
export var DesignApprovalType;
(function (DesignApprovalType) {
    DesignApprovalType["TWO_D"] = "TWO_D";
    DesignApprovalType["THREE_D"] = "THREE_D";
})(DesignApprovalType || (DesignApprovalType = {}));
/** Design approval status. */
export var DesignApprovalStatus;
(function (DesignApprovalStatus) {
    DesignApprovalStatus["PENDING"] = "PENDING";
    DesignApprovalStatus["APPROVED"] = "APPROVED";
    DesignApprovalStatus["REJECTED"] = "REJECTED";
})(DesignApprovalStatus || (DesignApprovalStatus = {}));
/** Coordination issue status. */
export var CoordinationIssueStatus;
(function (CoordinationIssueStatus) {
    CoordinationIssueStatus["OPEN"] = "OPEN";
    CoordinationIssueStatus["ASSIGNED"] = "ASSIGNED";
    CoordinationIssueStatus["IN_RESOLUTION"] = "IN_RESOLUTION";
    CoordinationIssueStatus["RESOLVED"] = "RESOLVED";
    CoordinationIssueStatus["CLOSED"] = "CLOSED";
})(CoordinationIssueStatus || (CoordinationIssueStatus = {}));
/** Design change classification. */
export var DesignChangeType;
(function (DesignChangeType) {
    DesignChangeType["MINOR"] = "MINOR";
    DesignChangeType["MAJOR"] = "MAJOR";
})(DesignChangeType || (DesignChangeType = {}));
/** Cost estimate status. */
export var EstimateStatus;
(function (EstimateStatus) {
    EstimateStatus["DRAFT"] = "DRAFT";
    EstimateStatus["IN_REVIEW"] = "IN_REVIEW";
    EstimateStatus["APPROVED"] = "APPROVED";
    EstimateStatus["SUPERSEDED"] = "SUPERSEDED";
})(EstimateStatus || (EstimateStatus = {}));
// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3 — Client Acceptance & Budget
// ═══════════════════════════════════════════════════════════════════════════════
export var ProposalStatus;
(function (ProposalStatus) {
    ProposalStatus["DRAFT"] = "DRAFT";
    ProposalStatus["PUBLISHED"] = "PUBLISHED";
    ProposalStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    ProposalStatus["ACCEPTED"] = "ACCEPTED";
    ProposalStatus["REJECTED"] = "REJECTED";
    ProposalStatus["SUPERSEDED"] = "SUPERSEDED";
})(ProposalStatus || (ProposalStatus = {}));
export var AcceptanceMethod;
(function (AcceptanceMethod) {
    AcceptanceMethod["PORTAL"] = "PORTAL";
    AcceptanceMethod["SIGNED_FORM"] = "SIGNED_FORM";
    AcceptanceMethod["MEETING"] = "MEETING";
})(AcceptanceMethod || (AcceptanceMethod = {}));
export var AcceptanceStatus;
(function (AcceptanceStatus) {
    AcceptanceStatus["PENDING"] = "PENDING";
    AcceptanceStatus["VERIFIED"] = "VERIFIED";
    AcceptanceStatus["RETURNED_FOR_CLARIFICATION"] = "RETURNED_FOR_CLARIFICATION";
    AcceptanceStatus["REJECTED"] = "REJECTED";
    AcceptanceStatus["ACCEPTED"] = "ACCEPTED";
})(AcceptanceStatus || (AcceptanceStatus = {}));
export var PaymentMilestoneStatus;
(function (PaymentMilestoneStatus) {
    PaymentMilestoneStatus["PENDING"] = "PENDING";
    PaymentMilestoneStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    PaymentMilestoneStatus["PAID"] = "PAID";
    PaymentMilestoneStatus["WAIVED"] = "WAIVED";
})(PaymentMilestoneStatus || (PaymentMilestoneStatus = {}));
export var ModuleReleaseStatus;
(function (ModuleReleaseStatus) {
    ModuleReleaseStatus["PENDING"] = "PENDING";
    ModuleReleaseStatus["RELEASED"] = "RELEASED";
    ModuleReleaseStatus["BLOCKED"] = "BLOCKED";
})(ModuleReleaseStatus || (ModuleReleaseStatus = {}));
// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — Approvals
// ═══════════════════════════════════════════════════════════════════════════════
export var ApprovalCaseStatus;
(function (ApprovalCaseStatus) {
    ApprovalCaseStatus["OPEN"] = "OPEN";
    ApprovalCaseStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ApprovalCaseStatus["SUBMITTED"] = "SUBMITTED";
    ApprovalCaseStatus["RETURNED"] = "RETURNED";
    ApprovalCaseStatus["CLEARED"] = "CLEARED";
    ApprovalCaseStatus["REJECTED"] = "REJECTED";
})(ApprovalCaseStatus || (ApprovalCaseStatus = {}));
export var PermitStatus;
(function (PermitStatus) {
    PermitStatus["PENDING"] = "PENDING";
    PermitStatus["APPLIED"] = "APPLIED";
    PermitStatus["ISSUED"] = "ISSUED";
    PermitStatus["EXPIRED"] = "EXPIRED";
    PermitStatus["SUSPENDED"] = "SUSPENDED";
    PermitStatus["REJECTED"] = "REJECTED";
})(PermitStatus || (PermitStatus = {}));
export var PrintingStatus;
(function (PrintingStatus) {
    PrintingStatus["PENDING"] = "PENDING";
    PrintingStatus["PRINTED"] = "PRINTED";
    PrintingStatus["STAMPED"] = "STAMPED";
    PrintingStatus["ISSUED"] = "ISSUED";
})(PrintingStatus || (PrintingStatus = {}));
// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 5 — Contracts
// ═══════════════════════════════════════════════════════════════════════════════
export var ContractStatus;
(function (ContractStatus) {
    ContractStatus["DRAFT"] = "DRAFT";
    ContractStatus["SENT"] = "SENT";
    ContractStatus["UNDER_NEGOTIATION"] = "UNDER_NEGOTIATION";
    ContractStatus["EXECUTED"] = "EXECUTED";
    ContractStatus["TERMINATED"] = "TERMINATED";
    ContractStatus["EXPIRED"] = "EXPIRED";
})(ContractStatus || (ContractStatus = {}));
export var ServiceEngagementType;
(function (ServiceEngagementType) {
    ServiceEngagementType["DESIGN_ONLY"] = "DESIGN_ONLY";
    ServiceEngagementType["PRINTING_ONLY"] = "PRINTING_ONLY";
    ServiceEngagementType["APPROVALS_ONLY"] = "APPROVALS_ONLY";
    ServiceEngagementType["TECHNICAL_INSPECTION"] = "TECHNICAL_INSPECTION";
    ServiceEngagementType["LABOUR_ONLY"] = "LABOUR_ONLY";
    ServiceEngagementType["FULL_CONSTRUCTION"] = "FULL_CONSTRUCTION";
})(ServiceEngagementType || (ServiceEngagementType = {}));
// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 7 — Central Administration & Governance
// ═══════════════════════════════════════════════════════════════════════════════
export var DelegationStatus;
(function (DelegationStatus) {
    DelegationStatus["ACTIVE"] = "ACTIVE";
    DelegationStatus["SUSPENDED"] = "SUSPENDED";
    DelegationStatus["REVOKED"] = "REVOKED";
    DelegationStatus["EXPIRED"] = "EXPIRED";
})(DelegationStatus || (DelegationStatus = {}));
export var ActingAuthorityStatus;
(function (ActingAuthorityStatus) {
    ActingAuthorityStatus["PENDING"] = "PENDING";
    ActingAuthorityStatus["ACTIVE"] = "ACTIVE";
    ActingAuthorityStatus["EXPIRED"] = "EXPIRED";
    ActingAuthorityStatus["REVOKED"] = "REVOKED";
})(ActingAuthorityStatus || (ActingAuthorityStatus = {}));
export var ExceptionStatus;
(function (ExceptionStatus) {
    ExceptionStatus["PENDING"] = "PENDING";
    ExceptionStatus["APPROVED"] = "APPROVED";
    ExceptionStatus["REJECTED"] = "REJECTED";
    ExceptionStatus["CLOSED"] = "CLOSED";
})(ExceptionStatus || (ExceptionStatus = {}));
export var ProtectedAuditStatus;
(function (ProtectedAuditStatus) {
    ProtectedAuditStatus["OPEN"] = "OPEN";
    ProtectedAuditStatus["TRIAGED"] = "TRIAGED";
    ProtectedAuditStatus["INVESTIGATING"] = "INVESTIGATING";
    ProtectedAuditStatus["ACTIONS_PENDING"] = "ACTIONS_PENDING";
    ProtectedAuditStatus["CLOSED"] = "CLOSED";
    ProtectedAuditStatus["ESCALATED"] = "ESCALATED";
})(ProtectedAuditStatus || (ProtectedAuditStatus = {}));
export var LeaveStatus;
(function (LeaveStatus) {
    LeaveStatus["PENDING"] = "PENDING";
    LeaveStatus["APPROVED"] = "APPROVED";
    LeaveStatus["REJECTED"] = "REJECTED";
    LeaveStatus["CANCELLED"] = "CANCELLED";
})(LeaveStatus || (LeaveStatus = {}));
export var RequisitionStatus;
(function (RequisitionStatus) {
    RequisitionStatus["DRAFT"] = "DRAFT";
    RequisitionStatus["SUBMITTED"] = "SUBMITTED";
    RequisitionStatus["APPROVED"] = "APPROVED";
    RequisitionStatus["REJECTED"] = "REJECTED";
    RequisitionStatus["PO_CREATED"] = "PO_CREATED";
    RequisitionStatus["CLOSED"] = "CLOSED";
})(RequisitionStatus || (RequisitionStatus = {}));
export var POStatus;
(function (POStatus) {
    POStatus["DRAFT"] = "DRAFT";
    POStatus["APPROVED"] = "APPROVED";
    POStatus["SENT"] = "SENT";
    POStatus["RECEIVED"] = "RECEIVED";
    POStatus["CLOSED"] = "CLOSED";
    POStatus["CANCELLED"] = "CANCELLED";
})(POStatus || (POStatus = {}));
//# sourceMappingURL=enums.js.map