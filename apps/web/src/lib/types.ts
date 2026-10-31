// src/lib/types.ts
// API response types used by the Module 1 screens. These mirror the JSON the
// API returns (Prisma BigInt values are serialized as strings).

export type UserRole =
  | 'CLIENT_RELATIONS_OFFICER'
  | 'VISITING_OFFICER'
  | 'LEAD_ARCHITECT'
  | 'JUNIOR_ARCHITECT'
  | 'CLIENT'
  | 'ADMIN_MANAGEMENT';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  mfaEnabled: boolean;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// ── Conversations ────────────────────────────────────────────────────────────

export type ConversationStatus =
  | 'OPEN'
  | 'IN_DISCUSSION'
  | 'VISIT_AGREED'
  | 'LINKED_TO_PROJECT'
  | 'CLOSED';

export type SourceChannel = 'MANUAL' | 'WALK_IN' | 'PHONE' | 'WHATSAPP' | 'FACEBOOK' | 'EMAIL';

export interface Contact {
  id: string;
  fullName: string;
  organisation: string | null;
  primaryPhone: string;
  alternatePhone: string | null;
  email: string | null;
  sourceChannel: string;
  consentMarketing: boolean;
  consentDataProc: boolean;
  notes: string | null;
}

export interface StaffRef {
  id: string;
  name: string;
  role?: UserRole;
  email?: string;
}

export interface ConversationSummary {
  id: string;
  status: ConversationStatus;
  channel: SourceChannel;
  subject: string | null;
  lastActivityAt: string;
  followUpAt: string | null;
  createdAt: string;
  contact: Contact;
  assignedStaff: StaffRef | null;
  linkedProject: { id: string; reference: string; currentStage: ProjectStage } | null;
  _count: { messages: number };
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  isNote: boolean;
  sentAt: string;
  author: StaffRef | null;
}

