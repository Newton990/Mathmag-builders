// src/services/rules.test.ts
// Module 1 invariants that must hold without a database.
import { describe, expect, it } from 'vitest';
import {
  BookingStatus,
  ReportApprovalState,
  SurveyStatus,
} from '@prisma/client';
import {
  clientCanReadPublication,
  formatProjectReference,
  isLockedSurveyStatus,
  isTerminalBookingStatus,
  nextVersionNumber,
  publicationAllowed,
  stage1Complete,
  validateAgreedVisitDate,
  validateChangeReason,
} from './rules.js';

const NOW = new Date('2026-10-26T09:00:00.000Z');

describe('project references', () => {
  it('pads the counter to three digits', () => {
    expect(formatProjectReference(2026, 1)).toBe('MB-2026-001');
    expect(formatProjectReference(2026, 42)).toBe('MB-2026-042');
    expect(formatProjectReference(2026, 1000)).toBe('MB-2026-1000');
  });

  it('rejects non-positive or non-integer counters', () => {
    expect(() => formatProjectReference(2026, 0)).toThrow();
    expect(() => formatProjectReference(2026, -1)).toThrow();
    expect(() => formatProjectReference(2026, 1.5)).toThrow();
  });
});

describe('agreed visit date', () => {
  it('accepts a future date and a five-minute grace window', () => {
    expect(validateAgreedVisitDate(new Date(NOW.getTime() + 60_000), NOW)).toBeNull();
    expect(validateAgreedVisitDate(new Date(NOW.getTime() - 60_000), NOW)).toBeNull();
  });

  it('rejects a date well in the past', () => {
    expect(validateAgreedVisitDate(new Date(NOW.getTime() - 10 * 60_000), NOW)).not.toBeNull();
  });

  it('rejects an invalid date', () => {
    expect(validateAgreedVisitDate(new Date('not-a-date'), NOW)).not.toBeNull();
  });
});

describe('booking change rules', () => {
  it('treats cancelled and completed bookings as terminal', () => {
    expect(isTerminalBookingStatus(BookingStatus.CANCELLED)).toBe(true);
    expect(isTerminalBookingStatus(BookingStatus.VISIT_COMPLETED)).toBe(true);
    expect(isTerminalBookingStatus(BookingStatus.BOOKED)).toBe(false);
    expect(isTerminalBookingStatus(BookingStatus.RESCHEDULED)).toBe(false);
  });

  it('requires a meaningful reason for reschedule/cancel', () => {
    expect(validateChangeReason('Client asked to move the visit')).toBeNull();
    expect(validateChangeReason('no')).not.toBeNull();
    expect(validateChangeReason('    ')).not.toBeNull();
    expect(validateChangeReason(undefined)).not.toBeNull();
  });
});

describe('survey versioning', () => {
  it('locks only submitted surveys', () => {
    expect(isLockedSurveyStatus(SurveyStatus.SUBMITTED)).toBe(true);
    expect(isLockedSurveyStatus(SurveyStatus.RESUBMITTED)).toBe(true);
    expect(isLockedSurveyStatus(SurveyStatus.DRAFT)).toBe(false);
  });

  it('creates the next version rather than editing a locked original', () => {
    expect(nextVersionNumber([])).toBe(1);
    expect(nextVersionNumber([1])).toBe(2);
    expect(nextVersionNumber([1, 3, 2])).toBe(4);
  });
});

describe('approval and publication are separate gates', () => {
  it('allows publication only for an approved report', () => {
    expect(publicationAllowed(ReportApprovalState.APPROVED)).toBe(true);
    expect(publicationAllowed(ReportApprovalState.DRAFT)).toBe(false);
    expect(publicationAllowed(ReportApprovalState.IN_REVIEW)).toBe(false);
    expect(publicationAllowed(ReportApprovalState.RETURNED)).toBe(false);
  });

  it('hides revoked, unapproved or foreign publications from clients', () => {
    const base = {
      revokedAt: null,
      reportApprovalState: ReportApprovalState.APPROVED,
      publicationProjectId: 'project-1',
      clientProjectId: 'project-1',
    };
    expect(clientCanReadPublication(base)).toBe(true);
    expect(clientCanReadPublication({ ...base, revokedAt: NOW })).toBe(false);
    expect(
      clientCanReadPublication({
        ...base,
        reportApprovalState: ReportApprovalState.IN_REVIEW,
      }),
    ).toBe(false);
    expect(
      clientCanReadPublication({ ...base, publicationProjectId: 'project-2' }),
    ).toBe(false);
  });
});

describe('Stage 1 completion', () => {
  it('requires survey submitted, report approved and a junior assignment', () => {
    expect(
      stage1Complete({
        surveyStatus: SurveyStatus.SUBMITTED,
        reportApprovalState: ReportApprovalState.APPROVED,
        hasJuniorAssignment: true,
      }),
    ).toBe(true);
    expect(
      stage1Complete({
        surveyStatus: SurveyStatus.RESUBMITTED,
        reportApprovalState: ReportApprovalState.APPROVED,
        hasJuniorAssignment: true,
      }),
    ).toBe(true);
  });

  it('is never true if any condition is missing', () => {
    expect(
      stage1Complete({
        surveyStatus: SurveyStatus.DRAFT,
        reportApprovalState: ReportApprovalState.APPROVED,
        hasJuniorAssignment: true,
      }),
    ).toBe(false);
    expect(
      stage1Complete({
        surveyStatus: SurveyStatus.SUBMITTED,
        reportApprovalState: ReportApprovalState.IN_REVIEW,
        hasJuniorAssignment: true,
      }),
    ).toBe(false);
    expect(
      stage1Complete({
        surveyStatus: SurveyStatus.SUBMITTED,
        reportApprovalState: ReportApprovalState.APPROVED,
        hasJuniorAssignment: false,
      }),
    ).toBe(false);
    expect(
      stage1Complete({
        surveyStatus: SurveyStatus.SUBMITTED,
        reportApprovalState: null,
        hasJuniorAssignment: true,
      }),
    ).toBe(false);
  });
});
