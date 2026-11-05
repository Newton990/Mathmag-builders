-- CreateEnum
CREATE TYPE "DelegationScope" AS ENUM ('PROJECT', 'DEPARTMENT', 'COMPANY', 'CASE');

-- CreateEnum
CREATE TYPE "DesignDiscipline" AS ENUM ('ARCHITECTURAL_2D', 'ARCHITECTURAL_3D', 'STRUCTURAL', 'MECHANICAL_PLUMBING', 'ELECTRICAL', 'QUANTITY_SURVEYING');

-- CreateEnum
CREATE TYPE "DesignTaskStatus" AS ENUM ('DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'RETURNED_WITH_COMMENTS', 'TECHNICALLY_APPROVED', 'RELEASED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "WorkingFileKind" AS ENUM ('NATIVE_CAD', 'PDF', 'IMAGE', 'CALCULATION', 'SCHEDULE', 'OTHER');

-- CreateEnum
CREATE TYPE "DesignApprovalType" AS ENUM ('TWO_D', 'THREE_D');

-- CreateEnum
CREATE TYPE "DesignApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CoordinationIssueStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_RESOLUTION', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DesignChangeType" AS ENUM ('MINOR', 'MAJOR');

-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AcceptanceMethod" AS ENUM ('PORTAL', 'SIGNED_FORM', 'MEETING');

-- CreateEnum
CREATE TYPE "AcceptanceStatus" AS ENUM ('PENDING', 'VERIFIED', 'RETURNED_FOR_CLARIFICATION', 'REJECTED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "PaymentMilestoneStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "ModuleReleaseStatus" AS ENUM ('PENDING', 'RELEASED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ApprovalCaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'SUBMITTED', 'RETURNED', 'CLEARED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('PENDING', 'APPLIED', 'ISSUED', 'EXPIRED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PrintingStatus" AS ENUM ('PENDING', 'PRINTED', 'STAMPED', 'ISSUED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'UNDER_NEGOTIATION', 'EXECUTED', 'TERMINATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ServiceEngagementType" AS ENUM ('DESIGN_ONLY', 'PRINTING_ONLY', 'APPROVALS_ONLY', 'TECHNICAL_INSPECTION', 'LABOUR_ONLY', 'FULL_CONSTRUCTION');

-- CreateEnum
CREATE TYPE "MobilizationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'READY', 'BLOCKED', 'RELEASED');

-- CreateEnum
CREATE TYPE "SiteLogStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "GRNStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkHoldStatus" AS ENUM ('OPEN', 'CLEARED', 'LIFTED');

-- CreateEnum
CREATE TYPE "VariationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DelegationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ActingAuthorityStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProtectedAuditStatus" AS ENUM ('OPEN', 'TRIAGED', 'INVESTIGATING', 'ACTIONS_PENDING', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PO_CREATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'GENERAL_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'DEPARTMENT_HEAD';
ALTER TYPE "UserRole" ADD VALUE 'PROJECT_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'SITE_SUPERVISOR';
ALTER TYPE "UserRole" ADD VALUE 'STOREKEEPER';
ALTER TYPE "UserRole" ADD VALUE 'INDEPENDENT_AUDITOR';
ALTER TYPE "UserRole" ADD VALUE 'QUALIFIED_PROFESSIONAL';
ALTER TYPE "UserRole" ADD VALUE 'SUBCONTRACTOR';
ALTER TYPE "UserRole" ADD VALUE 'SUPPLIER';

-- AlterTable
ALTER TABLE "audit_events" ADD COLUMN     "actionTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "authorizingMandateId" TEXT,
ADD COLUMN     "correlationId" TEXT,
ADD COLUMN     "mandateId" TEXT,
ADD COLUMN     "nextState" JSONB,
ADD COLUMN     "previousState" JSONB,
ADD COLUMN     "reasonCode" TEXT,
ADD COLUMN     "representedRole" TEXT,
ADD COLUMN     "sourceRevisions" JSONB;

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "revokedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_mfa" ALTER COLUMN "backupCodeHashes" DROP DEFAULT,
ALTER COLUMN "enabledAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "disabledAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "actingAuthoritiesAsActing" JSONB,
ADD COLUMN     "actingAuthoritiesAsPrincipal" JSONB,
ADD COLUMN     "delegationMandatesAsGrantee" JSONB,
ADD COLUMN     "delegationMandatesAsGrantor" JSONB,
ADD COLUMN     "exceptionsDecided" JSONB,
ADD COLUMN     "exceptionsRaised" JSONB,
ADD COLUMN     "mandateActions" JSONB,
ADD COLUMN     "protectedAuditCases" JSONB,
ADD COLUMN     "roleGrants" JSONB;

-- CreateTable
CREATE TABLE "design_packages" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "discipline" "DesignDiscipline" NOT NULL,
    "isReleased" BOOLEAN NOT NULL DEFAULT false,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_tasks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "designPackageId" TEXT,
    "discipline" "DesignDiscipline" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "DesignTaskStatus" NOT NULL DEFAULT 'DRAFT',
    "plannedDeadline" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "parentTaskId" TEXT,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_task_reviews" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "comments" TEXT NOT NULL,
    "corrections" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_task_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_file_versions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "designPackageId" TEXT,
    "taskId" TEXT,
    "kind" "WorkingFileKind" NOT NULL DEFAULT 'PDF',
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "previewKey" TEXT,
    "checksum" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "isNative" BOOLEAN NOT NULL DEFAULT false,
    "isClientVisible" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "working_file_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_approvals" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "designPackageId" TEXT,
    "type" "DesignApprovalType" NOT NULL,
    "status" "DesignApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "versionId" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "evidenceKey" TEXT,
    "evidenceNotes" TEXT,
    "clientIdentity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordination_issues" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "designPackageId" TEXT,
    "taskId" TEXT,
    "raisedById" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" "CoordinationIssueStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordination_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordination_issue_items" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "discipline" "DesignDiscipline" NOT NULL,
    "referenceId" TEXT,
    "notes" TEXT,

    CONSTRAINT "coordination_issue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_estimates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "isSummary" BOOLEAN NOT NULL DEFAULT true,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "assumptions" TEXT,
    "exclusions" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_estimate_lines" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "itemCode" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "quantity" DECIMAL(12,3),
    "rate" DECIMAL(14,2),
    "amount" DECIMAL(14,2) NOT NULL,
    "sourceVersionId" TEXT,
    "notes" TEXT,

    CONSTRAINT "cost_estimate_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_changes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "changeType" "DesignChangeType" NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "decision" TEXT,
    "decisionAt" TIMESTAMP(3),
    "feeImpact" DECIMAL(12,2),
    "timeImpactDays" INTEGER,
    "requiresClientReacceptance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_snapshots" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "summaryContent" JSONB,
    "inclusions" JSONB,
    "exclusions" JSONB,
    "manifest" JSONB,
    "costEstimateId" TEXT,
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "detailedBudgetVisible" BOOLEAN NOT NULL DEFAULT false,
    "snapshotHash" TEXT,
    "supersededById" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_documents" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isClientVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_reviews" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewerName" TEXT,
    "comment" TEXT NOT NULL,
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_acceptances" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "method" "AcceptanceMethod" NOT NULL,
    "status" "AcceptanceStatus" NOT NULL DEFAULT 'PENDING',
    "clientIdentity" TEXT,
    "acceptanceText" TEXT,
    "evidenceKey" TEXT,
    "evidenceNotes" TEXT,
    "signedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "versionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_payments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "proposalId" TEXT,
    "amountDue" DECIMAL(14,2) NOT NULL,
    "amountPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "milestoneDescription" TEXT,
    "status" "PaymentMilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "transactionRef" TEXT,
    "receiptKey" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_exceptions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "conditions" TEXT,
    "authorizedById" TEXT NOT NULL,
    "authorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope" TEXT,
    "withinLegalLimits" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_releases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromModule" INTEGER NOT NULL,
    "toModule" INTEGER NOT NULL,
    "status" "ModuleReleaseStatus" NOT NULL DEFAULT 'PENDING',
    "releasedById" TEXT,
    "releasedAt" TIMESTAMP(3),
    "gateChecklist" JSONB,
    "notes" TEXT,
    "hasPaymentException" BOOLEAN NOT NULL DEFAULT false,
    "paymentExceptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_cases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "status" "ApprovalCaseStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_permits" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "permitType" TEXT NOT NULL,
    "authority" TEXT,
    "status" "PermitStatus" NOT NULL DEFAULT 'PENDING',
    "referenceNo" TEXT,
    "appliedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_permits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_prints" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "versionId" TEXT,
    "status" "PrintingStatus" NOT NULL DEFAULT 'PENDING',
    "printedById" TEXT,
    "stampedById" TEXT,
    "printedAt" TIMESTAMP(3),
    "stampedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_prints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_engagements" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "ServiceEngagementType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "engagementId" TEXT,
    "contractNumber" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "parties" JSONB,
    "terms" JSONB,
    "value" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "sentAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "executedById" TEXT,
    "terminatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobilizations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "MobilizationStatus" NOT NULL DEFAULT 'PENDING',
    "checklist" JSONB,
    "releasedById" TEXT,
    "releasedAt" TIMESTAMP(3),
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobilizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_logs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weather" TEXT,
    "workSummary" TEXT,
    "workers" JSONB,
    "issues" TEXT,
    "status" "SiteLogStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedById" TEXT,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_received_notes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "supplier" TEXT,
    "poNumber" TEXT,
    "items" JSONB,
    "receivedById" TEXT,
    "status" "GRNStatus" NOT NULL DEFAULT 'PENDING',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_received_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_holds" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "WorkHoldStatus" NOT NULL DEFAULT 'OPEN',
    "issuedById" TEXT,
    "liftedById" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liftedAt" TIMESTAMP(3),
    "clearanceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "variationNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(14,2),
    "status" "VariationStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedById" TEXT,
    "approvedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handovers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "checklist" JSONB,
    "snags" JSONB,
    "handedOverById" TEXT,
    "receivedById" TEXT,
    "handedOverAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegation_mandates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "delegatorId" TEXT NOT NULL,
    "delegateId" TEXT NOT NULL,
    "scope" JSONB,
    "valueLimit" DECIMAL(14,2),
    "riskCategory" TEXT,
    "status" "DelegationStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delegation_mandates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acting_authorities" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "principalId" TEXT NOT NULL,
    "actingId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ActingAuthorityStatus" NOT NULL DEFAULT 'PENDING',
    "activatedById" TEXT,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acting_authorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_exceptions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "scope" JSONB,
    "status" "ExceptionStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protected_audit_cases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "caseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProtectedAuditStatus" NOT NULL DEFAULT 'OPEN',
    "severity" TEXT,
    "triagedById" TEXT,
    "triagedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protected_audit_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requisitions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "requisitionNo" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "items" JSONB,
    "totalAmount" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "requisitionId" TEXT,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT,
    "items" JSONB,
    "totalAmount" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "orderedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "design_packages_projectId_idx" ON "design_packages"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "design_packages_projectId_discipline_key" ON "design_packages"("projectId", "discipline");

-- CreateIndex
CREATE INDEX "design_tasks_projectId_discipline_idx" ON "design_tasks"("projectId", "discipline");

-- CreateIndex
CREATE INDEX "design_tasks_assigneeId_status_idx" ON "design_tasks"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "design_tasks_status_idx" ON "design_tasks"("status");

-- CreateIndex
CREATE INDEX "design_task_reviews_taskId_createdAt_idx" ON "design_task_reviews"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "working_file_versions_projectId_designPackageId_idx" ON "working_file_versions"("projectId", "designPackageId");

-- CreateIndex
CREATE INDEX "working_file_versions_taskId_idx" ON "working_file_versions"("taskId");

-- CreateIndex
CREATE INDEX "design_approvals_projectId_type_idx" ON "design_approvals"("projectId", "type");

-- CreateIndex
CREATE INDEX "design_approvals_status_idx" ON "design_approvals"("status");

-- CreateIndex
CREATE INDEX "coordination_issues_projectId_status_idx" ON "coordination_issues"("projectId", "status");

-- CreateIndex
CREATE INDEX "coordination_issues_ownerId_status_idx" ON "coordination_issues"("ownerId", "status");

-- CreateIndex
CREATE INDEX "cost_estimates_projectId_status_idx" ON "cost_estimates"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cost_estimates_projectId_versionNumber_key" ON "cost_estimates"("projectId", "versionNumber");

-- CreateIndex
CREATE INDEX "design_changes_projectId_idx" ON "design_changes"("projectId");

-- CreateIndex
CREATE INDEX "proposal_snapshots_projectId_status_idx" ON "proposal_snapshots"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_snapshots_projectId_versionNumber_key" ON "proposal_snapshots"("projectId", "versionNumber");

-- CreateIndex
CREATE INDEX "proposal_documents_proposalId_idx" ON "proposal_documents"("proposalId");

-- CreateIndex
CREATE INDEX "client_reviews_proposalId_createdAt_idx" ON "client_reviews"("proposalId", "createdAt");

-- CreateIndex
CREATE INDEX "client_acceptances_proposalId_status_idx" ON "client_acceptances"("proposalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "client_payments_transactionRef_key" ON "client_payments"("transactionRef");

-- CreateIndex
CREATE INDEX "client_payments_projectId_status_idx" ON "client_payments"("projectId", "status");

-- CreateIndex
CREATE INDEX "payment_exceptions_projectId_idx" ON "payment_exceptions"("projectId");

-- CreateIndex
CREATE INDEX "module_releases_projectId_toModule_idx" ON "module_releases"("projectId", "toModule");

-- CreateIndex
CREATE UNIQUE INDEX "approval_cases_caseNumber_key" ON "approval_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "approval_cases_projectId_status_idx" ON "approval_cases"("projectId", "status");

-- CreateIndex
CREATE INDEX "service_engagements_projectId_idx" ON "service_engagements"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_projectId_status_idx" ON "contracts"("projectId", "status");

-- CreateIndex
CREATE INDEX "mobilizations_projectId_status_idx" ON "mobilizations"("projectId", "status");

-- CreateIndex
CREATE INDEX "site_logs_projectId_logDate_idx" ON "site_logs"("projectId", "logDate");

-- CreateIndex
CREATE UNIQUE INDEX "goods_received_notes_grnNumber_key" ON "goods_received_notes"("grnNumber");

-- CreateIndex
CREATE INDEX "goods_received_notes_projectId_status_idx" ON "goods_received_notes"("projectId", "status");

-- CreateIndex
CREATE INDEX "work_holds_projectId_status_idx" ON "work_holds"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "variations_variationNo_key" ON "variations"("variationNo");

-- CreateIndex
CREATE INDEX "variations_projectId_status_idx" ON "variations"("projectId", "status");

-- CreateIndex
CREATE INDEX "handovers_projectId_idx" ON "handovers"("projectId");

-- CreateIndex
CREATE INDEX "delegation_mandates_delegateId_status_idx" ON "delegation_mandates"("delegateId", "status");

-- CreateIndex
CREATE INDEX "delegation_mandates_projectId_idx" ON "delegation_mandates"("projectId");

-- CreateIndex
CREATE INDEX "acting_authorities_actingId_status_idx" ON "acting_authorities"("actingId", "status");

-- CreateIndex
CREATE INDEX "project_exceptions_projectId_status_idx" ON "project_exceptions"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "protected_audit_cases_caseNumber_key" ON "protected_audit_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "protected_audit_cases_projectId_status_idx" ON "protected_audit_cases"("projectId", "status");

-- CreateIndex
CREATE INDEX "leave_requests_userId_status_idx" ON "leave_requests"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requisitions_requisitionNo_key" ON "purchase_requisitions"("requisitionNo");

-- CreateIndex
CREATE INDEX "purchase_requisitions_projectId_status_idx" ON "purchase_requisitions"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_projectId_status_idx" ON "purchase_orders"("projectId", "status");

-- CreateIndex
CREATE INDEX "audit_events_correlationId_idx" ON "audit_events"("correlationId");

-- CreateIndex
CREATE INDEX "audit_events_mandateId_idx" ON "audit_events"("mandateId");

-- AddForeignKey
ALTER TABLE "design_packages" ADD CONSTRAINT "design_packages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_tasks" ADD CONSTRAINT "design_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_tasks" ADD CONSTRAINT "design_tasks_designPackageId_fkey" FOREIGN KEY ("designPackageId") REFERENCES "design_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_tasks" ADD CONSTRAINT "design_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_tasks" ADD CONSTRAINT "design_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_tasks" ADD CONSTRAINT "design_tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "design_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_task_reviews" ADD CONSTRAINT "design_task_reviews_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "design_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_task_reviews" ADD CONSTRAINT "design_task_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_file_versions" ADD CONSTRAINT "working_file_versions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_file_versions" ADD CONSTRAINT "working_file_versions_designPackageId_fkey" FOREIGN KEY ("designPackageId") REFERENCES "design_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_file_versions" ADD CONSTRAINT "working_file_versions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "design_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_file_versions" ADD CONSTRAINT "working_file_versions_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_approvals" ADD CONSTRAINT "design_approvals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_approvals" ADD CONSTRAINT "design_approvals_designPackageId_fkey" FOREIGN KEY ("designPackageId") REFERENCES "design_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_approvals" ADD CONSTRAINT "design_approvals_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_issues" ADD CONSTRAINT "coordination_issues_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_issues" ADD CONSTRAINT "coordination_issues_designPackageId_fkey" FOREIGN KEY ("designPackageId") REFERENCES "design_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_issues" ADD CONSTRAINT "coordination_issues_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "design_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_issues" ADD CONSTRAINT "coordination_issues_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_issues" ADD CONSTRAINT "coordination_issues_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_issue_items" ADD CONSTRAINT "coordination_issue_items_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "coordination_issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_estimates" ADD CONSTRAINT "cost_estimates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_estimates" ADD CONSTRAINT "cost_estimates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_estimates" ADD CONSTRAINT "cost_estimates_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_estimate_lines" ADD CONSTRAINT "cost_estimate_lines_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "cost_estimates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_changes" ADD CONSTRAINT "design_changes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_changes" ADD CONSTRAINT "design_changes_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_changes" ADD CONSTRAINT "design_changes_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_snapshots" ADD CONSTRAINT "proposal_snapshots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_documents" ADD CONSTRAINT "proposal_documents_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposal_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposal_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_acceptances" ADD CONSTRAINT "client_acceptances_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposal_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payments" ADD CONSTRAINT "client_payments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_payments" ADD CONSTRAINT "client_payments_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposal_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_releases" ADD CONSTRAINT "module_releases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_cases" ADD CONSTRAINT "approval_cases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_permits" ADD CONSTRAINT "approval_permits_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "approval_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_prints" ADD CONSTRAINT "approval_prints_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "approval_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_engagements" ADD CONSTRAINT "service_engagements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "service_engagements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobilizations" ADD CONSTRAINT "mobilizations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_logs" ADD CONSTRAINT "site_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_received_notes" ADD CONSTRAINT "goods_received_notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_holds" ADD CONSTRAINT "work_holds_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variations" ADD CONSTRAINT "variations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_mandates" ADD CONSTRAINT "delegation_mandates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acting_authorities" ADD CONSTRAINT "acting_authorities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_exceptions" ADD CONSTRAINT "project_exceptions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protected_audit_cases" ADD CONSTRAINT "protected_audit_cases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "purchase_requisitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
