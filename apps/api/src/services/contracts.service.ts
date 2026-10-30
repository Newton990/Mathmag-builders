// src/services/contracts.service.ts
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeAudit } from './audit.service.js';
import { ContractStatus } from '@prisma/client';

function generateContractNumber() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `CON-${year}-${rand}`;
}

export async function createServiceEngagement(projectId: string, actorId: string, data: any) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');

  const engagement = await prisma.serviceEngagement.create({
    data: {
      projectId,
      type: data.type,
      description: data.description,
      isActive: true,
    },
  });

  await writeAudit({
    actorId,
    action: 'SERVICE_ENGAGEMENT_CREATED',
    entityType: 'ServiceEngagement',
    entityId: engagement.id,
    projectId,
    after: { type: data.type },
  });

  return engagement;
}

export async function getServiceEngagements(projectId: string) {
  return prisma.serviceEngagement.findMany({
    where: { projectId },
    include: { contracts: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createContract(projectId: string, actorId: string, data: any) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');

  const contract = await prisma.contract.create({
    data: {
      projectId,
      engagementId: data.engagementId,
      contractNumber: generateContractNumber(),
      status: ContractStatus.DRAFT,
      parties: data.parties,
      terms: data.terms,
      value: data.value,
      currency: data.currency || 'KES',
    },
  });

  await writeAudit({
    actorId,
    action: 'CONTRACT_CREATED',
    entityType: 'Contract',
    entityId: contract.id,
    projectId,
    after: { contractNumber: contract.contractNumber, status: 'DRAFT' },
  });

  return contract;
}

export async function getContracts(projectId: string) {
  return prisma.contract.findMany({
    where: { projectId },
    include: { engagement: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getContract(contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { engagement: true, project: true },
  });
  if (!contract) throw httpError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
  return contract;
}

export async function sendContract(contractId: string, actorId: string) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw httpError('Contract not found', 404, 'CONTRACT_NOT_FOUND');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: ContractStatus.SENT,
      sentAt: new Date(),
    },
  });

  await writeAudit({
    actorId,
    action: 'CONTRACT_SENT',
    entityType: 'Contract',
    entityId: contractId,
    projectId: contract.projectId,
    after: { status: 'SENT' },
  });

  return updated;
}

export async function executeContract(contractId: string, actorId: string) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw httpError('Contract not found', 404, 'CONTRACT_NOT_FOUND');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: ContractStatus.EXECUTED,
      executedAt: new Date(),
      executedById: actorId,
    },
  });

  await writeAudit({
    actorId,
    action: 'CONTRACT_EXECUTED',
    entityType: 'Contract',
    entityId: contractId,
    projectId: contract.projectId,
    after: { status: 'EXECUTED' },
  });

  return updated;
}

export async function terminateContract(contractId: string, actorId: string) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw httpError('Contract not found', 404, 'CONTRACT_NOT_FOUND');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: ContractStatus.TERMINATED,
      terminatedAt: new Date(),
    },
  });

  await writeAudit({
    actorId,
    action: 'CONTRACT_TERMINATED',
    entityType: 'Contract',
    entityId: contractId,
    projectId: contract.projectId,
    after: { status: 'TERMINATED' },
  });

  return updated;
}
