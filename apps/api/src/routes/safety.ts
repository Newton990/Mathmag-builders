// src/routes/safety.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, requireRole, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import * as safetyService from '../services/safety.service.js';

const router = Router();
router.use(requireAuth);

// ── Operator Permits ──────────────────────────────────────────────

// Get permits for an operator
router.get(
  '/operators/:operatorId/permits',
  requireStaff,
  asyncHandler(async (req, res) => {
    const permits = await safetyService.getOperatorPermits(String(req.params.operatorId));
    res.json({ data: permits });
  }),
);

// Create operator permit (management/HR)
router.post(
  '/operators/permits',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'DEPARTMENT_HEAD'),
  validate(
    z.object({
      body: z.object({
        operatorId: z.string().uuid(),
        qualification: z.string().min(1),
        permitNumber: z.string().min(1),
        status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'PENDING']).optional(),
        issuedAt: z.string().datetime().optional(),
        expiresAt: z.string().datetime().optional(),
        projectId: z.string().uuid().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const permit = await safetyService.createOperatorPermit(req.auth!.userId, req.body);
    res.status(201).json({ data: permit });
  }),
);

// ── Assets ────────────────────────────────────────────────────────

// Assign operator to asset (blocks if permit invalid — UAT-20, MAST-UAT-20)
router.post(
  '/assets/:assetId/assign-operator',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'PROJECT_MANAGER'),
  validate(
    z.object({
      body: z.object({
        operatorId: z.string().uuid(),
        qualification: z.string().min(1),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const asset = await safetyService.assignOperatorToAsset(
      String(req.params.assetId),
      req.body.operatorId,
      req.auth!.userId,
      req.body.qualification,
    );
    res.json({ data: asset });
  }),
);

// Get assets on hold (safety dashboard)
router.get(
  '/projects/:projectId/assets-on-hold',
  requireStaff,
  asyncHandler(async (req, res) => {
    const assets = await safetyService.getAssetsOnHold(String(req.params.projectId));
    res.json({ data: assets });
  }),
);

// ── Daily Inspections ─────────────────────────────────────────────

// Record daily pre-use inspection (critical defect → asset HOLD — UAT-21, MAST-UAT-21)
router.post(
  '/assets/:assetId/daily-inspections',
  requireStaff,
  validate(
    z.object({
      body: z.object({
        projectId: z.string().uuid(),
        operatorId: z.string().uuid(),
        result: z.enum(['PASSED', 'FAILED_CRITICAL', 'FAILED_MINOR', 'PENDING']),
        criticalDefect: z.boolean().optional(),
        defectDescription: z.string().optional(),
        notes: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const inspection = await safetyService.recordDailyInspection(
      String(req.params.assetId),
      req.body.projectId,
      req.body.operatorId,
      req.body,
      req.auth!.userId,
    );
    res.status(201).json({ data: inspection });
  }),
);

// Release asset from hold — independent technician only, no self-cert (MAST-UAT-22)
router.post(
  '/assets/:assetId/release-hold',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'PROJECT_MANAGER'),
  validate(
    z.object({
      body: z.object({
        clearedByQualifiedTechnician: z.boolean(),
        technicalClearanceNotes: z.string().min(1),
        newOperatorId: z.string().uuid().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const asset = await safetyService.releaseAssetFromHold(
      String(req.params.assetId),
      req.auth!.userId,
      req.body,
    );
    res.json({ data: asset });
  }),
);

// ── Fuel Issues ───────────────────────────────────────────────────

// Record fuel issue (requires machine/project/operator/custody — UAT-22, MAST-UAT-23)
router.post(
  '/projects/:projectId/fuel-issues',
  requireStaff,
  validate(
    z.object({
      body: z.object({
        assetId: z.string().uuid().optional(),
        operatorId: z.string().uuid(),
        fuelType: z.string().min(1),
        liters: z.number().positive(),
        meterReading: z.string().optional(),
        site: z.string().optional(),
        custody: z.string().min(1),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const issue = await safetyService.recordFuelIssue(
      String(req.params.projectId),
      req.auth!.userId,
      req.body,
    );
    res.status(201).json({ data: issue });
  }),
);

// Verify fuel issue (independent verifier)
router.post(
  '/fuel-issues/:issueId/verify',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER'),
  validate(
    z.object({
      body: z.object({
        actorId: z.string().uuid(),
        notes: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const issue = await safetyService.verifyFuelIssue(
      String(req.params.issueId),
      req.body.actorId,
      req.body,
    );
    res.json({ data: issue });
  }),
);

export const safetyRouter = router;
