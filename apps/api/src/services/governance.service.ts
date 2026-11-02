// src/services/governance.service.ts
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeAudit } from './audit.service.js';
import { DelegationStatus, ActingAuthorityStatus, ExceptionStatus, ProtectedAuditStatus, LeaveStatus, RequisitionStatus, POStatus } from '@prisma/client';

function generateAuditNumber() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `AUD-${year}-${rand}`;
}

function generateReqNumber() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `REQ-${year}-${rand}`;
}

function generatePONumber() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `PO-${year}-${rand}`;
}

export async function createDelegation(delegatorId: string, data: any) {
  const d = await prisma.delegationMandate.create({
    data: {
      delegatorId,
      delegateId: data.delegateId,
      scope: data.scope,
      valueLimit: data.valueLimit,
      riskCategory: data.riskCategory,
      status: DelegationStatus.ACTIVE,
      ...(data.projectId ? { projectId: data.projectId } : {}),
      ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : {}),
    } as any,
  });
  await writeAudit({ actorId: delegatorId, action: 'DELEGATION_CREATED', entityType: 'DelegationMandate', entityId: d.id, projectId: (data.projectId as any) || undefined, after: { delegateId: data.delegateId } });
  return d;
}

export async function listDelegations() {
  return prisma.delegationMandate.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createActingAuthority(principalId: string, data: any) {
  const a = await prisma.actingAuthority.create({
    data: {
      principalId,
      actingId: data.actingId,
      reason: data.reason,
      status: ActingAuthorityStatus.PENDING,
      ...(data.projectId ? { projectId: data.projectId } : {}),
      ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : {}),
    } as any,
  });
  await writeAudit({ actorId: principalId, action: 'ACTING_AUTHORITY_CREATED', entityType: 'ActingAuthority', entityId: a.id, projectId: (data.projectId as any) || undefined, after: { actingId: data.actingId } });
  return a;
}

export async function activateActingAuthority(id: string, actorId: string) {
  const a = await prisma.actingAuthority.findUnique({ where: { id } });
  if (!a) throw httpError('Acting authority not found', 404, 'ACTING_AUTHORITY_NOT_FOUND');
  const updated = await prisma.actingAuthority.update({
    where: { id },
    data: { status: ActingAuthorityStatus.ACTIVE, activatedById: actorId, activatedAt: new Date() },
  });
  await writeAudit({ actorId, action: 'ACTING_AUTHORITY_ACTIVATED', entityType: 'ActingAuthority', entityId: id, projectId: (a.projectId as any) || undefined, after: { status: 'ACTIVE' } });
  return updated;
}

export async function createException(requestedById: string, data: any) {
  const e = await prisma.projectException.create({
    data: {
      requestedById,
      reason: data.reason,
      scope: data.scope,
      status: ExceptionStatus.PENDING,
      ...(data.projectId ? { projectId: data.projectId } : {}),
    } as any,
  });
  await writeAudit({ actorId: requestedById, action: 'EXCEPTION_REQUESTED', entityType: 'ProjectException', entityId: e.id, projectId: (data.projectId as any) || undefined, after: { reason: data.reason } });
  return e;
}

export async function approveException(id: string, actorId: string) {
  const e = await prisma.projectException.findUnique({ where: { id } });
  if (!e) throw httpError('Exception not found', 404, 'EXCEPTION_NOT_FOUND');
  const updated = await prisma.projectException.update({
    where: { id },
    data: { status: ExceptionStatus.APPROVED, approvedById: actorId, approvedAt: new Date() },
  });
  await writeAudit({ actorId, action: 'EXCEPTION_APPROVED', entityType: 'ProjectException', entityId: id, projectId: (e.projectId as any) || undefined, after: { status: 'APPROVED' } });
  return updated;
}

