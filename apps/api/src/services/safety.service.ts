// src/services/safety.service.ts
// Safety & equipment compliance (UAT-20, UAT-21, UAT-22, MAST-UAT-20/21/22).
// - Block equipment assignment to unqualified/expired operators (UAT-20, MAST-UAT-20)
// - Critical pre-use inspection failure puts asset on HOLD (UAT-21, MAST-UAT-21)
// - Repairer cannot self-certify return-to-service (MAST-UAT-22)
// - Fuel issue requires machine/project/operator/custody evidence (UAT-22, MAST-UAT-23)
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeAudit } from './audit.service.js';
import { AssetStatus, DailyInspectionStatus, OperatorPermitStatus } from '@prisma/client';

/**
 * Check whether an operator has a valid, non-expired permit for a qualification.
 */
export async function validateOperatorPermit(operatorId: string, qualification: string): Promise<boolean> {
  const permit = await prisma.operatorPermit.findFirst({
    where: {
      operatorId,
      qualification,
      status: OperatorPermitStatus.ACTIVE,
    },
  });
  if (!permit) return false;
  if (permit.expiresAt && permit.expiresAt < new Date()) return false;
  return true;
}

/**
 * Assign an operator to an asset. Blocks if the operator lacks a valid permit
 * for that asset type (UAT-20, MAST-UAT-20).
 */
export async function assignOperatorToAsset(
  assetId: string,
  operatorId: string,
  actorId: string,
  qualification: string,
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw httpError('Asset not found', 404, 'ASSET_NOT_FOUND');

  const hasPermit = await validateOperatorPermit(operatorId, qualification);
  if (!hasPermit) {
    throw httpError(
      `Operator does not have a valid permit for ${qualification}`,
      403,
      'OPERATOR_PERMIT_INVALID',
    );
  }

  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: { assignedOperatorId: operatorId },
    include: { assignedOperator: true },
  });

  await writeAudit({
    actorId,
    action: 'ASSET_OPERATOR_ASSIGNED',
    entityType: 'Asset',
    entityId: assetId,
    projectId: asset.projectId ?? undefined,
    after: { assignedOperatorId: operatorId, qualification },
  });
  return updated;
}

/**
 * Record a daily pre-use inspection. If critical defect found, put asset on HOLD.
 * (UAT-21, MAST-UAT-21)
 */
export async function recordDailyInspection(
  assetId: string,
  projectId: string,
  operatorId: string,
  data: any,
  actorId: string,
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw httpError('Asset not found', 404, 'ASSET_NOT_FOUND');

  const result = data.result as DailyInspectionStatus;
  const inspection = await prisma.dailyInspection.create({
    data: {
      assetId,
      projectId,
      operatorId,
      result,
      criticalDefect: data.criticalDefect || false,
      defectDescription: data.defectDescription,
      notes: data.notes,
      inspectedById: actorId,
    },
  });

  // Critical defect → asset on HOLD (targeted, only this asset)
  if (result === DailyInspectionStatus.FAILED_CRITICAL || data.criticalDefect) {
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: AssetStatus.HOLD },
    });
  }

  await writeAudit({
    actorId,
    action: 'DAILY_INSPECTION_RECORDED',
    entityType: 'DailyInspection',
    entityId: inspection.id,
    projectId,
    after: { result, criticalDefect: inspection.criticalDefect, assetStatus: result === DailyInspectionStatus.FAILED_CRITICAL ? 'HOLD' : asset.status },
  });
  return inspection;
}

/**
 * Release an asset from HOLD after independent technical assessment.
 * The repairer/maintainer cannot self-certify (MAST-UAT-22).
 * Only a qualified independent technician/manager can clear the hold.
 */
export async function releaseAssetFromHold(
  assetId: string,
  actorId: string,
  data: any,
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw httpError('Asset not found', 404, 'ASSET_NOT_FOUND');
  if (asset.status !== AssetStatus.HOLD) {
    throw httpError('Asset is not on hold', 400, 'ASSET_NOT_ON_HOLD');
  }

  // The actor must not be the assigned operator (repairer/operator self-certification blocked)
  if (asset.assignedOperatorId && actorId === asset.assignedOperatorId) {
    throw httpError(
      'Assigned operator cannot self-certify return-to-service',
      403,
      'SELF_CERTIFICATION_FORBIDDEN',
    );
  }

  // Require independent technical clearance evidence
  if (!data.clearedByQualifiedTechnician || !data.technicalClearanceNotes) {
    throw httpError(
      'Independent qualified technical clearance required to release asset from hold',
      400,
      'TECHNICAL_CLEARANCE_REQUIRED',
    );
  }

  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: {
      status: AssetStatus.ACTIVE,
      assignedOperatorId: data.newOperatorId ?? null,
    },
  });

  await writeAudit({
    actorId,
    action: 'ASSET_HELD_RELEASED',
    entityType: 'Asset',
    entityId: assetId,
    projectId: asset.projectId ?? undefined,
    after: { status: 'ACTIVE', clearedBy: actorId, technicalClearanceNotes: data.technicalClearanceNotes },
  });
  return updated;
}

