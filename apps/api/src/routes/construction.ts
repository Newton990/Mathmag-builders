// src/routes/construction.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, requireRole, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import * as constructionService from '../services/construction.service.js';

const router = Router();
router.use(requireAuth);

// Mobilization
router.get(
  '/projects/:projectId/mobilization',
  asyncHandler(async (req, res) => {
    const m = await constructionService.getMobilization(String(req.params.projectId));
    res.json({ data: m });
  }),
);

router.post(
  '/projects/:projectId/mobilization',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'PROJECT_MANAGER'),
  asyncHandler(async (req, res) => {
    const m = await constructionService.createOrGetMobilization(String(req.params.projectId), req.auth!.userId);
    res.json({ data: m });
  }),
);

router.post(
  '/mobilization/:mobilizationId/release',
  requireRole('GENERAL_MANAGER', 'ADMIN_MANAGEMENT'),
  asyncHandler(async (req, res) => {
    const m = await constructionService.releaseMobilization(String(req.params.mobilizationId), req.auth!.userId);
    res.json({ data: m });
  }),
);

// Site logs
router.post(
  '/projects/:projectId/site-logs',
  validate(
    z.object({
      body: z.object({
        logDate: z.string().datetime().optional(),
        weather: z.string().optional(),
        workSummary: z.string().optional(),
        workers: z.any().optional(),
        issues: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const log = await constructionService.createSiteLog(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: log });
  }),
);

router.get(
  '/projects/:projectId/site-logs',
  asyncHandler(async (req, res) => {
    const logs = await constructionService.getSiteLogs(String(req.params.projectId));
    res.json({ data: logs });
  }),
);

// GRN
router.get(
  '/projects/:projectId/grns',
  asyncHandler(async (req, res) => {
    const grns = await constructionService.getGRNs(String(req.params.projectId));
    res.json({ data: grns });
  }),
);

router.post(
  '/projects/:projectId/grns',
  validate(
    z.object({
      body: z.object({
        supplier: z.string().optional(),
        poNumber: z.string().optional(),
        items: z.any().optional(),
        notes: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const grn = await constructionService.createGRN(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: grn });
  }),
);

router.post(
  '/grns/:grnId/accept',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'PROJECT_MANAGER', 'STOREKEEPER'),
  asyncHandler(async (req, res) => {
    const grn = await constructionService.acceptGRN(String(req.params.grnId), req.auth!.userId);
    res.json({ data: grn });
  }),
);

// Work holds
router.get(
  '/projects/:projectId/work-holds',
  asyncHandler(async (req, res) => {
    const holds = await constructionService.getWorkHolds(String(req.params.projectId));
    res.json({ data: holds });
  }),
);

router.post(
  '/projects/:projectId/work-holds',
  validate(
    z.object({
      body: z.object({
        reason: z.string().min(1),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const hold = await constructionService.createWorkHold(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: hold });
  }),
);

router.post(
  '/work-holds/:holdId/lift',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'PROJECT_MANAGER', 'SITE_SUPERVISOR', 'QUALIFIED_PROFESSIONAL'),
  validate(
    z.object({
      body: z.object({
        clearanceNotes: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const hold = await constructionService.liftWorkHold(String(req.params.holdId), req.auth!.userId, req.body);
    res.json({ data: hold });
  }),
);

// Variations
router.get(
  '/projects/:projectId/variations',
  asyncHandler(async (req, res) => {
    const variations = await constructionService.getVariations(String(req.params.projectId));
    res.json({ data: variations });
  }),
);

router.post(
  '/projects/:projectId/variations',
  validate(
    z.object({
      body: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        value: z.number().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const variation = await constructionService.createVariation(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: variation });
  }),
);

router.post(
  '/variations/:variationId/approve',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'DEPARTMENT_HEAD'),
  asyncHandler(async (req, res) => {
    const variation = await constructionService.approveVariation(String(req.params.variationId), req.auth!.userId);
    res.json({ data: variation });
  }),
);

// Handover
router.get(
  '/projects/:projectId/handover',
  asyncHandler(async (req, res) => {
    const handover = await constructionService.getHandover(String(req.params.projectId));
    res.json({ data: handover });
  }),
);

router.post(
  '/projects/:projectId/handover',
  validate(
    z.object({
      body: z.object({
        checklist: z.any().optional(),
        snags: z.any().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const handover = await constructionService.createOrUpdateHandover(String(req.params.projectId), req.auth!.userId, req.body);
    res.json({ data: handover });
  }),
);

router.post(
  '/projects/:projectId/handover/accept',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'CLIENT'),
  asyncHandler(async (req, res) => {
    const handover = await constructionService.acceptHandover(String(req.params.projectId), req.auth!.userId);
    res.json({ data: handover });
  }),
);

export { router as constructionRouter };
