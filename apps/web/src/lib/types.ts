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