/**
 * Record a fuel issue. Requires machine/asset, project, operator, liters,
 * meter reading, and custody evidence (UAT-22, MAST-UAT-23).
 */
export async function recordFuelIssue(
  projectId: string,
  actorId: string,
  data: any,
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');

  // Required fields: fuel type, quantity, operator, custody
  if (!data.fuelType || !data.liters || !data.operatorId || !data.custody) {
    throw httpError(
      'Fuel issue requires fuel type, liters, operator, and custody evidence',
      400,
      'FUEL_ISSUE_INCOMPLETE',
    );
  }

  // Validate operator permit if asset is specified
  if (data.assetId) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw httpError('Asset not found', 404, 'ASSET_NOT_FOUND');
    if (asset.status === AssetStatus.HOLD) {
      throw httpError('Asset is on hold — fuel issue blocked', 409, 'ASSET_ON_HOLD');
    }
  }

  const fuelIssue = await prisma.fuelIssue.create({
    data: {
      projectId,
      assetId: data.assetId,
      operatorId: data.operatorId,
      fuelType: data.fuelType,
      liters: data.liters,
      meterReading: data.meterReading,
      site: data.site,
      custody: data.custody,
      issuedById: actorId,
      status: 'RECORDED',
    },
  });

  await writeAudit({
    actorId,
    action: 'FUEL_ISSUE_RECORDED',
    entityType: 'FuelIssue',
    entityId: fuelIssue.id,
    projectId,
    after: { fuelType: data.fuelType, liters: data.liters, operatorId: data.operatorId },
  });
  return fuelIssue;
}

/**
 * Verify a fuel issue (accounts reconciliation). Independent verifier.
 */
export async function verifyFuelIssue(
  fuelIssueId: string,
  verifiedById: string,
  data: any,
) {
  const fuelIssue = await prisma.fuelIssue.findUnique({ where: { id: fuelIssueId } });
  if (!fuelIssue) throw httpError('Fuel issue not found', 404, 'FUEL_ISSUE_NOT_FOUND');
  if (fuelIssue.status !== 'RECORDED') {
    throw httpError('Fuel issue is not in recorded status', 400, 'FUEL_ISSUE_NOT_RECORDED');
  }

  const updated = await prisma.fuelIssue.update({
    where: { id: fuelIssueId },
    data: {
      status: 'VERIFIED',
      verifiedById,
      verifiedAt: new Date(),
      notes: data.notes,
    },
  });

  await writeAudit({
    actorId: verifiedById,
    action: 'FUEL_ISSUE_VERIFIED',
    entityType: 'FuelIssue',
    entityId: fuelIssueId,
    projectId: fuelIssue.projectId ?? undefined,
    after: { status: 'VERIFIED', verifiedById },
  });
  return updated;
}

/**
 * Get assets on hold for a project (safety dashboard).
 */
export async function getAssetsOnHold(projectId: string) {
  return prisma.asset.findMany({
    where: { projectId, status: AssetStatus.HOLD },
    include: { assignedOperator: true, lastInspection: true },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Get operator permits for an operator.
 */
export async function getOperatorPermits(operatorId: string) {
  return prisma.operatorPermit.findMany({
    where: { operatorId },
    orderBy: { expiresAt: 'asc' },
  });
}

/**
 * Create an operator permit (management/HR).
 */
export async function createOperatorPermit(actorId: string, data: any) {
  const operator = await prisma.user.findUnique({ where: { id: data.operatorId } });
  if (!operator) throw httpError('Operator not found', 404, 'USER_NOT_FOUND');

  const permitData: any = {
    operatorId: data.operatorId,
    qualification: data.qualification,
    permitNumber: data.permitNumber,
    status: data.status || OperatorPermitStatus.PENDING,
    issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    verifiedById: actorId,
    verifiedAt: data.status === OperatorPermitStatus.ACTIVE ? new Date() : undefined,
  };
  if (data.projectId) {
    permitData.projectId = data.projectId;
  }

  const permit = await prisma.operatorPermit.create({
    data: permitData,
  });

  await writeAudit({
    actorId,
    action: 'OPERATOR_PERMIT_CREATED',
    entityType: 'OperatorPermit',
    entityId: permit.id,
    projectId: data.projectId,
    after: { qualification: data.qualification, status: data.status || 'PENDING' },
  });
  return permit;
}
