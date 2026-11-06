// src/services/worker-report.service.ts
// Worker reports with immutable originals (UAT-12, UAT-13, MAST-UAT-13, MAST-UAT-14).
// Worker-only own report; immediate independent manager visibility; supervisor
// verification appends review and preserves original media. Supervisor cannot delete
// or overwrite original evidence.
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeAudit } from './audit.service.js';

export async function createWorkerReport(projectId: string, workerId: string, data: any) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');

  // Generate report number
  const year = new Date().getFullYear();
  const count = await prisma.workerReport.count({
    where: { projectId, createdAt: { gte: new Date(year, 0, 1) } },
  });
  const reportNumber = `WR-${year}-${String(count + 1).padStart(4, '0')}`;

  const report = await prisma.workerReport.create({
    data: {
      projectId,
      workerId,
      reportNumber,
      title: data.title,
      description: data.description,
      mediaIds: data.mediaIds || [],
      status: 'DRAFT',
    },
  });
  await writeAudit({
    actorId: workerId,
    action: 'WORKER_REPORT_CREATED',
    entityType: 'WorkerReport',
    entityId: report.id,
    projectId,
    after: { reportNumber, status: 'DRAFT' },
  });
  return report;
}

export async function submitWorkerReport(reportId: string, workerId: string) {
  const report = await prisma.workerReport.findUnique({ where: { id: reportId } });
  if (!report) throw httpError('Worker report not found', 404, 'WORKER_REPORT_NOT_FOUND');
  if (report.workerId !== workerId) {
    throw httpError('Only the worker who created the report may submit it', 403, 'WORKER_REPORT_FORBIDDEN');
  }
  if (report.status !== 'DRAFT') {
    throw httpError('Only a draft report can be submitted', 409, 'WORKER_REPORT_NOT_DRAFT');
  }

  const updated = await prisma.workerReport.update({
    where: { id: reportId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      lockedAt: new Date(), // Immutable once submitted
    },
  });
  await writeAudit({
    actorId: workerId,
    action: 'WORKER_REPORT_SUBMITTED',
    entityType: 'WorkerReport',
    entityId: reportId,
    projectId: report.projectId,
    after: { status: 'SUBMITTED', lockedAt: updated.lockedAt },
  });
  return updated;
}

/**
 * Get a worker report. Submitted reports are visible to PM/GM immediately
 * without supervisor gating (UAT-12, MAST-UAT-13).
 */
export async function getWorkerReport(actorId: string, actorRole: string, reportId: string) {
  const report = await prisma.workerReport.findUnique({
    where: { id: reportId },
    include: { worker: true, verifications: { orderBy: { createdAt: 'desc' } } },
  });
  if (!report) throw httpError('Worker report not found', 404, 'WORKER_REPORT_NOT_FOUND');

  // Workers can only see their own reports; staff can see all project reports
  if (actorRole === 'WORKER' || actorRole === 'JUNIOR_ARCHITECT') {
    if (report.workerId !== actorId) {
      throw httpError('You can only view your own worker reports', 403, 'WORKER_REPORT_FORBIDDEN');
    }
  }

  return report;
}

/**
 * List worker reports for a project.
 */
export async function listWorkerReports(actorId: string, actorRole: string, projectId: string) {
  const where: any = { projectId };
  if (actorRole === 'WORKER' || actorRole === 'JUNIOR_ARCHITECT') {
    where.workerId = actorId;
  }
  return prisma.workerReport.findMany({
    where,
    include: { worker: { select: { id: true, name: true, email: true } }, verifications: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Supervisor verification of a worker report. Appends review and preserves original
 * media. The original submission is never overwritten or deleted (UAT-13, MAST-UAT-14).
 * Supervisor cannot self-verify their own report if they are also the worker.
 */
export async function verifyWorkerReport(reportId: string, supervisorId: string, data: any) {
  const report = await prisma.workerReport.findUnique({ where: { id: reportId } });
  if (!report) throw httpError('Worker report not found', 404, 'WORKER_REPORT_NOT_FOUND');
  if (report.status !== 'SUBMITTED') {
    throw httpError('Only a submitted report can be verified', 409, 'WORKER_REPORT_NOT_SUBMITTED');
  }
  if (report.workerId === supervisorId) {
    throw httpError('Supervisor cannot verify their own worker report', 403, 'SELF_VERIFICATION_FORBIDDEN');
  }

  const verification = await prisma.workerReportVerification.create({
    data: {
      reportId,
      supervisorId,
      status: data.status || 'PENDING',
      comments: data.comments,
      ...(data.status === 'APPROVED' || data.status === 'RETURNED' ? { verifiedAt: new Date() } : {}),
    },
  });

  const updated = await prisma.workerReport.update({
    where: { id: reportId },
    data: {
      status: data.status === 'APPROVED' ? 'VERIFIED' : data.status === 'RETURNED' ? 'RETURNED' : report.status,
    },
  });

  await writeAudit({
    actorId: supervisorId,
    action: 'WORKER_REPORT_VERIFIED',
    entityType: 'WorkerReport',
    entityId: reportId,
    projectId: report.projectId,
    after: { verificationId: verification.id, status: updated.status, comments: data.comments },
  });
  return { report: updated, verification };
}

/**
 * Attempt to delete or overwrite a worker report — always denied.
 * Original evidence is immutable (UAT-13, MAST-UAT-14).
 */
export async function deleteWorkerReport(_reportId: string, _actorId: string) {
  throw httpError(
    'Worker report originals are immutable and cannot be deleted',
    403,
    'WORKER_REPORT_IMMUTABLE',
  );
}

export async function updateWorkerReport(_reportId: string, _actorId: string, _data: any) {
  throw httpError(
    'Worker report originals are immutable. Submit a new version instead.',
    403,
    'WORKER_REPORT_IMMUTABLE',
  );
}