export interface ConversationDetail extends Omit<ConversationSummary, '_count'> {
  messages: Message[];
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'BOOKED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'VISIT_UNDERWAY'
  | 'VISIT_COMPLETED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'WAIVED';

export interface GpsRecord {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt?: string;
  note?: string;
}

export interface Booking {
  id: string;
  projectId: string;
  scheduledAt: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  visitFeeKes: string | null;
  specialInstructions: string | null;
  checkInAt: string | null;
  checkInGps: GpsRecord | null;
  checkOutAt: string | null;
  checkOutGps: GpsRecord | null;
  assignedOfficerId: string | null;
  assignedOfficer: StaffRef | null;
  project: ProjectSummary;
  history?: Array<{
    id: string;
    oldStatus: BookingStatus;
    newStatus: BookingStatus;
    oldScheduledAt: string | null;
    newScheduledAt: string | null;
    reason: string;
    createdAt: string;
  }>;
  surveys?: SurveySummary[];
}

// ── Projects ─────────────────────────────────────────────────────────────────

export type ProjectStage =
  | 'VISIT_BOOKED'
  | 'VISIT_UNDERWAY'
  | 'VISIT_COMPLETED'
  | 'REPORT_GENERATING'
  | 'REPORT_GENERATED'
  | 'UNDER_REVIEW'
  | 'CORRECTIONS_REQUESTED'
  | 'APPROVED'
  | 'PUBLISHED_TO_CLIENT'
  | 'STAGE_1_COMPLETE';

export interface ProjectAccess {
  isStaff: boolean;
  isCompanyWide: boolean;
  isAssignedOfficer: boolean;
  isJuniorArchitect: boolean;
  isClientOwner: boolean;
  canView: boolean;
}

export interface ProjectSummary {
  id: string;
  reference: string;
  projectType: string | null;
  siteCounty: string;
  siteSubCounty?: string | null;
  siteArea: string;
  siteDirections?: string | null;
  siteDescription?: string | null;
  currentStage: ProjectStage;
  createdAt: string;
  updatedAt: string;
  contact: Contact;
  visitBooking?: Booking | null;
}

export interface ProjectDetail extends ProjectSummary {
  access: ProjectAccess;
}

// ── Surveys ──────────────────────────────────────────────────────────────────

export type SurveyStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CORRECTIONS_REQUESTED'
  | 'RESUBMITTED';

export interface SurveyMedia {
  id: string;
  surveyId?: string;
  kind: 'PHOTO' | 'VIDEO' | 'SKETCH' | 'DOCUMENT';
  category: string;
  caption: string | null;
  mimeType: string;
  sizeBytes: string;
  checksum: string;
  capturedAt: string | null;
  uploadedAt: string;
}

export interface SurveySummary {
  id: string;
  version: number;
  status: SurveyStatus;
  schemaVersion?: string;
  lockedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  capturedBy?: StaffRef;
  reports?: ReportSummary[];
}

export interface SiteSurvey extends SurveySummary {
  bookingId: string;
  sectionA: JsonValue | null;
  sectionB: JsonValue | null;
  sectionC: JsonValue | null;
  sectionD: JsonValue | null;
  sectionE: JsonValue | null;
  sectionF: JsonValue | null;
  sectionG: JsonValue | null;
  booking: {
    id: string;
    projectId: string;
    scheduledAt: string;
    status: BookingStatus;
    checkInAt: string | null;
    checkOutAt: string | null;
    project: ProjectSummary;
    assignedOfficer: StaffRef | null;
  };
  media: SurveyMedia[];
  sketches?: JsonValue[];
  reports: ReportSummary[];
}

// ── Reports ──────────────────────────────────────────────────────────────────

export type ReportApprovalState = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'RETURNED';
export type ReportGeneratorStatus = 'PENDING' | 'GENERATING' | 'GENERATED' | 'FAILED';

export interface ReportSummary {
  id: string;
  surveyId: string;
  versionNumber: number;
  generatorStatus: ReportGeneratorStatus;
  generatorError: string | null;
  approvalState: ReportApprovalState;
  docxKey: string | null;
  pdfKey: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  survey?: {
    id: string;
    version: number;
    status: SurveyStatus;
    booking: {
      projectId: string;
      project: {
        id: string;
        reference: string;
        contact: { fullName: string };
      };
    };
  };
  _count?: { reviews: number; juniorAssignments: number };
}

export interface ReviewRecord {
  id: string;
  decision: 'APPROVED' | 'RETURNED';
  comments: string;
  createdAt: string;
  reviewer: StaffRef | null;
}

export interface Publication {
  id: string;
  reportVersionId: string;
  publishedById?: string;
  publishedAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
  supersededById?: string | null;
  reportVersion?: { id: string; versionNumber: number; approvalState: ReportApprovalState };
  publishedBy?: StaffRef;
  permittedMedia?: SurveyMedia[];
}

export interface ReportDetail extends ReportSummary {
  survey: {
    id: string;
    version: number;
    status: SurveyStatus;
    sectionA: JsonValue | null;
    sectionB: JsonValue | null;
    sectionC: JsonValue | null;
    sectionD: JsonValue | null;
    sectionE: JsonValue | null;
    sectionF: JsonValue | null;
    sectionG: JsonValue | null;
    media: SurveyMedia[];
    booking: {
      id: string;
      scheduledAt: string;
      projectId: string;
      project: ProjectDetail;
      assignedOfficer: StaffRef | null;
    };
  };
  reviews: ReviewRecord[];
  publications: Publication[];
}

export interface JuniorAssignment {
  id: string;
  projectId: string;
  reportVersionId: string;
  juniorArchitectId: string;
  dueDate: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  instructions: string | null;
  createdAt: string;
  juniorArchitect: StaffRef;
  assignedBy: StaffRef;
  reportVersion: { id: string; versionNumber: number; approvalState: ReportApprovalState };
}

// ── Client portal ────────────────────────────────────────────────────────────

export interface PortalPublicationSummary {
  id: string;
  publishedAt: string;
  reportVersion: {
    id: string;
    versionNumber: number;
    approvedAt: string | null;
    generatedAt?: string | null;
    hasPdf?: boolean;
  };
  _count?: { permittedMedia: number };
}

export interface PortalProject {
  id: string;
  reference: string;
  siteCounty: string;
  siteArea: string;
  projectType: string | null;
  currentStage: ProjectStage;
  createdAt: string;
  visitBooking: {
    scheduledAt: string;
    status: BookingStatus;
    assignedOfficer: { name: string } | null;
  } | null;
  contact: { fullName: string };
  publication: PortalPublicationSummary | null;
  hasPublishedReport: boolean;
}

export interface PortalMedia {
  id: string;
  kind: string;
  category: string;
  caption: string | null;
  mimeType: string;
  capturedAt: string | null;
}

export interface PortalPublication {
  id: string;
  publishedAt: string;
  reportVersion: {
    id: string;
    versionNumber: number;
    approvedAt: string | null;
    generatedAt: string | null;
    hasPdf: boolean;
  };
  permittedMedia: PortalMedia[];
}

export interface PortalProjectDetail {
  id: string;
  reference: string;
  siteCounty: string;
  siteSubCounty: string | null;
  siteArea: string;
  siteDirections: string | null;
  projectType: string | null;
  siteDescription: string | null;
  currentStage: ProjectStage;
  createdAt: string;
  contact: { fullName: string; primaryPhone: string; email: string | null };
  visitBooking: {
    id: string;
    scheduledAt: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    visitFeeKes: string | null;
    assignedOfficer: { name: string } | null;
  } | null;
  publication: PortalPublication | null;
}

// ── Response envelopes ───────────────────────────────────────────────────────

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface ItemsResponse<T> {
  items: T[];
}

export interface ConfirmBookingResponse {
  booking: Booking;
  project: ProjectSummary;
  created: boolean;
}

// ── Module 2 — Planning & Technical Design ───────────────────────────────────

export type DesignDiscipline =
  | 'ARCHITECTURAL_2D'
  | 'ARCHITECTURAL_3D'
  | 'STRUCTURAL'
  | 'MECHANICAL_PLUMBING'
  | 'ELECTRICAL'
  | 'QUANTITY_SURVEYING';

export type DesignTaskStatus =
  | 'DRAFT'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_REVIEW'
  | 'RETURNED_WITH_COMMENTS'
  | 'TECHNICALLY_APPROVED'
  | 'RELEASED'
  | 'SUPERSEDED';

export type DesignApprovalType = 'TWO_D' | 'THREE_D';
export type DesignApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CoordinationIssueStatus = 'OPEN' | 'ASSIGNED' | 'IN_RESOLUTION' | 'RESOLVED' | 'CLOSED';
export type EstimateStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SUPERSEDED';
export type DesignChangeType = 'MINOR' | 'MAJOR';

export interface DesignPackage {
  id: string;
  projectId: string;
  discipline: DesignDiscipline;
  status: DesignTaskStatus;
  releasedAt: string | null;
  releasedById: string | null;
  createdAt: string;
  _count?: { tasks: number };
}

export interface DesignTask {
  id: string;
  projectId: string;
  discipline: DesignDiscipline;
  title: string;
  description: string | null;
  status: DesignTaskStatus;
  instructions: string | null;
  plannedDeadline: string | null;
  assignedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: StaffRef | null;
  createdBy: StaffRef;
  designPackage: DesignPackage | null;
  reviews?: DesignTaskReview[];
  _count?: { reviews: number };
}

export interface DesignTaskReview {
  id: string;
  decision: 'APPROVED' | 'RETURNED';
  comments: string;
  corrections: unknown | null;
  createdAt: string;
  reviewer: StaffRef;
}

export interface DesignApproval {
  id: string;
  projectId: string;
  type: DesignApprovalType;
  status: DesignApprovalStatus;
  versionId: string | null;
  evidenceKey: string | null;
  evidenceNotes: string | null;
  clientIdentity: string | null;
  approvedAt: string | null;
  createdAt: string;
  approvedBy: StaffRef | null;
}

export interface WorkingFile {
  id: string;
  projectId: string;
  taskId: string | null;
  designPackageId: string | null;
  fileName: string;
  kind: string;
  mimeType: string;
  sizeBytes: string;
  checksum: string;
  isNative: boolean;
  isClientVisible: boolean;
  versionNumber: number;
  uploadedAt: string;
  uploadedBy: StaffRef;
}

export interface CoordinationIssue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: CoordinationIssueStatus;
  severity: string | null;
  dueDate: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  raisedBy: StaffRef;
  owner: StaffRef | null;
}

