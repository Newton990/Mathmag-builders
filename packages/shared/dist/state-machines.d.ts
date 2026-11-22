import { BookingStatus, SurveyStatus, ReportApprovalState, ProjectStage } from './enums.js';
export interface TransitionResult {
    allowed: boolean;
    reason?: string;
}
export declare function canTransitionBooking(from: BookingStatus, to: BookingStatus): TransitionResult;
export declare function canTransitionSurvey(from: SurveyStatus, to: SurveyStatus): TransitionResult;
export declare function canTransitionReport(from: ReportApprovalState, to: ReportApprovalState): TransitionResult;
export declare function getProjectStageIndex(stage: ProjectStage): number;
export declare function isProjectStageAtLeast(current: ProjectStage, minimum: ProjectStage): boolean;
export interface Stage1Status {
    surveySubmitted: boolean;
    reportApproved: boolean;
    juniorAssigned: boolean;
    isComplete: boolean;
}
export declare function computeStage1Status(params: {
    surveyStatus: SurveyStatus;
    reportApprovalState: ReportApprovalState | null;
    hasJuniorAssignment: boolean;
}): Stage1Status;
import { DesignTaskStatus, DesignApprovalStatus, CoordinationIssueStatus, EstimateStatus } from './enums.js';
export declare function canTransitionDesignTask(from: DesignTaskStatus, to: DesignTaskStatus): TransitionResult;
export declare function canTransitionDesignApproval(from: DesignApprovalStatus, to: DesignApprovalStatus): TransitionResult;
export declare function canTransitionCoordinationIssue(from: CoordinationIssueStatus, to: CoordinationIssueStatus): TransitionResult;
export declare function canTransitionEstimate(from: EstimateStatus, to: EstimateStatus): TransitionResult;
//# sourceMappingURL=state-machines.d.ts.map