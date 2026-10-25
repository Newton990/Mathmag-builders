// packages/shared/src/state-machines.test.ts
import { describe, it, expect } from 'vitest';
import {
  canTransitionBooking,
  canTransitionSurvey,
  canTransitionReport,
  computeStage1Status,
  isProjectStageAtLeast,
} from './state-machines.js';
import {
  BookingStatus,
  SurveyStatus,
  ReportApprovalState,
  ProjectStage,
} from './enums.js';

// ── Booking transitions ───────────────────────────────────────────────────────
describe('Booking state machine', () => {
  it('allows BOOKED → VISIT_UNDERWAY', () => {
    const r = canTransitionBooking(BookingStatus.BOOKED, BookingStatus.VISIT_UNDERWAY);
    expect(r.allowed).toBe(true);
  });

  it('allows BOOKED → RESCHEDULED', () => {
    expect(canTransitionBooking(BookingStatus.BOOKED, BookingStatus.RESCHEDULED).allowed).toBe(true);
  });

  it('allows BOOKED → CANCELLED', () => {
    expect(canTransitionBooking(BookingStatus.BOOKED, BookingStatus.CANCELLED).allowed).toBe(true);
  });

  it('allows VISIT_UNDERWAY → VISIT_COMPLETED', () => {
    expect(canTransitionBooking(BookingStatus.VISIT_UNDERWAY, BookingStatus.VISIT_COMPLETED).allowed).toBe(true);
  });

  it('denies VISIT_COMPLETED → any (terminal state)', () => {
    const states = Object.values(BookingStatus).filter(s => s !== BookingStatus.VISIT_COMPLETED);
    for (const s of states) {
      const r = canTransitionBooking(BookingStatus.VISIT_COMPLETED, s);
      expect(r.allowed).toBe(false);
      expect(r.reason).toBeDefined();
    }
  });

  it('denies CANCELLED → any (terminal state)', () => {
    for (const s of Object.values(BookingStatus)) {
      if (s === BookingStatus.CANCELLED) continue;
      expect(canTransitionBooking(BookingStatus.CANCELLED, s).allowed).toBe(false);
    }
  });

  it('denies BOOKED → VISIT_COMPLETED (must go through UNDERWAY)', () => {
    expect(canTransitionBooking(BookingStatus.BOOKED, BookingStatus.VISIT_COMPLETED).allowed).toBe(false);
  });

  it('denies VISIT_UNDERWAY → CANCELLED (no cancelling mid-visit)', () => {
    expect(canTransitionBooking(BookingStatus.VISIT_UNDERWAY, BookingStatus.CANCELLED).allowed).toBe(false);
  });
});

// ── Survey transitions ────────────────────────────────────────────────────────
describe('Survey state machine', () => {
  it('allows NOT_STARTED → DRAFT', () => {
    expect(canTransitionSurvey(SurveyStatus.NOT_STARTED, SurveyStatus.DRAFT).allowed).toBe(true);
  });

  it('allows DRAFT → SUBMITTED', () => {
    expect(canTransitionSurvey(SurveyStatus.DRAFT, SurveyStatus.SUBMITTED).allowed).toBe(true);
  });

  it('allows SUBMITTED → CORRECTIONS_REQUESTED', () => {
    expect(canTransitionSurvey(SurveyStatus.SUBMITTED, SurveyStatus.CORRECTIONS_REQUESTED).allowed).toBe(true);
  });

  it('allows CORRECTIONS_REQUESTED → RESUBMITTED', () => {
    expect(canTransitionSurvey(SurveyStatus.CORRECTIONS_REQUESTED, SurveyStatus.RESUBMITTED).allowed).toBe(true);
  });

  it('denies DRAFT → NOT_STARTED (no going back)', () => {
    expect(canTransitionSurvey(SurveyStatus.DRAFT, SurveyStatus.NOT_STARTED).allowed).toBe(false);
  });

  it('denies SUBMITTED → DRAFT (submitted is locked)', () => {
    expect(canTransitionSurvey(SurveyStatus.SUBMITTED, SurveyStatus.DRAFT).allowed).toBe(false);
  });

  it('includes a human-readable reason when denied', () => {
    const r = canTransitionSurvey(SurveyStatus.SUBMITTED, SurveyStatus.DRAFT);
    expect(r.reason).toContain('SUBMITTED');
    expect(r.reason).toContain('DRAFT');
  });
});

