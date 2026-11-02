// src/services/construction.service.ts
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeAudit } from './audit.service.js';
import { MobilizationStatus, SiteLogStatus, GRNStatus, WorkHoldStatus, VariationStatus } from '@prisma/client';

function generateGrnNumber() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `GRN-${year}-${rand}`;
}

function generateVariationNo() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `VAR-${year}-${rand}`;
}

export async function createOrGetMobilization(projectId: string, actorId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');

  const existing = await prisma.mobilization.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } });
  if (existing) return existing;

  const m = await prisma.mobilization.create({
    data: {
      projectId,
      status: MobilizationStatus.PENDING,
      checklist: {},
    },
  });

  await writeAudit({
    actorId,
    action: 'MOBILIZATION_CREATED',
    entityType: 'Mobilization',
    entityId: m.id,
    projectId,
    after: { status: 'PENDING' },
  });

  return m;
}

export async function releaseMobilization(mobilizationId: string, actorId: string) {
  const m = await prisma.mobilization.findUnique({ where: { id: mobilizationId } });
  if (!m) throw httpError('Mobilization not found', 404, 'MOBILIZATION_NOT_FOUND');

  const updated = await prisma.mobilization.update({
    where: { id: mobilizationId },
    data: {
      status: MobilizationStatus.RELEASED,
      releasedById: actorId,
      releasedAt: new Date(),
    },
  });

  await writeAudit({
    actorId,
    action: 'MOBILIZATION_RELEASED',
    entityType: 'Mobilization',
    entityId: mobilizationId,
    projectId: m.projectId,
    after: { status: 'RELEASED' },
  });

  return updated;
}

export async function createSiteLog(projectId: string, actorId: string, data: any) {
  const log = await prisma.siteLog.create({
    data: {
      projectId,
      logDate: data.logDate ? new Date(data.logDate) : new Date(),
      weather: data.weather,
      workSummary: data.workSummary,
      workers: data.workers,
      issues: data.issues,
      status: SiteLogStatus.SUBMITTED,
      submittedById: actorId,
      submittedAt: new Date(),
    },
  });

  await writeAudit({
    actorId,
    action: 'SITE_LOG_SUBMITTED',
    entityType: 'SiteLog',
    entityId: log.id,
    projectId,
    after: { logDate: log.logDate },
  });

  return log;
}

export async function getSiteLogs(projectId: string) {
  return prisma.siteLog.findMany({
    where: { projectId },
    orderBy: { logDate: 'desc' },
  });
}

export async function createGRN(projectId: string, actorId: string, data: any) {
  const grn = await prisma.goodsReceivedNote.create({
    data: {
      projectId,
      grnNumber: generateGrnNumber(),
      supplier: data.supplier,
      poNumber: data.poNumber,
      items: data.items,
      receivedById: actorId,
      status: GRNStatus.PENDING,
      notes: data.notes,
    },
  });

  await writeAudit({
    actorId,
    action: 'GRN_CREATED',
    entityType: 'GoodsReceivedNote',
    entityId: grn.id,
    projectId,
    after: { grnNumber: grn.grnNumber },
  });

  return grn;
}

export async function acceptGRN(grnId: string, actorId: string) {
  const grn = await prisma.goodsReceivedNote.findUnique({ where: { id: grnId } });
  if (!grn) throw httpError('GRN not found', 404, 'GRN_NOT_FOUND');

  const updated = await prisma.goodsReceivedNote.update({
    where: { id: grnId },
    data: { status: GRNStatus.ACCEPTED },
  });

  await writeAudit({
    actorId,
    action: 'GRN_ACCEPTED',
    entityType: 'GoodsReceivedNote',
    entityId: grnId,
    projectId: grn.projectId,
    after: { status: 'ACCEPTED' },
  });

  return updated;
}

export async function createWorkHold(projectId: string, actorId: string, data: any) {
  const hold = await prisma.workHold.create({
    data: {
      projectId,
      reason: data.reason,
      status: WorkHoldStatus.OPEN,
      issuedById: actorId,
    },
  });

  await writeAudit({
    actorId,
    action: 'WORK_HOLD_ISSUED',
    entityType: 'WorkHold',
    entityId: hold.id,
    projectId,
    after: { reason: data.reason },
  });

  return hold;
}

export async function liftWorkHold(holdId: string, actorId: string, data: any) {
  const hold = await prisma.workHold.findUnique({ where: { id: holdId } });
  if (!hold) throw httpError('Work hold not found', 404, 'WORK_HOLD_NOT_FOUND');

  const updated = await prisma.workHold.update({
    where: { id: holdId },
    data: {
      status: WorkHoldStatus.LIFTED,
      liftedById: actorId,
      liftedAt: new Date(),
      clearanceNotes: data.clearanceNotes,
    },
  });

  await writeAudit({
    actorId,
    action: 'WORK_HOLD_LIFTED',
    entityType: 'WorkHold',
    entityId: holdId,
    projectId: hold.projectId,
    after: { status: 'LIFTED' },
  });

  return updated;
}

export async function createVariation(projectId: string, actorId: string, data: any) {
  const variation = await prisma.variation.create({
    data: {
      projectId,
      variationNo: generateVariationNo(),
      title: data.title,
      description: data.description,
      value: data.value,
      status: VariationStatus.SUBMITTED,
      requestedById: actorId,
      submittedAt: new Date(),
    },
  });

  await writeAudit({
    actorId,
    action: 'VARIATION_SUBMITTED',
    entityType: 'Variation',
    entityId: variation.id,
    projectId,
    after: { variationNo: variation.variationNo },
  });

  return variation;
}

export async function approveVariation(variationId: string, actorId: string) {
  const variation = await prisma.variation.findUnique({ where: { id: variationId } });
  if (!variation) throw httpError('Variation not found', 404, 'VARIATION_NOT_FOUND');

  const updated = await prisma.variation.update({
    where: { id: variationId },
    data: {
      status: VariationStatus.APPROVED,
      approvedById: actorId,
      approvedAt: new Date(),
    },
  });

  await writeAudit({
    actorId,
    action: 'VARIATION_APPROVED',
    entityType: 'Variation',
    entityId: variationId,
    projectId: variation.projectId,
    after: { status: 'APPROVED' },
  });

  return updated;
}

export async function createOrUpdateHandover(projectId: string, actorId: string, data: any) {
  const existing = await prisma.handover.findFirst({ where: { projectId } });
  if (existing) {
    const updated = await prisma.handover.update({
      where: { id: existing.id },
      data: {
        checklist: data.checklist,
        snags: data.snags,
      },
    });
    return updated;
  }
  const handover = await prisma.handover.create({
    data: {
      projectId,
      checklist: data.checklist,
      snags: data.snags,
      handedOverById: actorId,
    },
  });
  return handover;
}

export async function acceptHandover(projectId: string, actorId: string) {
  const handover = await prisma.handover.findFirst({ where: { projectId } });
  if (!handover) throw httpError('Handover not found', 404, 'HANDOVER_NOT_FOUND');

  const updated = await prisma.handover.update({
    where: { id: handover.id },
    data: {
      receivedById: actorId,
      acceptedAt: new Date(),
      completed: true,
    },
  });

  await writeAudit({
    actorId,
    action: 'HANDOVER_ACCEPTED',
    entityType: 'Handover',
    entityId: handover.id,
    projectId,
    after: { completed: true },
  });

  return updated;
}
