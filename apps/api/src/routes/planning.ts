// src/routes/planning.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import * as planningService from '../services/planning.service.js';
import { DesignDiscipline, DesignTaskStatus } from '@mbms/shared';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get planning overview for a project
router.get(
  '/projects/:projectId/overview',
  asyncHandler(async (req, res) => {
    const overview = await planningService.getPlanningOverview(String(String(req.params.projectId)));
    res.json({ data: overview });
  }),
);

// Get design packages for a project
router.get(
  '/projects/:projectId/packages',
  asyncHandler(async (req, res) => {
    const packages = await planningService.getDesignPackages(String(String(req.params.projectId)));
    res.json({ data: packages });
  }),
);

// Initialize design packages for a project
router.post(
  '/projects/:projectId/packages/init',
  asyncHandler(async (req, res) => {
    const packages = await planningService.initializeDesignPackages(String(String(req.params.projectId)), req.auth!.userId);
    res.json({ data: packages });
  }),
);

// Create design task
router.post(
  '/projects/:projectId/tasks',
  validate(
    z.object({
      body: z.object({
        discipline: z.nativeEnum(DesignDiscipline),
        title: z.string().min(1),
        description: z.string().optional(),
        assigneeId: z.string().uuid().optional(),
        plannedDeadline: z.string().datetime().optional(),
        instructions: z.string().optional(),
        designPackageId: z.string().uuid().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const task = await planningService.createDesignTask(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: task });
  }),
);

// Get tasks for a project
router.get(
  '/projects/:projectId/tasks',
  asyncHandler(async (req, res) => {
    const tasks = await planningService.getDesignTasks(String(req.params.projectId), req.query);
    res.json({ data: tasks });
  }),
);

// Get single task
router.get(
  '/tasks/:taskId',
  asyncHandler(async (req, res) => {
    const task = await planningService.getDesignTask(String(req.params.taskId));
    res.json({ data: task });
  }),
);

// Update task status
router.patch(
  '/tasks/:taskId/status',
  validate(
    z.object({
      body: z.object({
        status: z.nativeEnum(DesignTaskStatus),
        comments: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const task = await planningService.updateDesignTaskStatus(
      String(req.params.taskId),
      req.auth!.userId,
      req.body.status,
      req.body.comments,
    );
    res.json({ data: task });
  }),
);

// Submit task for review
router.post(
  '/tasks/:taskId/submit',
  validate(
    z.object({
      body: z.object({
        comments: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const task = await planningService.submitDesignTaskForReview(String(req.params.taskId), req.auth!.userId, req.body.comments);
    res.json({ data: task });
  }),
);

// Review task (approve/return)
router.post(
  '/tasks/:taskId/review',
  validate(
    z.object({
      body: z.object({
        decision: z.enum(['APPROVED', 'RETURNED']),
        comments: z.string().min(1),
        corrections: z.any().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const review = await planningService.reviewDesignTask(String(req.params.taskId), req.auth!.userId, req.body);
    res.json({ data: review });
  }),
);

// Release task/package
router.post(
  '/tasks/:taskId/release',
  asyncHandler(async (req, res) => {
    const task = await planningService.releaseDesignTask(String(req.params.taskId), req.auth!.userId);
    res.json({ data: task });
  }),
);

// Upload working file
router.post(
  '/projects/:projectId/files',
  validate(
    z.object({
      body: z.object({
        taskId: z.string().uuid().optional(),
        designPackageId: z.string().uuid().optional(),
        kind: z.string().optional(),
        fileName: z.string().min(1),
        storageKey: z.string().min(1),
        mimeType: z.string().min(1),
        sizeBytes: z.number(),
        checksum: z.string().min(1),
        isNative: z.boolean().optional(),
        isClientVisible: z.boolean().optional(),
        versionNumber: z.number().int().positive().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const file = await planningService.uploadWorkingFile(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: file });
  }),
);

// Get working files
router.get(
  '/projects/:projectId/files',
  asyncHandler(async (req, res) => {
    const files = await planningService.getWorkingFiles(String(req.params.projectId), req.query);
    res.json({ data: files });
  }),
);

// Record client design approval
router.post(
  '/projects/:projectId/design-approvals',
  validate(
    z.object({
      body: z.object({
        type: z.enum(['TWO_D', 'THREE_D']),
        versionId: z.string().optional(),
        evidenceKey: z.string().optional(),
        evidenceNotes: z.string().optional(),
        clientIdentity: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const approval = await planningService.recordDesignApproval(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: approval });
  }),
);

// Get design approvals
router.get(
  '/projects/:projectId/design-approvals',
  asyncHandler(async (req, res) => {
    const approvals = await planningService.getDesignApprovals(String(req.params.projectId));
    res.json({ data: approvals });
  }),
);

// Approve design approval (client/staff action)
router.post(
  '/design-approvals/:approvalId/approve',
  validate(
    z.object({
      body: z.object({
        evidenceKey: z.string().optional(),
        evidenceNotes: z.string().optional(),
        clientIdentity: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const approval = await planningService.approveDesignApproval(String(req.params.approvalId), req.auth!.userId, req.body);
    res.json({ data: approval });
  }),
);

// Create coordination issue
router.post(
  '/projects/:projectId/coordination-issues',
  validate(
    z.object({
      body: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        severity: z.string().optional(),
        ownerId: z.string().uuid().optional(),
        dueDate: z.string().datetime().optional(),
        designPackageId: z.string().uuid().optional(),
        taskId: z.string().uuid().optional(),
        affectedItems: z.array(z.any()).optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const issue = await planningService.createCoordinationIssue(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: issue });
  }),
);

// Get coordination issues
router.get(
  '/projects/:projectId/coordination-issues',
  asyncHandler(async (req, res) => {
    const issues = await planningService.getCoordinationIssues(String(req.params.projectId));
    res.json({ data: issues });
  }),
);

// Resolve coordination issue
router.post(
  '/coordination-issues/:issueId/resolve',
  validate(
    z.object({
      body: z.object({
        resolutionNotes: z.string().min(1),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const issue = await planningService.resolveCoordinationIssue(String(req.params.issueId), req.auth!.userId, req.body.resolutionNotes);
    res.json({ data: issue });
  }),
);

// Create cost estimate
router.post(
  '/projects/:projectId/estimates',
  validate(
    z.object({
      body: z.object({
        isSummary: z.boolean().optional(),
        currency: z.string().optional(),
        assumptions: z.string().optional(),
        exclusions: z.string().optional(),
        lines: z.array(z.any()).optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const estimate = await planningService.createCostEstimate(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: estimate });
  }),
);

// Get cost estimates
router.get(
  '/projects/:projectId/estimates',
  asyncHandler(async (req, res) => {
    const estimates = await planningService.getCostEstimates(String(req.params.projectId));
    res.json({ data: estimates });
  }),
);

// Approve cost estimate
router.post(
  '/estimates/:estimateId/approve',
  asyncHandler(async (req, res) => {
    const estimate = await planningService.approveCostEstimate(String(req.params.estimateId), req.auth!.userId);
    res.json({ data: estimate });
  }),
);

// Request design change
router.post(
  '/projects/:projectId/design-changes',
  validate(
    z.object({
      body: z.object({
        changeType: z.enum(['MINOR', 'MAJOR']),
        reason: z.string().min(1),
        feeImpact: z.number().optional(),
        timeImpactDays: z.number().int().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const change = await planningService.requestDesignChange(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: change });
  }),
);

// Decide design change
router.post(
  '/design-changes/:changeId/decide',
  validate(
    z.object({
      body: z.object({
        decision: z.string().min(1),
        feeImpact: z.number().optional(),
        timeImpactDays: z.number().int().optional(),
        requiresClientReacceptance: z.boolean().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const change = await planningService.decideDesignChange(String(req.params.changeId), req.auth!.userId, req.body);
    res.json({ data: change });
  }),
);

export { router as planningRouter };
