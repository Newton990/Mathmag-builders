// src/services/rules.ts
// Pure Module 1 business rules. Kept separate from Prisma/Express so the
// invariants can be tested without a database.
import {
  BookingStatus,
  ReportApprovalState,
  SurveyStatus,
} from '@prisma/client';

/** MB-YYYY-NNN — three-digit zero-padded, never re-used. */
export function formatProjectReference(year: number, counter: number): string {
  if (!Number.isInteger(counter) || counter < 1) {
    throw new Error('Project sequence counter must be a positive integer');
  }
  return `MB-${year}-${String(counter).padStart(3, '0')}`;
}

/**
 * A project may only exist after client and Mathmag agree a visit date/time.
 * Returns an error message, or null when the date is acceptable.
 */
export function validateAgreedVisitDate(
  scheduledAt: Date,
  now: Date = new Date(),
): string | null {
  if (Number.isNaN(scheduledAt.getTime())) {
    return 'An agreed site-visit date and time is required';
  }
  // Small grace window so a booking made "now" is not rejected by clock skew.
  if (scheduledAt.getTime() < now.getTime() - 5 * 60 * 1000) {
    return 'The agreed site-visit date cannot be in the past';
  }
  return null;
}

export const TERMINAL_BOOKING_STATUSES: ReadonlySet<BookingStatus> = new Set([
  BookingStatus.CANCELLED,
  BookingStatus.VISIT_COMPLETED,
]);

export function isTerminalBookingStatus(status: BookingStatus): boolean {
  return TERMINAL_BOOKING_STATUSES.has(status);
}

/** Reschedules and cancellations always carry a reason for the audit trail. */
export function validateChangeReason(reason: string | undefined | null): string | null {
  if (!reason || reason.trim().length < 5) {
    return 'A reason of at least 5 characters is required for this change';
  }
  return null;
}

/** Surveys that are immutable originals and may be followed by a new version. */
export function isLockedSurveyStatus(status: SurveyStatus): boolean {
  return (
    status === SurveyStatus.SUBMITTED || status === SurveyStatus.RESUBMITTED
  );
}

export function nextVersionNumber(versions: readonly number[]): number {
  if (versions.length === 0) return 1;
  return Math.max(...versions) + 1;
}

/**
 * Publication is a separate, explicit action from approval.
 * An unreviewed or returned report may never reach the client portal.
 */
export function publicationAllowed(approvalState: ReportApprovalState): boolean {
  return approvalState === ReportApprovalState.APPROVED;
}

/**
 * A client may read a publication only when it has not been revoked and the
 * report version it points at is still approved.
 */
export function clientCanReadPublication(params: {
  revokedAt: Date | null;
  reportApprovalState: ReportApprovalState;
  publicationProjectId: string;
  clientProjectId: string;
}): boolean {
  return (
    params.revokedAt === null &&
    params.reportApprovalState === ReportApprovalState.APPROVED &&
    params.publicationProjectId === params.clientProjectId
  );
}

export interface Stage1Input {
  surveyStatus: SurveyStatus;
  reportApprovalState: ReportApprovalState | null;
  hasJuniorAssignment: boolean;
}

/** Stage 1 is complete only when all three conditions hold — never a manual flag. */
export function stage1Complete(input: Stage1Input): boolean {
  const surveySubmitted =
    input.surveyStatus === SurveyStatus.SUBMITTED ||
    input.surveyStatus === SurveyStatus.RESUBMITTED;
  return (
    surveySubmitted &&
    input.reportApprovalState === ReportApprovalState.APPROVED &&
    input.hasJuniorAssignment
  );
}
