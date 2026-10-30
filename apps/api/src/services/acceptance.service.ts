// src/services/acceptance.service.ts
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeAudit } from './audit.service.js';
import {
  ProposalStatus,
  AcceptanceMethod,
  AcceptanceStatus,
  PaymentMilestoneStatus,
  ModuleReleaseStatus,
} from '@prisma/client';

export async function createProposalFromPlanning(projectId: string, actorId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');

  // Check if planning is ready - need cost estimate approved
  const estimate = await prisma.costEstimate.findFirst({
    where: { projectId, status: 'APPROVED' },
    orderBy: { versionNumber: 'desc' },
  });
  if (!estimate) throw httpError('Approved cost estimate required before creating proposal', 400, 'ESTIMATE_NOT_APPROVED');

  const lastProposal = await prisma.proposalSnapshot.findFirst({
    where: { projectId },
    orderBy: { versionNumber: 'desc' },
  });
  const versionNumber = (lastProposal?.versionNumber || 0) + 1;

  const proposal = await prisma.proposalSnapshot.create({
    data: {
      projectId,
      versionNumber,
      status: ProposalStatus.DRAFT,
      costEstimateId: estimate.id,
      inclusions: [],
      exclusions: [],
      manifest: {},
    },
  });

  await writeAudit({
    actorId,
    action: 'PROPOSAL_CREATED',
    entityType: 'ProposalSnapshot',
    entityId: proposal.id,
    projectId,
    after: { versionNumber },
  });

  return proposal;
}

export async function getProposals(projectId: string) {
  return prisma.proposalSnapshot.findMany({
    where: { projectId },
    include: {
      documents: true,
      acceptances: true,
      payments: true,
    },
    orderBy: { versionNumber: 'desc' },
  });
}

export async function getProposal(proposalId: string) {
  const proposal = await prisma.proposalSnapshot.findUnique({
    where: { id: proposalId },
    include: {
      documents: true,
      reviews: { orderBy: { createdAt: 'desc' } },
      acceptances: { orderBy: { createdAt: 'desc' } },
      payments: true,
      project: true,
    },
  });
  if (!proposal) throw httpError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');
  return proposal;
}

export async function publishProposal(proposalId: string, actorId: string, data: any) {
  const proposal = await prisma.proposalSnapshot.findUnique({ where: { id: proposalId } });
  if (!proposal) throw httpError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');

  const updated = await prisma.proposalSnapshot.update({
    where: { id: proposalId },
    data: {
      status: ProposalStatus.PUBLISHED,
      publishedById: actorId,
      publishedAt: new Date(),
      detailedBudgetVisible: data.detailedBudgetVisible || false,
    },
  });

  await writeAudit({
    actorId,
    action: 'PROPOSAL_PUBLISHED',
    entityType: 'ProposalSnapshot',
    entityId: proposalId,
    projectId: proposal.projectId,
    after: { status: 'PUBLISHED', detailedBudgetVisible: data.detailedBudgetVisible },
  });

  return updated;
}

export async function addReview(proposalId: string, actorId: string, data: any) {
  const proposal = await prisma.proposalSnapshot.findUnique({ where: { id: proposalId } });
  if (!proposal) throw httpError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');

  const review = await prisma.clientReview.create({
    data: {
      proposalId,
      reviewerId: actorId,
      reviewerName: data.reviewerName,
      comment: data.comment,
    },
  });

  await writeAudit({
    actorId,
    action: 'PROPOSAL_REVIEW_ADDED',
    entityType: 'ProposalSnapshot',
    entityId: proposalId,
    projectId: proposal.projectId,
    after: { comment: data.comment },
  });

  return review;
}

export async function clientAccept(proposalId: string, actorId: string, data: any) {
  const proposal = await prisma.proposalSnapshot.findUnique({ where: { id: proposalId } });
  if (!proposal) throw httpError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');
  if (proposal.status !== ProposalStatus.PUBLISHED) throw httpError('Proposal must be published before acceptance', 400, 'PROPOSAL_NOT_PUBLISHED');

  const acceptance = await prisma.clientAcceptance.create({
    data: {
      proposalId,
      method: data.method as AcceptanceMethod,
      status: AcceptanceStatus.PENDING,
      clientIdentity: data.clientIdentity,
      acceptanceText: data.acceptanceText,
      evidenceKey: data.evidenceKey,
      evidenceNotes: data.evidenceNotes,
      signedAt: new Date(),
    },
  });

  await prisma.proposalSnapshot.update({
    where: { id: proposalId },
    data: { status: ProposalStatus.UNDER_REVIEW },
  });

  await writeAudit({
    actorId,
    action: 'CLIENT_ACCEPTANCE_SUBMITTED',
    entityType: 'ClientAcceptance',
    entityId: acceptance.id,
    projectId: proposal.projectId,
    after: { method: data.method, status: 'PENDING' },
  });

  return acceptance;
}

