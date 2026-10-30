// src/services/approvals.service.ts
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeAudit } from './audit.service.js';
import { ApprovalCaseStatus, PermitStatus, PrintingStatus } from '@prisma/client';

function generateCaseNumber() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `APP-${year}-${rand}`;
}

export async function createApprovalCase(projectId: string, actorId: string, data: any) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');

  const caseRecord = await prisma.approvalCase.create({
    data: {
      projectId,
      caseNumber: generateCaseNumber(),
      status: ApprovalCaseStatus.OPEN,
      priority: data.priority || 'NORMAL',
      assignedToId: data.assignedToId,
    },
  });

  await writeAudit({
    actorId,
    action: 'APPROVAL_CASE_CREATED',
    entityType: 'ApprovalCase',
    entityId: caseRecord.id,
    projectId,
    after: { caseNumber: caseRecord.caseNumber, status: 'OPEN' },
  });

  return caseRecord;
}

export async function getApprovalCases(projectId: string) {
  return prisma.approvalCase.findMany({
    where: { projectId },
    include: {
      permits: true,
      prints: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getApprovalCase(caseId: string) {
  const caseRecord = await prisma.approvalCase.findUnique({
    where: { id: caseId },
    include: {
      permits: true,
      prints: true,
      project: true,
    },
  });
  if (!caseRecord) throw httpError('Approval case not found', 404, 'APPROVAL_CASE_NOT_FOUND');
  return caseRecord;
}

export async function addPermit(caseId: string, actorId: string, data: any) {
  const caseRecord = await prisma.approvalCase.findUnique({ where: { id: caseId } });
  if (!caseRecord) throw httpError('Approval case not found', 404, 'APPROVAL_CASE_NOT_FOUND');

  const permit = await prisma.approvalPermit.create({
    data: {
      caseId,
      permitType: data.permitType,
      authority: data.authority,
      status: PermitStatus.PENDING,
    },
  });

  await writeAudit({
    actorId,
    action: 'APPROVAL_PERMIT_ADDED',
    entityType: 'ApprovalPermit',
    entityId: permit.id,
    projectId: caseRecord.projectId,
    after: { permitType: data.permitType },
  });

  return permit;
}

export async function updatePermit(permitId: string, actorId: string, data: any) {
  const permit = await prisma.approvalPermit.findUnique({
    where: { id: permitId },
    include: { case: true },
  });
  if (!permit) throw httpError('Permit not found', 404, 'PERMIT_NOT_FOUND');

  const updateData: any = {};
  if (data.status) updateData.status = data.status as PermitStatus;
  if (data.referenceNo !== undefined) updateData.referenceNo = data.referenceNo;
  if (data.appliedAt) updateData.appliedAt = new Date(data.appliedAt);
  if (data.issuedAt) updateData.issuedAt = new Date(data.issuedAt);
  if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);
  const updated = await prisma.approvalPermit.update({
    where: { id: permitId },
    data: updateData,
  });

  await writeAudit({
    actorId,
    action: 'APPROVAL_PERMIT_UPDATED',
    entityType: 'ApprovalPermit',
    entityId: permitId,
    projectId: permit.case.projectId,
    after: { status: data.status },
  });

  return updated;
}

export async function addPrint(caseId: string, actorId: string, data: any) {
  const caseRecord = await prisma.approvalCase.findUnique({ where: { id: caseId } });
  if (!caseRecord) throw httpError('Approval case not found', 404, 'APPROVAL_CASE_NOT_FOUND');

  const print = await prisma.approvalPrint.create({
    data: {
      caseId,
      documentName: data.documentName,
      versionId: data.versionId,
      status: PrintingStatus.PENDING,
    },
  });

  await writeAudit({
    actorId,
    action: 'APPROVAL_PRINT_ADDED',
    entityType: 'ApprovalPrint',
    entityId: print.id,
    projectId: caseRecord.projectId,
    after: { documentName: data.documentName },
  });

  return print;
}

export async function updatePrint(printId: string, actorId: string, data: any) {
  const print = await prisma.approvalPrint.findUnique({
    where: { id: printId },
    include: { case: true },
  });
  if (!print) throw httpError('Print not found', 404, 'PRINT_NOT_FOUND');

  const updateData: any = { status: data.status as PrintingStatus };
  if (data.status === 'PRINTED') {
    updateData.printedById = actorId;
    updateData.printedAt = new Date();
  } else if (data.status === 'STAMPED') {
    updateData.stampedById = actorId;
    updateData.stampedAt = new Date();
  } else if (data.status === 'ISSUED') {
    updateData.issuedAt = new Date();
  }

  const updated = await prisma.approvalPrint.update({
    where: { id: printId },
    data: updateData,
  });

  await writeAudit({
    actorId,
    action: 'APPROVAL_PRINT_UPDATED',
    entityType: 'ApprovalPrint',
    entityId: printId,
    projectId: print.case.projectId,
    after: { status: data.status },
  });

  return updated;
}

export async function updateCaseStatus(caseId: string, actorId: string, status: ApprovalCaseStatus) {
  const caseRecord = await prisma.approvalCase.findUnique({ where: { id: caseId } });
  if (!caseRecord) throw httpError('Approval case not found', 404, 'APPROVAL_CASE_NOT_FOUND');

  const updated = await prisma.approvalCase.update({
    where: { id: caseId },
    data: status === ApprovalCaseStatus.CLEARED ? { status, clearedAt: new Date() } : { status },
  });

  await writeAudit({
    actorId,
    action: 'APPROVAL_CASE_STATUS_UPDATED',
    entityType: 'ApprovalCase',
    entityId: caseId,
    projectId: caseRecord.projectId,
    after: { status },
  });

  return updated;
}