export async function createProtectedAudit(actorId: string, data: any) {
  const a = await prisma.protectedAuditCase.create({
    data: {
      caseNumber: generateAuditNumber(),
      title: data.title,
      description: data.description,
      status: ProtectedAuditStatus.OPEN,
      severity: data.severity,
      ...(data.projectId ? { projectId: data.projectId } : {}),
    } as any,
  });
  await writeAudit({ actorId, action: 'PROTECTED_AUDIT_CREATED', entityType: 'ProtectedAuditCase', entityId: a.id, projectId: (data.projectId as any) || undefined, after: { caseNumber: a.caseNumber } });
  return a;
}

export async function triageProtectedAudit(id: string, actorId: string) {
  const a = await prisma.protectedAuditCase.findUnique({ where: { id } });
  if (!a) throw httpError('Audit case not found', 404, 'AUDIT_CASE_NOT_FOUND');
  const updated = await prisma.protectedAuditCase.update({
    where: { id },
    data: { status: ProtectedAuditStatus.TRIAGED, triagedById: actorId, triagedAt: new Date() },
  });
  await writeAudit({ actorId, action: 'PROTECTED_AUDIT_TRIAGED', entityType: 'ProtectedAuditCase', entityId: id, projectId: (a.projectId as any) || undefined, after: { status: 'TRIAGED' } });
  return updated;
}

export async function createLeave(userId: string, data: any) {
  const l = await prisma.leaveRequest.create({
    data: {
      userId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
      status: LeaveStatus.PENDING,
      ...(data.projectId ? { projectId: data.projectId } : {}),
    } as any,
  });
  await writeAudit({ actorId: userId, action: 'LEAVE_REQUESTED', entityType: 'LeaveRequest', entityId: l.id, projectId: (data.projectId as any) || undefined, after: { startDate: data.startDate } });
  return l;
}

export async function approveLeave(id: string, actorId: string) {
  const l = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!l) throw httpError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: { status: LeaveStatus.APPROVED, approvedById: actorId, approvedAt: new Date() },
  });
  await writeAudit({ actorId, action: 'LEAVE_APPROVED', entityType: 'LeaveRequest', entityId: id, projectId: (l.projectId as any) || undefined, after: { status: 'APPROVED' } });
  return updated;
}

export async function createRequisition(requestedById: string, data: any) {
  const r = await prisma.purchaseRequisition.create({
    data: {
      requisitionNo: generateReqNumber(),
      requestedById,
      items: data.items,
      totalAmount: data.totalAmount,
      currency: 'KES',
      status: RequisitionStatus.SUBMITTED,
      notes: data.notes,
      ...(data.projectId ? { projectId: data.projectId } : {}),
    } as any,
  });
  await writeAudit({ actorId: requestedById, action: 'REQUISITION_CREATED', entityType: 'PurchaseRequisition', entityId: r.id, projectId: (data.projectId as any) || undefined, after: { requisitionNo: r.requisitionNo } });
  return r;
}

export async function approveRequisition(id: string, actorId: string) {
  const r = await prisma.purchaseRequisition.findUnique({ where: { id } });
  if (!r) throw httpError('Requisition not found', 404, 'REQUISITION_NOT_FOUND');
  const updated = await prisma.purchaseRequisition.update({
    where: { id },
    data: { status: RequisitionStatus.APPROVED, approvedById: actorId, approvedAt: new Date() },
  });
  await writeAudit({ actorId, action: 'REQUISITION_APPROVED', entityType: 'PurchaseRequisition', entityId: id, projectId: (r.projectId as any) || undefined, after: { status: 'APPROVED' } });
  return updated;
}

export async function createPO(actorId: string, data: any) {
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: generatePONumber(),
      supplierId: data.supplierId,
      items: data.items,
      totalAmount: data.totalAmount,
      currency: 'KES',
      status: POStatus.DRAFT,
      ...(data.projectId ? { projectId: data.projectId } : {}),
      ...(data.requisitionId ? { requisitionId: data.requisitionId } : {}),
    } as any,
  });
  await writeAudit({ actorId, action: 'PO_CREATED', entityType: 'PurchaseOrder', entityId: po.id, projectId: (data.projectId as any) || undefined, after: { poNumber: po.poNumber } });
  return po;
}
