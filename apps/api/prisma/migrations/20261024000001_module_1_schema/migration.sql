-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT_RELATIONS_OFFICER', 'VISITING_OFFICER', 'LEAD_ARCHITECT', 'JUNIOR_ARCHITECT', 'CLIENT', 'ADMIN_MANAGEMENT');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'IN_DISCUSSION', 'VISIT_AGREED', 'LINKED_TO_PROJECT', 'CLOSED');

-- CreateEnum
CREATE TYPE "SourceChannel" AS ENUM ('MANUAL', 'WALK_IN', 'PHONE', 'WHATSAPP', 'FACEBOOK', 'EMAIL');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BOOKED', 'RESCHEDULED', 'CANCELLED', 'VISIT_UNDERWAY', 'VISIT_COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('NOT_STARTED', 'DRAFT', 'SUBMITTED', 'CORRECTIONS_REQUESTED', 'RESUBMITTED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PHOTO', 'VIDEO', 'SKETCH', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ReportGeneratorStatus" AS ENUM ('PENDING', 'GENERATING', 'GENERATED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportApprovalState" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'RETURNED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'RETURNED');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('VISIT_BOOKED', 'VISIT_UNDERWAY', 'VISIT_COMPLETED', 'REPORT_GENERATING', 'REPORT_GENERATED', 'UNDER_REVIEW', 'CORRECTIONS_REQUESTED', 'APPROVED', 'PUBLISHED_TO_CLIENT', 'STAGE_1_COMPLETE');

-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('BOOKING_CONFIRMED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED', 'VISIT_REMINDER', 'SURVEY_SUBMITTED', 'CORRECTIONS_REQUESTED', 'REPORT_APPROVED', 'JUNIOR_ASSIGNED', 'REPORT_PUBLISHED', 'PUBLICATION_REVOKED', 'ADMIN_OVERRIDE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "project_sequences" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT 'MB',
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "organisation" TEXT,
    "primaryPhone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "email" TEXT,
    "consentMarketing" BOOLEAN NOT NULL DEFAULT false,
    "consentDataProc" BOOLEAN NOT NULL DEFAULT true,
    "sourceChannel" "SourceChannel" NOT NULL DEFAULT 'MANUAL',
    "externalId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "assignedStaffId" TEXT,
    "channel" "SourceChannel" NOT NULL DEFAULT 'MANUAL',
    "externalThreadId" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT,
    "followUpAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "isNote" BOOLEAN NOT NULL DEFAULT false,
    "externalMsgId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "channel" "SourceChannel" NOT NULL,
    "externalId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "projectType" TEXT,
    "siteCounty" TEXT NOT NULL,
    "siteSubCounty" TEXT,
    "siteArea" TEXT NOT NULL,
    "siteDirections" TEXT,
    "siteDescription" TEXT,
    "currentStage" "ProjectStage" NOT NULL DEFAULT 'VISIT_BOOKED',
    "createdFromConversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_bookings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "assignedOfficerId" TEXT,
    "visitFeeKes" DECIMAL(12,2),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "BookingStatus" NOT NULL DEFAULT 'BOOKED',
    "specialInstructions" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "bookedById" TEXT NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInAt" TIMESTAMP(3),
    "checkInGps" JSONB,
    "checkOutAt" TIMESTAMP(3),
    "checkOutGps" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_history" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "oldScheduledAt" TIMESTAMP(3),
    "newScheduledAt" TIMESTAMP(3),
    "oldStatus" "BookingStatus" NOT NULL,
    "newStatus" "BookingStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_surveys" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "capturedById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "SurveyStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "schemaVersion" TEXT NOT NULL DEFAULT '1.0',
    "previousVersionId" TEXT,
    "sectionA" JSONB,
    "sectionB" JSONB,
    "sectionC" JSONB,
    "sectionD" JSONB,
    "sectionE" JSONB,
    "sectionF" JSONB,
    "sectionG" JSONB,
    "checkInAt" TIMESTAMP(3),
    "checkInGps" JSONB,
    "checkOutAt" TIMESTAMP(3),
    "checkOutGps" JSONB,
    "lockedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_media" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "category" TEXT NOT NULL,
    "caption" TEXT,
    "storageKey" TEXT NOT NULL,
    "previewKey" TEXT,
    "checksum" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "capturedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sketch_versions" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "strokesJson" JSONB NOT NULL,
    "renderedKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT NOT NULL DEFAULT 'Preliminary field sketch - not a cadastral survey',
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedById" TEXT NOT NULL,

    CONSTRAINT "sketch_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_versions" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "docxKey" TEXT,
    "pdfKey" TEXT,
    "generatorStatus" "ReportGeneratorStatus" NOT NULL DEFAULT 'PENDING',
    "generatorError" TEXT,
    "approvalState" "ReportApprovalState" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "comments" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "junior_assignments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "juniorArchitectId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "junior_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_publications" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "publishedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "revokeReason" TEXT,
    "supersededById" TEXT,

    CONSTRAINT "portal_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "event" "NotificationEvent" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "projectId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PermittedMedia" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "project_sequences_year_prefix_key" ON "project_sequences"("year", "prefix");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "contacts_primaryPhone_idx" ON "contacts"("primaryPhone");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_externalId_sourceChannel_idx" ON "contacts"("externalId", "sourceChannel");

-- CreateIndex
CREATE INDEX "conversations_contactId_idx" ON "conversations"("contactId");

-- CreateIndex
CREATE INDEX "conversations_assignedStaffId_idx" ON "conversations"("assignedStaffId");

-- CreateIndex
CREATE INDEX "conversations_status_lastActivityAt_idx" ON "conversations"("status", "lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_externalThreadId_channel_key" ON "conversations"("externalThreadId", "channel");

-- CreateIndex
CREATE INDEX "messages_conversationId_sentAt_idx" ON "messages"("conversationId", "sentAt");

-- CreateIndex
CREATE INDEX "webhook_events_processed_receivedAt_idx" ON "webhook_events"("processed", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_channel_externalId_key" ON "webhook_events"("channel", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_reference_key" ON "projects"("reference");

-- CreateIndex
CREATE INDEX "projects_contactId_idx" ON "projects"("contactId");

-- CreateIndex
CREATE INDEX "projects_currentStage_idx" ON "projects"("currentStage");

-- CreateIndex
CREATE UNIQUE INDEX "visit_bookings_projectId_key" ON "visit_bookings"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "visit_bookings_idempotencyKey_key" ON "visit_bookings"("idempotencyKey");

-- CreateIndex
CREATE INDEX "visit_bookings_assignedOfficerId_status_idx" ON "visit_bookings"("assignedOfficerId", "status");

-- CreateIndex
CREATE INDEX "visit_bookings_status_scheduledAt_idx" ON "visit_bookings"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "booking_history_bookingId_createdAt_idx" ON "booking_history"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "site_surveys_bookingId_status_idx" ON "site_surveys"("bookingId", "status");

-- CreateIndex
CREATE INDEX "site_surveys_capturedById_idx" ON "site_surveys"("capturedById");

-- CreateIndex
CREATE UNIQUE INDEX "site_surveys_bookingId_version_key" ON "site_surveys"("bookingId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "survey_media_idempotencyKey_key" ON "survey_media"("idempotencyKey");

-- CreateIndex
CREATE INDEX "survey_media_surveyId_kind_idx" ON "survey_media"("surveyId", "kind");

-- CreateIndex
CREATE INDEX "survey_media_surveyId_category_idx" ON "survey_media"("surveyId", "category");

-- CreateIndex
CREATE INDEX "sketch_versions_surveyId_idx" ON "sketch_versions"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "sketch_versions_surveyId_version_key" ON "sketch_versions"("surveyId", "version");

-- CreateIndex
CREATE INDEX "report_versions_surveyId_approvalState_idx" ON "report_versions"("surveyId", "approvalState");

-- CreateIndex
CREATE UNIQUE INDEX "report_versions_surveyId_versionNumber_key" ON "report_versions"("surveyId", "versionNumber");

-- CreateIndex
CREATE INDEX "reviews_reportVersionId_createdAt_idx" ON "reviews"("reportVersionId", "createdAt");

-- CreateIndex
CREATE INDEX "junior_assignments_projectId_idx" ON "junior_assignments"("projectId");

-- CreateIndex
CREATE INDEX "junior_assignments_juniorArchitectId_idx" ON "junior_assignments"("juniorArchitectId");

-- CreateIndex
CREATE INDEX "portal_publications_reportVersionId_idx" ON "portal_publications"("reportVersionId");

-- CreateIndex
CREATE INDEX "portal_publications_revokedAt_idx" ON "portal_publications"("revokedAt");

-- CreateIndex
CREATE INDEX "notifications_recipientId_readAt_idx" ON "notifications"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_recipientId_createdAt_idx" ON "notifications"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_deliveryStatus_createdAt_idx" ON "notifications"("deliveryStatus", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_entityType_entityId_createdAt_idx" ON "audit_events"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_actorId_createdAt_idx" ON "audit_events"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_projectId_createdAt_idx" ON "audit_events"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_PermittedMedia_AB_unique" ON "_PermittedMedia"("A", "B");

-- CreateIndex
CREATE INDEX "_PermittedMedia_B_index" ON "_PermittedMedia"("B");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_linkedProjectId_fkey" FOREIGN KEY ("linkedProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_bookings" ADD CONSTRAINT "visit_bookings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_bookings" ADD CONSTRAINT "visit_bookings_assignedOfficerId_fkey" FOREIGN KEY ("assignedOfficerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_bookings" ADD CONSTRAINT "visit_bookings_bookedById_fkey" FOREIGN KEY ("bookedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_history" ADD CONSTRAINT "booking_history_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "visit_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_surveys" ADD CONSTRAINT "site_surveys_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "visit_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_surveys" ADD CONSTRAINT "site_surveys_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_media" ADD CONSTRAINT "survey_media_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "site_surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sketch_versions" ADD CONSTRAINT "sketch_versions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "site_surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "site_surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "junior_assignments" ADD CONSTRAINT "junior_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "junior_assignments" ADD CONSTRAINT "junior_assignments_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "junior_assignments" ADD CONSTRAINT "junior_assignments_juniorArchitectId_fkey" FOREIGN KEY ("juniorArchitectId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "junior_assignments" ADD CONSTRAINT "junior_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_publications" ADD CONSTRAINT "portal_publications_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "report_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_publications" ADD CONSTRAINT "portal_publications_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_publications" ADD CONSTRAINT "portal_publications_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_publications" ADD CONSTRAINT "portal_publications_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "portal_publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermittedMedia" ADD CONSTRAINT "_PermittedMedia_A_fkey" FOREIGN KEY ("A") REFERENCES "portal_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermittedMedia" ADD CONSTRAINT "_PermittedMedia_B_fkey" FOREIGN KEY ("B") REFERENCES "survey_media"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT EVENT IMMUTABILITY
-- Enforces append-only at the database level.
-- Any UPDATE or DELETE on audit_events raises an exception.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_events are append-only: UPDATE and DELETE are not permitted. Action: %, Table: audit_events', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_immutable_update
  BEFORE UPDATE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();

CREATE TRIGGER audit_events_immutable_delete
  BEFORE DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();

-- ─────────────────────────────────────────────────────────────────────────────
-- SURVEY IMMUTABILITY
-- Prevents editing a submitted survey (lockedAt IS NOT NULL).
-- Changes must create a new version (new row).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prevent_locked_survey_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."lockedAt" IS NOT NULL THEN
    RAISE EXCEPTION 'site_surveys are immutable after submission. Create a new version instead. Survey ID: %', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_surveys_immutable_after_lock
  BEFORE UPDATE ON site_surveys
  FOR EACH ROW EXECUTE FUNCTION prevent_locked_survey_mutation();