export interface CostEstimate {
  id: string;
  projectId: string;
  status: EstimateStatus;
  isSummary: boolean;
  currency: string;
  assumptions: string | null;
  exclusions: string | null;
  totalAmount: string | null;
  approvedAt: string | null;
  createdAt: string;
  createdBy: StaffRef;
  approvedBy: StaffRef | null;
  lines?: CostEstimateLine[];
}

export interface CostEstimateLine {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitRate: string;
  amount: string;
  discipline: DesignDiscipline | null;
  sortOrder: number;
}

export interface DesignChange {
  id: string;
  projectId: string;
  changeType: DesignChangeType;
  reason: string;
  feeImpact: string | null;
  timeImpactDays: number | null;
  decision: string | null;
  decidedAt: string | null;
  requiresClientReacceptance: boolean;
  createdAt: string;
  requestedBy: StaffRef;
  decidedBy: StaffRef | null;
}

export interface PlanningOverview {
  packages: DesignPackage[];
  taskCounts: Record<DesignDiscipline, { total: number; done: number }>;
  hasClientApproval2D: boolean;
  hasClientApproval3D: boolean;
  openIssues: number;
  latestEstimate: CostEstimate | null;
}

// ─── Module 3: Client Acceptance & Budget ────────────────────────────────────

export interface Proposal {
  id: string;
  status: string;
  totalFee: number | null;
  detailedBudgetVisible: boolean;
  publishedAt: string | null;
  createdAt: string;
  acceptances?: ClientAcceptance[];
}

