-- MODULE 6 — Safety & Equipment Compliance (UAT-20, UAT-21, UAT-22, MAST-UAT-20/21/22)
-- Creates: operator_permits, assets, daily_inspections, fuel_issues

-- CreateEnum for operator permit status
CREATE TYPE "OperatorPermitStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'PENDING');

-- CreateEnum for asset status
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'HOLD', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum for daily inspection status
CREATE TYPE "DailyInspectionStatus" AS ENUM ('PASSED', 'FAILED_CRITICAL', 'FAILED_MINOR', 'PENDING');

-- Create operator_permits table
CREATE TABLE "operator_permits" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "permitNumber" TEXT NOT NULL,
    "status" "OperatorPermitStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_permits_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "operator_permits_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT "operator_permits_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL,
    CONSTRAINT "operator_permits_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "operator_permits_permitNumber_key" ON "operator_permits"("permitNumber");
CREATE INDEX "operator_permits_operatorId_status_idx" ON "operator_permits"("operatorId", "status");
CREATE INDEX "operator_permits_projectId_idx" ON "operator_permits"("projectId");

-- Create assets table (without lastInspectionId initially to avoid circular FK)
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "projectId" TEXT,
    "assignedOperatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL,
    CONSTRAINT "assets_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "assets_assetNumber_key" ON "assets"("assetNumber");
CREATE INDEX "assets_type_status_idx" ON "assets"("type", "status");
CREATE INDEX "assets_projectId_idx" ON "assets"("projectId");
CREATE INDEX "assets_assignedOperatorId_idx" ON "assets"("assignedOperatorId");

-- Create daily_inspections table
CREATE TABLE "daily_inspections" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" "DailyInspectionStatus" NOT NULL DEFAULT 'PENDING',
    "criticalDefect" BOOLEAN NOT NULL DEFAULT false,
    "defectDescription" TEXT,
    "notes" TEXT,
    "inspectedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_inspections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "daily_inspections_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT,
    CONSTRAINT "daily_inspections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
    CONSTRAINT "daily_inspections_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT "daily_inspections_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "daily_inspections_assetId_inspectionDate_idx" ON "daily_inspections"("assetId", "inspectionDate");
CREATE INDEX "daily_inspections_operatorId_idx" ON "daily_inspections"("operatorId");

-- Add lastInspectionId to assets (circular FK resolved by adding after daily_inspections exists)
ALTER TABLE "assets" ADD COLUMN "lastInspectionId" TEXT;
ALTER TABLE "assets" ADD CONSTRAINT "assets_lastInspectionId_fkey" FOREIGN KEY ("lastInspectionId") REFERENCES "daily_inspections"("id") ON DELETE SET NULL;

-- Create fuel_issues table
CREATE TABLE "fuel_issues" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assetId" TEXT,
    "operatorId" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "liters" DECIMAL(10,2) NOT NULL,
    "meterReading" TEXT,
    "site" TEXT,
    "custody" TEXT,
    "issuedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECORDED',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_issues_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fuel_issues_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT,
    CONSTRAINT "fuel_issues_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL,
    CONSTRAINT "fuel_issues_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT "fuel_issues_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT "fuel_issues_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "fuel_issues_projectId_status_idx" ON "fuel_issues"("projectId", "status");
CREATE INDEX "fuel_issues_assetId_idx" ON "fuel_issues"("assetId");
CREATE INDEX "fuel_issues_operatorId_idx" ON "fuel_issues"("operatorId");
