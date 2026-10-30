// src/routes/approvals.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import * as approvalsService from '../services/approvals.service.js';

const router = Router();
router.use(requireAuth);

// Create approval case
router.post(
  '/projects/:projectId/cases',
  validate(
    z.object({
      body: z.object({
        priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
        assignedToId: z.string().uuid().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const caseRecord = await approvalsService.createApprovalCase(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: caseRecord });
  }),
);

// Get cases for project
router.get(
  '/projects/:projectId/cases',
  asyncHandler(async (req, res) => {
    const cases = await approvalsService.getApprovalCases(String(req.params.projectId));
    res.json({ data: cases });
  }),
);

// Get case details
router.get(
  '/cases/:caseId',
  asyncHandler(async (req, res) => {
    const caseRecord = await approvalsService.getApprovalCase(String(req.params.caseId));
    res.json({ data: caseRecord });
  }),
);

// Add permit
router.post(
  '/cases/:caseId/permits',
  validate(
    z.object({
      body: z.object({
        permitType: z.string().min(1),
        authority: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const permit = await approvalsService.addPermit(String(req.params.caseId), req.auth!.userId, req.body);
    res.status(201).json({ data: permit });
  }),
);

// Update permit status
router.patch(
  '/permits/:permitId',
  validate(
    z.object({
      body: z.object({
        status: z.enum(['PENDING', 'APPLIED', 'ISSUED', 'EXPIRED', 'SUSPENDED', 'REJECTED']).optional(),
        referenceNo: z.string().optional(),
        appliedAt: z.string().datetime().optional(),
        issuedAt: z.string().datetime().optional(),
        expiresAt: z.string().datetime().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const permit = await approvalsService.updatePermit(String(req.params.permitId), req.auth!.userId, req.body);
    res.json({ data: permit });
  }),
);

// Add print
router.post(
  '/cases/:caseId/prints',
  validate(
    z.object({
      body: z.object({
        documentName: z.string().min(1),
        versionId: z.string().uuid().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const print = await approvalsService.addPrint(String(req.params.caseId), req.auth!.userId, req.body);
    res.status(201).json({ data: print });
  }),
);

// Update print status
router.patch(
  '/prints/:printId',
  validate(
    z.object({
      body: z.object({
        status: z.enum(['PENDING', 'PRINTED', 'STAMPED', 'ISSUED']).optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const print = await approvalsService.updatePrint(String(req.params.printId), req.auth!.userId, req.body);
    res.json({ data: print });
  }),
);

// Update case status
router.patch(
  '/cases/:caseId/status',
  validate(
    z.object({
      body: z.object({
        status: z.enum(['OPEN', 'IN_PROGRESS', 'SUBMITTED', 'RETURNED', 'CLEARED', 'REJECTED']),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const caseRecord = await approvalsService.updateCaseStatus(String(req.params.caseId), req.auth!.userId, req.body.status);
    res.json({ data: caseRecord });
  }),
);

export { router as approvalsRouter };
