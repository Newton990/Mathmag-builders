// packages/shared/src/state-machines.ts
// State transition guards for all entity state machines.
// BOTH the API and the web import from here — single source of truth.
// Every guard returns { allowed: boolean; reason?: string }.

import {
  BookingStatus,
  SurveyStatus,
  ReportApprovalState,
  ProjectStage,
} from './enums.js';

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

// ── Booking state machine ─────────────────────────────────────────────────────
// BOOKED → VISIT_UNDERWAY → VISIT_COMPLETED
//        → RESCHEDULED (loops back to BOOKED conceptually; new scheduledAt)
//        → CANCELLED (terminal)
const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.BOOKED]: [
    BookingStatus.VISIT_UNDERWAY,
    BookingStatus.RESCHEDULED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.RESCHEDULED]: [
    BookingStatus.VISIT_UNDERWAY,
    BookingStatus.RESCHEDULED,   // Can reschedule again
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.VISIT_UNDERWAY]: [
    BookingStatus.VISIT_COMPLETED,
  ],
  [BookingStatus.VISIT_COMPLETED]: [], // Terminal — no further transitions
  [BookingStatus.CANCELLED]: [],       // Terminal
};

export function canTransitionBooking(
  from: BookingStatus,
  to: BookingStatus,
): TransitionResult {
  const allowed = (BOOKING_TRANSITIONS[from] ?? []).includes(to);
  return allowed
    ? { allowed: true }
    : {
        allowed: false,
        reason: `Cannot move booking from ${from} to ${to}. Allowed next states: ${
          (BOOKING_TRANSITIONS[from] ?? []).join(', ') || 'none (terminal state)'
        }`,
      };
}

// ── Survey state machine ──────────────────────────────────────────────────────
// NOT_STARTED → DRAFT → SUBMITTED (locked)
//                     ← CORRECTIONS_REQUESTED (unlocks a NEW version)
//             → RESUBMITTED (new version after corrections)
const SURVEY_TRANSITIONS: Record<SurveyStatus, SurveyStatus[]> = {
  [SurveyStatus.NOT_STARTED]: [SurveyStatus.DRAFT],
  [SurveyStatus.DRAFT]: [SurveyStatus.SUBMITTED],
  [SurveyStatus.SUBMITTED]: [SurveyStatus.CORRECTIONS_REQUESTED], // Lead architect action
  [SurveyStatus.CORRECTIONS_REQUESTED]: [SurveyStatus.RESUBMITTED], // Officer creates new version
  [SurveyStatus.RESUBMITTED]: [SurveyStatus.CORRECTIONS_REQUESTED], // Can be returned again
};

export function canTransitionSurvey(
  from: SurveyStatus,
  to: SurveyStatus,
): TransitionResult {
  const allowed = (SURVEY_TRANSITIONS[from] ?? []).includes(to);
  return allowed
    ? { allowed: true }
    : {
        allowed: false,
        reason: `Cannot move survey from ${from} to ${to}. Allowed next states: ${
          (SURVEY_TRANSITIONS[from] ?? []).join(', ') || 'none'
        }`,
      };
}

// ── Report approval state machine ─────────────────────────────────────────────
// DRAFT → IN_REVIEW → APPROVED (immutable after this)
//                   → RETURNED → (new version starts as DRAFT again)
const REPORT_TRANSITIONS: Record<ReportApprovalState, ReportApprovalState[]> = {
  [ReportApprovalState.DRAFT]: [ReportApprovalState.IN_REVIEW],
  [ReportApprovalState.IN_REVIEW]: [
    ReportApprovalState.APPROVED,
    ReportApprovalState.RETURNED,
  ],
  [ReportApprovalState.APPROVED]: [], // Immutable — changes require new version
  [ReportApprovalState.RETURNED]: [ReportApprovalState.IN_REVIEW], // After resubmission
};

export function canTransitionReport(
  from: ReportApprovalState,
  to: ReportApprovalState,
): TransitionResult {
  if (from === ReportApprovalState.APPROVED) {
    return {
      allowed: false,
      reason:
        'An approved report version is immutable. To make changes, create a new report version.',
    };
  }
  const allowed = (REPORT_TRANSITIONS[from] ?? []).includes(to);
  return allowed
    ? { allowed: true }
    : {
        allowed: false,
        reason: `Cannot move report from ${from} to ${to}. Allowed next states: ${
          (REPORT_TRANSITIONS[from] ?? []).join(', ') || 'none'
        }`,
      };
}

// ── Project stage machine ─────────────────────────────────────────────────────
// Note: stages are COMPUTED from entity states — the project stage is derived,
// not directly set. This map is for display and rule-checking only.
const PROJECT_STAGE_ORDER: ProjectStage[] = [
  ProjectStage.VISIT_BOOKED,
  ProjectStage.VISIT_UNDERWAY,
  ProjectStage.VISIT_COMPLETED,
  ProjectStage.REPORT_GENERATING,
  ProjectStage.REPORT_GENERATED,
  ProjectStage.UNDER_REVIEW,
  ProjectStage.CORRECTIONS_REQUESTED,
  ProjectStage.APPROVED,
  ProjectStage.PUBLISHED_TO_CLIENT,
  ProjectStage.STAGE_1_COMPLETE,
];

export function getProjectStageIndex(stage: ProjectStage): number {
  return PROJECT_STAGE_ORDER.indexOf(stage);
}

export function isProjectStageAtLeast(
  current: ProjectStage,
  minimum: ProjectStage,
): boolean {
  return getProjectStageIndex(current) >= getProjectStageIndex(minimum);
}

// ── Stage 1 completion rule ───────────────────────────────────────────────────
// Stage 1 is COMPLETE only when ALL THREE conditions are true.
// This is COMPUTED — never stored as a manual flag.
export interface Stage1Status {
  surveySubmitted: boolean;
  reportApproved: boolean;
  juniorAssigned: boolean;
  isComplete: boolean;
}

export function computeStage1Status(params: {
  surveyStatus: SurveyStatus;
  reportApprovalState: ReportApprovalState | null;
  hasJuniorAssignment: boolean;
}): Stage1Status {
  const surveySubmitted =
    params.surveyStatus === SurveyStatus.SUBMITTED ||
    params.surveyStatus === SurveyStatus.RESUBMITTED;
  const reportApproved = params.reportApprovalState === ReportApprovalState.APPROVED;
  const juniorAssigned = params.hasJuniorAssignment;

  return {
    surveySubmitted,
    reportApproved,
    juniorAssigned,
    isComplete: surveySubmitted && reportApproved && juniorAssigned,
  };
}
