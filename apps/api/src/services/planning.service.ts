// src/services/planning.service.ts
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { writeAudit } from './audit.service.js';
import {
  DesignDiscipline,
  DesignTaskStatus,
  DesignApprovalStatus,
  DesignApprovalType,
  CoordinationIssueStatus,
  EstimateStatus,
} from '@prisma/client';
import {
  canTransitionDesignTask,
  canTransitionDesignApproval,
  canTransitionCoordinationIssue,
  canTransitionEstimate,
} from '@mbms/shared';

const DISCIPLINES_ORDER = [
  DesignDiscipline.ARCHITECTURAL_2D,
  DesignDiscipline.ARCHITECTURAL_3D,
  DesignDiscipline.STRUCTURAL,
  DesignDiscipline.MECHANICAL_PLUMBING,
  DesignDiscipline.ELECTRICAL,
  DesignDiscipline.QUANTITY_SURVEYING,
];

export async function getPlanningOverview(projectId: string) {
  const [project, packages, tasks, approvals, issues, estimates] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, include: { contact: true } }),
    prisma.designPackage.findMany({
      where: { projectId },
      include: { designTasks: true },
    }),
    prisma.designTask.findMany({ where: { projectId } }),
    prisma.designApproval.findMany({ where: { projectId } }),
    prisma.coordinationIssue.findMany({ where: { projectId }, include: { affectedItems: true } }),
    prisma.costEstimate.findMany({ where: { projectId }, orderBy: { versionNumber: 'desc' } }),
  ]);

  if (!project) throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');

  const has2DApproval = approvals.some(
    (a: any) => a.type === DesignApprovalType.TWO_D && a.status === DesignApprovalStatus.APPROVED,
  );
  const has3DApproval = approvals.some(
    (a: any) => a.type === DesignApprovalType.THREE_D && a.status === DesignApprovalStatus.APPROVED,
  );

  return {
    project,
    packages,
    tasks,
    approvals,
    issues,
    estimates,
    gates: {
      has2DApproval,
      has3DApproval,
      canStart3D: has2DApproval,
      qsReady: packages.filter((p: any) => p.discipline !== DesignDiscipline.QUANTITY_SURVEYING && p.isReleased).length >= 4,
    },
  };
}