export async function verifyAcceptance(acceptanceId: string, actorId: string, data: any) {
  const acceptance = await prisma.clientAcceptance.findUnique({
    where: { id: acceptanceId },
    include: { proposal: true },
  });
  if (!acceptance) throw httpError('Acceptance not found', 404, 'ACCEPTANCE_NOT_FOUND');

  const updated = await prisma.clientAcceptance.update({
    where: { id: acceptanceId },
    data: {
      status: data.status as AcceptanceStatus,
      verifiedById: actorId,
      verifiedAt: new Date(),
      verificationNotes: data.verificationNotes,
    },
  });

  if (data.status === 'VERIFIED') {
    await prisma.proposalSnapshot.update({
      where: { id: acceptance.proposalId },
      data: { status: ProposalStatus.ACCEPTED },
    });
  }

  await writeAudit({
    actorId,
    action: 'CLIENT_ACCEPTANCE_VERIFIED',
    entityType: 'ClientAcceptance',
    entityId: acceptanceId,
    projectId: acceptance.proposal.projectId,
    after: { status: data.status, verificationNotes: data.verificationNotes },
  });

  return updated;
}

export async function createPaymentMilestone(projectId: string, data: any) {
  const payment = await prisma.clientPayment.create({
    data: {
      projectId,
      proposalId: data.proposalId,
      amountDue: data.amountDue,
      milestoneDescription: data.milestoneDescription,
      status: PaymentMilestoneStatus.PENDING,
    },
  });

  await writeAudit({
    actorId: null,
    action: 'PAYMENT_MILESTONE_CREATED',
    entityType: 'ClientPayment',
    entityId: payment.id,
    projectId,
    after: { amountDue: data.amountDue },
  });

  return payment;
}

export async function verifyPayment(paymentId: string, actorId: string, data: any) {
  const payment = await prisma.clientPayment.findUnique({ where: { id: paymentId } });
  if (!payment) throw httpError('Payment not found', 404, 'PAYMENT_NOT_FOUND');

  const amountPaid = data.amountPaid !== undefined ? data.amountPaid : Number(payment.amountDue);
  const status = amountPaid >= Number(payment.amountDue) ? PaymentMilestoneStatus.PAID : PaymentMilestoneStatus.PARTIALLY_PAID;

  const updated = await prisma.clientPayment.update({
    where: { id: paymentId },
    data: {
      amountPaid,
      status,
      transactionRef: data.transactionRef,
      receiptKey: data.receiptKey,
      verifiedById: actorId,
      verifiedAt: new Date(),
      notes: data.notes,
      paidAt: new Date(),
    },
  });

  await writeAudit({
    actorId,
    action: 'PAYMENT_VERIFIED',
    entityType: 'ClientPayment',
    entityId: paymentId,
    projectId: payment.projectId,
    after: { transactionRef: data.transactionRef, status, amountPaid },
  });

  return updated;
}

export async function createPaymentException(projectId: string, actorId: string, data: any) {
  const exception = await prisma.paymentException.create({
    data: {
      projectId,
      reason: data.reason,
      conditions: data.conditions,
      scope: data.scope,
      withinLegalLimits: data.withinLegalLimits !== false,
      authorizedById: actorId,
    },
  });

  await writeAudit({
    actorId,
    action: 'PAYMENT_EXCEPTION_CREATED',
    entityType: 'PaymentException',
    entityId: exception.id,
    projectId,
    after: { reason: data.reason },
  });

  return exception;
}

export async function releaseToModule4(projectId: string, actorId: string, data: any) {
  // Check acceptance verified
  const acceptedProposal = await prisma.proposalSnapshot.findFirst({
    where: { projectId, status: ProposalStatus.ACCEPTED },
  });
  if (!acceptedProposal) throw httpError('Verified client acceptance required', 400, 'ACCEPTANCE_REQUIRED');

  // Check payment
  const payment = await prisma.clientPayment.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
  if (payment && payment.status !== PaymentMilestoneStatus.PAID && !data.paymentExceptionId) {
    throw httpError('Payment milestone not met or missing exception', 400, 'PAYMENT_GATE_BLOCKED');
  }

  const release = await prisma.moduleRelease.create({
    data: {
      projectId,
      fromModule: 3,
      toModule: 4,
      status: ModuleReleaseStatus.RELEASED,
      releasedById: actorId,
      releasedAt: new Date(),
      gateChecklist: data.gateChecklist,
      notes: data.notes,
      hasPaymentException: !!data.paymentExceptionId,
      paymentExceptionId: data.paymentExceptionId,
    },
  });

  await writeAudit({
    actorId,
    action: 'MODULE_4_RELEASED',
    entityType: 'ModuleRelease',
    entityId: release.id,
    projectId,
    after: { fromModule: 3, toModule: 4, hasPaymentException: !!data.paymentExceptionId },
  });

  return release;
}

export async function getReleases(projectId: string) {
  return prisma.moduleRelease.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}