export interface ClientAcceptance {
  id: string;
  proposalId: string;
  method: 'PORTAL' | 'SIGNED_FORM' | 'MEETING';
  acceptanceText: string | null;
  evidenceKey: string | null;
  evidenceNotes: string | null;
  clientIdentity: string | null;
  status: string;
  verificationNotes: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface PaymentMilestone {
  id: string;
  projectId: string;
  proposalId: string | null;
  amountDue: number;
  amountPaid: number | null;
  milestoneDescription: string | null;
  status: string;
  transactionRef: string | null;
  receiptKey: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface ModuleRelease {
  id: string;
  projectId: string;
  fromModule: string;
  toModule: string;
  status: string;
  gateChecklist: Record<string, unknown> | null;
  notes: string | null;
  releasedAt: string;
  releasedById: string;
}

// ─── Module 4: Statutory Approvals ───────────────────────────────────────────

export interface Permit {
  id: string;
  caseId: string;
  permitType: string;
  authority: string | null;
  referenceNo: string | null;
  status: string;
  appliedAt: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface PrintSubmission {
  id: string;
  caseId: string;
  documentName: string;
  versionId: string | null;
  status: string;
  createdAt: string;
}

export interface ApprovalCase {
  id: string;
  projectId: string;
  status: string;
  priority: string | null;
  assignedToId: string | null;
  createdAt: string;
  permits?: Permit[];
  prints?: PrintSubmission[];
  _count?: { permits: number; prints: number };
}

// ─── Module 5: Contracts ──────────────────────────────────────────────────────

export interface ServiceEngagement {
  id: string;
  projectId: string;
  type: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  projectId: string;
  engagementId: string | null;
  status: string;
  value: number | null;
  currency: string | null;
  parties: Record<string, unknown> | null;
  terms: Record<string, unknown> | null;
  sentAt: string | null;
  executedAt: string | null;
  terminatedAt: string | null;
  createdAt: string;
}

// ─── Module 6: Construction ───────────────────────────────────────────────────

export interface Mobilization {
  id: string;
  projectId: string;
  status: string;
  releasedAt: string | null;
  createdAt: string;
}

export interface SiteLog {
  id: string;
  projectId: string;
  logDate: string | null;
  weather: string | null;
  workSummary: string | null;
  workers: Record<string, unknown> | null;
  issues: string | null;
  loggedById: string | null;
  loggedBy: StaffRef | null;
  createdAt: string;
}

export interface GRN {
  id: string;
  projectId: string;
  supplier: string | null;
  poNumber: string | null;
  items: Record<string, unknown> | null;
  notes: string | null;
  status: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface WorkHold {
  id: string;
  projectId: string;
  reason: string;
  status: string;
  clearanceNotes: string | null;
  liftedAt: string | null;
  createdAt: string;
}

export interface Variation {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  value: number | null;
  status: string;
  approvedAt: string | null;
  createdAt: string;
}

export interface Handover {
  id: string;
  projectId: string;
  checklist: Record<string, unknown> | null;
  snags: unknown[];
  status: string;
  acceptedAt: string | null;
  createdAt: string;
}