export async function getDesignPackages(projectId: string) {
  return prisma.designPackage.findMany({
    where: { projectId },
    include: {
      designTasks: { orderBy: { createdAt: 'asc' } },
      workingFileVersions: { orderBy: { uploadedAt: 'desc' } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function initializeDesignPackages(projectId: string, actorId: string) {
  const existing = await prisma.designPackage.count({ where: { projectId } });
  if (existing > 0) {
    throw httpError('Design packages already initialized', 400, 'PACKAGES_ALREADY_EXIST');
  }

  const packages = await prisma.$transaction(
    DISCIPLINES_ORDER.map((discipline) =>
      prisma.designPackage.create({
        data: {
          projectId,
          discipline,
        },
      }),
    ),
  );

  await writeAudit({
    actorId: actorId || null,
    action: 'DESIGN_PACKAGES_INITIALIZED',
    entityType: 'Project',
    entityId: projectId,
    projectId,
    after: { disciplines: DISCIPLINES_ORDER },
  });

  return packages;
}

export async function createDesignTask(projectId: string, actorId: string, data: any) {
  // Check 3D gate
  if (data.discipline === DesignDiscipline.ARCHITECTURAL_3D) {
    const approval = await prisma.designApproval.findFirst({
      where: {
        projectId,
        type: DesignApprovalType.TWO_D,
        status: DesignApprovalStatus.APPROVED,
      },
    });
    if (!approval) {
      throw httpError('Cannot create 3D task until client approves exact 2D version', 400, 'TWO_D_NOT_APPROVED');
    }
  }

  // Check QS gate - needs 4 discipline packages released
  if (data.discipline === DesignDiscipline.QUANTITY_SURVEYING) {
    const releasedCount = await prisma.designPackage.count({
      where: {
        projectId,
        isReleased: true,
        discipline: { in: [DesignDiscipline.STRUCTURAL, DesignDiscipline.MECHANICAL_PLUMBING, DesignDiscipline.ELECTRICAL, DesignDiscipline.ARCHITECTURAL_3D] },
      },
    });
    if (releasedCount < 4) {
      throw httpError('QS cannot start until Architecture, Structural, MEP, Electrical are released', 400, 'PREDECESSOR_PACKAGES_NOT_RELEASED');
    }
  }

  const task = await prisma.designTask.create({
    data: {
      projectId,
      designPackageId: data.designPackageId,
      discipline: data.discipline,
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId,
      createdById: actorId,
      status: data.assigneeId ? DesignTaskStatus.ASSIGNED : DesignTaskStatus.DRAFT,
      plannedDeadline: data.plannedDeadline ? new Date(data.plannedDeadline) : null,
      instructions: data.instructions,
    },
    include: { assignee: true, createdBy: true },
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'DESIGN_TASK_CREATED',
    entityType: 'DesignTask',
    entityId: task.id,
    projectId,
    after: task,
  });

  return task;
}

export async function getDesignTasks(projectId: string, query: any = {}) {
  const where: any = { projectId };
  if (query.discipline) where.discipline = query.discipline;
  if (query.status) where.status = query.status;
  if (query.assigneeId) where.assigneeId = query.assigneeId;

  return prisma.designTask.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      reviews: { orderBy: { createdAt: 'desc' } },
      submissions: { orderBy: { uploadedAt: 'desc' } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getDesignTask(taskId: string) {
  const task = await prisma.designTask.findUnique({
    where: { id: taskId },
    include: {
      assignee: true,
      createdBy: true,
      reviews: { include: { reviewer: true }, orderBy: { createdAt: 'desc' } },
      submissions: { include: { uploadedBy: true }, orderBy: { versionNumber: 'desc' } },
      project: true,
      designPackage: true,
    },
  });
  if (!task) throw httpError('Design task not found', 404, 'TASK_NOT_FOUND');
  return task;
}

export async function updateDesignTaskStatus(taskId: string, actorId: string, status: DesignTaskStatus, comments?: string) {
  const task = await prisma.designTask.findUnique({ where: { id: taskId } });
  if (!task) throw httpError('Design task not found', 404, 'TASK_NOT_FOUND');

  const transition = (canTransitionDesignTask as any)(task.status as any, status);
  if (!transition.allowed) throw httpError(transition.reason || 'Invalid transition', 400, 'INVALID_TRANSITION');

  const updated = await prisma.designTask.update({
    where: { id: taskId },
    data: { status },
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'DESIGN_TASK_STATUS_CHANGED',
    entityType: 'DesignTask',
    entityId: taskId,
    projectId: task.projectId,
    before: { status: task.status },
    after: { status, comments },
  });

  return updated;
}

export async function submitDesignTaskForReview(taskId: string, actorId: string, comments?: string) {
  const task = await prisma.designTask.findUnique({ where: { id: taskId } });
  if (!task) throw httpError('Design task not found', 404, 'TASK_NOT_FOUND');

  const transition = (canTransitionDesignTask as any)(task.status as any, DesignTaskStatus.SUBMITTED_FOR_REVIEW as any);
  if (!transition.allowed) throw httpError(transition.reason || 'Invalid transition', 400, 'INVALID_TRANSITION');

  const updated = await prisma.designTask.update({
    where: { id: taskId },
    data: { status: DesignTaskStatus.SUBMITTED_FOR_REVIEW, submittedAt: new Date() },
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'DESIGN_TASK_SUBMITTED',
    entityType: 'DesignTask',
    entityId: taskId,
    projectId: task.projectId,
    after: { status: DesignTaskStatus.SUBMITTED_FOR_REVIEW, comments },
  });

  return updated;
}

export async function reviewDesignTask(taskId: string, actorId: string, data: any) {
  const task = await prisma.designTask.findUnique({ where: { id: taskId } });
  if (!task) throw httpError('Design task not found', 404, 'TASK_NOT_FOUND');

  const newStatus = data.decision === 'APPROVED' ? DesignTaskStatus.TECHNICALLY_APPROVED : DesignTaskStatus.RETURNED_WITH_COMMENTS;
  const transition = (canTransitionDesignTask as any)(task.status as any, newStatus as any);
  if (!transition.allowed) throw httpError(transition.reason || 'Invalid transition', 400, 'INVALID_TRANSITION');

  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.designTaskReview.create({
      data: {
        taskId,
        reviewerId: actorId,
        decision: data.decision,
        comments: data.comments,
        corrections: data.corrections,
      },
    });

    const updateData: any = { status: newStatus };
    if (newStatus === DesignTaskStatus.TECHNICALLY_APPROVED) {
      updateData.approvedAt = new Date();
    }
    const updated = await tx.designTask.update({
      where: { id: taskId },
      data: updateData,
    });

    return { review, task: updated };
  });

  await writeAudit({
    actorId: actorId || null,
    action: data.decision === 'APPROVED' ? 'DESIGN_TASK_APPROVED' : 'DESIGN_TASK_RETURNED',
    entityType: 'DesignTask',
    entityId: taskId,
    projectId: task.projectId,
    after: { status: newStatus, comments: data.comments },
  });

  return result;
}

export async function releaseDesignTask(taskId: string, actorId: string) {
  const task = await prisma.designTask.findUnique({ where: { id: taskId }, include: { designPackage: true } });
  if (!task) throw httpError('Design task not found', 404, 'TASK_NOT_FOUND');

  const transition = (canTransitionDesignTask as any)(task.status as any, DesignTaskStatus.RELEASED as any);
  if (!transition.allowed) throw httpError(transition.reason || 'Invalid transition', 400, 'INVALID_TRANSITION');

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.designTask.update({
      where: { id: taskId },
      data: { status: DesignTaskStatus.RELEASED, releasedAt: new Date() },
    });

    if (task.designPackageId) {
      await tx.designPackage.update({
        where: { id: task.designPackageId },
        data: { isReleased: true, releasedAt: new Date() },
      });
    }

    return t;
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'DESIGN_TASK_RELEASED',
    entityType: 'DesignTask',
    entityId: taskId,
    projectId: task.projectId,
    after: { status: DesignTaskStatus.RELEASED },
  });

  return updated;
}

export async function uploadWorkingFile(projectId: string, actorId: string, data: any) {
  const file = await prisma.workingFileVersion.create({
    data: {
      projectId,
      designPackageId: data.designPackageId,
      taskId: data.taskId,
      kind: data.kind || 'PDF',
      fileName: data.fileName,
      storageKey: data.storageKey,
      mimeType: data.mimeType,
      sizeBytes: BigInt(data.sizeBytes),
      checksum: data.checksum,
      versionNumber: data.versionNumber || 1,
      isNative: data.isNative || false,
      isClientVisible: data.isClientVisible || false,
      uploadedById: actorId,
    },
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'WORKING_FILE_UPLOADED',
    entityType: 'WorkingFileVersion',
    entityId: file.id,
    projectId,
    after: { fileName: data.fileName, kind: data.kind },
  });

  return file;
}

export async function getWorkingFiles(projectId: string, query: any = {}) {
  const where: any = { projectId };
  if (query.taskId) where.taskId = query.taskId;
  if (query.designPackageId) where.designPackageId = query.designPackageId;
  if (query.kind) where.kind = query.kind;

  return prisma.workingFileVersion.findMany({
    where,
    include: { uploadedBy: { select: { id: true, name: true } }, task: true },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function recordDesignApproval(projectId: string, actorId: string, data: any) {
  const approval = await prisma.designApproval.create({
    data: {
      projectId,
      type: data.type,
      versionId: data.versionId,
      evidenceKey: data.evidenceKey,
      evidenceNotes: data.evidenceNotes,
      clientIdentity: data.clientIdentity,
      status: DesignApprovalStatus.PENDING,
    },
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'DESIGN_APPROVAL_RECORDED',
    entityType: 'DesignApproval',
    entityId: approval.id,
    projectId,
    after: { type: data.type, status: 'PENDING' },
  });

  return approval;
}

export async function getDesignApprovals(projectId: string) {
  return prisma.designApproval.findMany({
    where: { projectId },
    include: { approvedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function approveDesignApproval(approvalId: string, actorId: string, data: any) {
  const approval = await prisma.designApproval.findUnique({ where: { id: approvalId } });
  if (!approval) throw httpError('Design approval not found', 404, 'APPROVAL_NOT_FOUND');

  const transition = (canTransitionDesignApproval as any)(approval.status as any, DesignApprovalStatus.APPROVED as any);
  if (!transition.allowed) throw httpError(transition.reason || 'Invalid transition', 400, 'INVALID_TRANSITION');

  const updated = await prisma.designApproval.update({
    where: { id: approvalId },
    data: {
      status: DesignApprovalStatus.APPROVED,
      approvedById: actorId,
      approvedAt: new Date(),
      evidenceKey: data.evidenceKey || approval.evidenceKey,
      evidenceNotes: data.evidenceNotes || approval.evidenceNotes,
      clientIdentity: data.clientIdentity || approval.clientIdentity,
    },
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'DESIGN_APPROVAL_APPROVED',
    entityType: 'DesignApproval',
    entityId: approvalId,
    projectId: approval.projectId,
    after: { type: approval.type, status: 'APPROVED', clientIdentity: data.clientIdentity },
  });

  return updated;
}

export async function createCoordinationIssue(projectId: string, actorId: string, data: any) {
  const issue = await prisma.$transaction(async (tx) => {
    const iss = await tx.coordinationIssue.create({
      data: {
        projectId,
        designPackageId: data.designPackageId,
        taskId: data.taskId,
        raisedById: actorId,
        ownerId: data.ownerId,
        title: data.title,
        description: data.description,
        severity: data.severity || 'MEDIUM',
        status: data.ownerId ? CoordinationIssueStatus.ASSIGNED : CoordinationIssueStatus.OPEN,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    if (data.affectedItems && Array.isArray(data.affectedItems)) {
      await tx.coordinationIssueItem.createMany({
        data: data.affectedItems.map((item: any) => ({
          issueId: iss.id,
          discipline: item.discipline,
          referenceId: item.referenceId,
          notes: item.notes,
        })),
      });
    }

    return iss;
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'COORDINATION_ISSUE_CREATED',
    entityType: 'CoordinationIssue',
    entityId: issue.id,
    projectId,
    after: { title: data.title, severity: data.severity },
  });

  return issue;
}

export async function getCoordinationIssues(projectId: string) {
  return prisma.coordinationIssue.findMany({
    where: { projectId },
    include: {
      raisedBy: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      affectedItems: true,
      task: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function resolveCoordinationIssue(issueId: string, actorId: string, resolutionNotes: string) {
  const issue = await prisma.coordinationIssue.findUnique({ where: { id: issueId } });
  if (!issue) throw httpError('Coordination issue not found', 404, 'ISSUE_NOT_FOUND');

  const transition = (canTransitionCoordinationIssue as any)(issue.status as any, CoordinationIssueStatus.RESOLVED as any);
  if (!transition.allowed) throw httpError(transition.reason || 'Invalid transition', 400, 'INVALID_TRANSITION');

  const updated = await prisma.coordinationIssue.update({
    where: { id: issueId },
    data: {
      status: CoordinationIssueStatus.RESOLVED,
      resolutionNotes,
      resolvedAt: new Date(),
    },
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'COORDINATION_ISSUE_RESOLVED',
    entityType: 'CoordinationIssue',
    entityId: issueId,
    projectId: issue.projectId,
    after: { status: 'RESOLVED', resolutionNotes },
  });

  return updated;
}

export async function createCostEstimate(projectId: string, actorId: string, data: any) {
  const lastEstimate = await prisma.costEstimate.findFirst({
    where: { projectId },
    orderBy: { versionNumber: 'desc' },
  });
  const versionNumber = (lastEstimate?.versionNumber || 0) + 1;

  const totalAmount = (data.lines || []).reduce((sum: number, line: any) => {
    const amt = Number(line.amount) || 0;
    return sum + amt;
  }, 0);

  const estimate = await prisma.$transaction(async (tx) => {
    const est = await tx.costEstimate.create({
      data: {
        projectId,
        versionNumber,
        status: EstimateStatus.DRAFT,
        isSummary: data.isSummary !== false,
        currency: data.currency || 'KES',
        totalAmount,
        assumptions: data.assumptions,
        exclusions: data.exclusions,
        createdById: actorId,
      },
    });

    if (data.lines && Array.isArray(data.lines)) {
      await tx.costEstimateLine.createMany({
        data: data.lines.map((line: any) => ({
          estimateId: est.id,
          itemCode: line.itemCode,
          description: line.description,
          unit: line.unit,
          quantity: line.quantity,
          rate: line.rate,
          amount: line.amount || 0,
          sourceVersionId: line.sourceVersionId,
          notes: line.notes,
        })),
      });
    }

    return est;
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'COST_ESTIMATE_CREATED',
    entityType: 'CostEstimate',
    entityId: estimate.id,
    projectId,
    after: { versionNumber, totalAmount: totalAmount.toString() },
  });

  return estimate;
}

export async function getCostEstimates(projectId: string) {
  return prisma.costEstimate.findMany({
    where: { projectId },
    include: {
      lines: true,
      createdBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: { versionNumber: 'desc' },
  });
}

export async function approveCostEstimate(estimateId: string, actorId: string) {
  const estimate = await prisma.costEstimate.findUnique({ where: { id: estimateId } });
  if (!estimate) throw httpError('Cost estimate not found', 404, 'ESTIMATE_NOT_FOUND');

  const transition = (canTransitionEstimate as any)(estimate.status as any, EstimateStatus.APPROVED as any);
  if (!transition.allowed) throw httpError(transition.reason || 'Invalid transition', 400, 'INVALID_TRANSITION');

  const updated = await prisma.costEstimate.update({
    where: { id: estimateId },
    data: {
      status: EstimateStatus.APPROVED,
      approvedById: actorId,
      approvedAt: new Date(),
    },
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'COST_ESTIMATE_APPROVED',
    entityType: 'CostEstimate',
    entityId: estimateId,
    projectId: estimate.projectId,
    after: { status: 'APPROVED', versionNumber: estimate.versionNumber },
  });

  return updated;
}

export async function requestDesignChange(projectId: string, actorId: string, data: any) {
  const change = await prisma.designChange.create({
    data: {
      projectId,
      changeType: data.changeType,
      reason: data.reason,
      requestedById: actorId,
      feeImpact: data.feeImpact,
      timeImpactDays: data.timeImpactDays,
    },
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'DESIGN_CHANGE_REQUESTED',
    entityType: 'DesignChange',
    entityId: change.id,
    projectId,
    after: { changeType: data.changeType, reason: data.reason },
  });

  return change;
}

export async function decideDesignChange(changeId: string, actorId: string, data: any) {
  const change = await prisma.designChange.findUnique({ where: { id: changeId } });
  if (!change) throw httpError('Design change not found', 404, 'CHANGE_NOT_FOUND');

  const updated = await prisma.designChange.update({
    where: { id: changeId },
    data: {
      decidedById: actorId,
      decision: data.decision,
      decisionAt: new Date(),
      feeImpact: data.feeImpact ?? change.feeImpact,
      timeImpactDays: data.timeImpactDays ?? change.timeImpactDays,
      requiresClientReacceptance: data.requiresClientReacceptance || false,
    },
  });

  await writeAudit({
    actorId: actorId || null,
    action: 'DESIGN_CHANGE_DECIDED',
    entityType: 'DesignChange',
    entityId: changeId,
    projectId: change.projectId,
    after: { decision: data.decision, requiresClientReacceptance: data.requiresClientReacceptance },
  });

  return updated;
}
