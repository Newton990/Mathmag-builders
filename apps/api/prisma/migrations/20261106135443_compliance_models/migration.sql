-- Add allegedPartyId to ProtectedAuditCase for protected audit independence (UAT-25, MAST-UAT-28)
-- Add Supplier, BeneficiaryChange, Invoice models (UAT-14, UAT-15, UAT-17, MAST-UAT-16, MAST-UAT-17)
-- Add WorkerReport, WorkerReportVerification models (UAT-12, UAT-13, MAST-UAT-13, MAST-UAT-14)

-- Alter ProtectedAuditCase: add allegedPartyId column
ALTER TABLE "protected_audit_cases" ADD COLUMN "allegedPartyId" TEXT;

-- CreateIndex for allegedPartyId
CREATE INDEX "protected_audit_cases_allegedPartyId_idx" ON "protected_audit_cases"("allegedPartyId");

-- CreateEnum for beneficiary change status (using TEXT with CHECK constraint since Prisma String type)
-- Supplier table
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "bankAccount" TEXT,
    "mpesaNumber" TEXT,
    "trustedContact" TEXT,
    "trustedContactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

-- BeneficiaryChange table
CREATE TABLE "beneficiary_changes" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "projectId" TEXT,
    "oldBankAccount" TEXT,
    "oldMpesaNumber" TEXT,
    "newBankAccount" TEXT,
    "newMpesaNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationContact" TEXT,
    "paymentHold" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_changes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "beneficiary_changes_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT,
    CONSTRAINT "beneficiary_changes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL
);

CREATE INDEX "beneficiary_changes_supplierId_status_idx" ON "beneficiary_changes"("supplierId", "status");
CREATE INDEX "beneficiary_changes_projectId_idx" ON "beneficiary_changes"("projectId");

-- Invoice table
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "poId" TEXT,
    "grnId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "threeWayMatch" BOOLEAN NOT NULL DEFAULT false,
    "matchNotes" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
    CONSTRAINT "invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT,
    CONSTRAINT "invoices_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL,
    CONSTRAINT "invoices_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "goods_received_notes"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
CREATE INDEX "invoices_projectId_status_idx" ON "invoices"("projectId", "status");
CREATE INDEX "invoices_supplierId_idx" ON "invoices"("supplierId");

-- WorkerReport table
CREATE TABLE "worker_reports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaIds" JSON,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "previousVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "worker_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
    CONSTRAINT "worker_reports_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT "worker_reports_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "worker_reports"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "worker_reports_reportNumber_key" ON "worker_reports"("reportNumber");
CREATE INDEX "worker_reports_projectId_status_idx" ON "worker_reports"("projectId", "status");
CREATE INDEX "worker_reports_workerId_idx" ON "worker_reports"("workerId");

-- WorkerReportVerification table
CREATE TABLE "worker_report_verifications" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_report_verifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "worker_report_verifications_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "worker_reports"("id") ON DELETE RESTRICT,
    CONSTRAINT "worker_report_verifications_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE RESTRICT
);

CREATE INDEX "worker_report_verifications_reportId_status_idx" ON "worker_report_verifications"("reportId", "status");
CREATE INDEX "worker_report_verifications_supervisorId_idx" ON "worker_report_verifications"("supervisorId");