// ── Report approval transitions ───────────────────────────────────────────────
describe('Report approval state machine', () => {
  it('allows DRAFT → IN_REVIEW', () => {
    expect(canTransitionReport(ReportApprovalState.DRAFT, ReportApprovalState.IN_REVIEW).allowed).toBe(true);
  });

  it('allows IN_REVIEW → APPROVED', () => {
    expect(canTransitionReport(ReportApprovalState.IN_REVIEW, ReportApprovalState.APPROVED).allowed).toBe(true);
  });

  it('allows IN_REVIEW → RETURNED', () => {
    expect(canTransitionReport(ReportApprovalState.IN_REVIEW, ReportApprovalState.RETURNED).allowed).toBe(true);
  });

  it('denies ANY transition from APPROVED (immutable)', () => {
    for (const s of Object.values(ReportApprovalState)) {
      if (s === ReportApprovalState.APPROVED) continue;
      const r = canTransitionReport(ReportApprovalState.APPROVED, s);
      expect(r.allowed).toBe(false);
      expect(r.reason).toContain('immutable');
    }
  });

  it('denies DRAFT → APPROVED (must go through IN_REVIEW)', () => {
    expect(canTransitionReport(ReportApprovalState.DRAFT, ReportApprovalState.APPROVED).allowed).toBe(false);
  });
});

// ── Stage 1 completion rule ───────────────────────────────────────────────────
describe('Stage 1 completion', () => {
  it('is complete when all three conditions are true', () => {
    const result = computeStage1Status({
      surveyStatus: SurveyStatus.SUBMITTED,
      reportApprovalState: ReportApprovalState.APPROVED,
      hasJuniorAssignment: true,
    });
    expect(result.isComplete).toBe(true);
    expect(result.surveySubmitted).toBe(true);
    expect(result.reportApproved).toBe(true);
    expect(result.juniorAssigned).toBe(true);
  });

  it('is NOT complete without junior assignment', () => {
    const result = computeStage1Status({
      surveyStatus: SurveyStatus.SUBMITTED,
      reportApprovalState: ReportApprovalState.APPROVED,
      hasJuniorAssignment: false,
    });
    expect(result.isComplete).toBe(false);
  });

  it('is NOT complete without report approval', () => {
    const result = computeStage1Status({
      surveyStatus: SurveyStatus.SUBMITTED,
      reportApprovalState: ReportApprovalState.IN_REVIEW,
      hasJuniorAssignment: true,
    });
    expect(result.isComplete).toBe(false);
  });

  it('is NOT complete without survey submission', () => {
    const result = computeStage1Status({
      surveyStatus: SurveyStatus.DRAFT,
      reportApprovalState: ReportApprovalState.APPROVED,
      hasJuniorAssignment: true,
    });
    expect(result.isComplete).toBe(false);
  });

  it('is NOT complete when report approval state is null', () => {
    const result = computeStage1Status({
      surveyStatus: SurveyStatus.SUBMITTED,
      reportApprovalState: null,
      hasJuniorAssignment: true,
    });
    expect(result.isComplete).toBe(false);
  });

  it('accepts RESUBMITTED as a valid submitted state', () => {
    const result = computeStage1Status({
      surveyStatus: SurveyStatus.RESUBMITTED,
      reportApprovalState: ReportApprovalState.APPROVED,
      hasJuniorAssignment: true,
    });
    expect(result.surveySubmitted).toBe(true);
    expect(result.isComplete).toBe(true);
  });
});

// ── Project stage ordering ────────────────────────────────────────────────────
describe('Project stage ordering', () => {
  it('STAGE_1_COMPLETE is after VISIT_BOOKED', () => {
    expect(isProjectStageAtLeast(ProjectStage.STAGE_1_COMPLETE, ProjectStage.VISIT_BOOKED)).toBe(true);
  });

  it('VISIT_BOOKED is not at least APPROVED', () => {
    expect(isProjectStageAtLeast(ProjectStage.VISIT_BOOKED, ProjectStage.APPROVED)).toBe(false);
  });
});
