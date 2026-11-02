// src/routes/governance.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import * as governanceService from '../services/governance.service.js';

const router = Router();
router.use(requireAuth);

// Delegations
router.post(
  '/delegations',
  validate(
    z.object({
      body: z.object({
        projectId: z.string().uuid().optional(),
        delegateId: z.string().uuid(),
        scope: z.any().optional(),
        valueLimit: z.number().optional(),
        riskCategory: z.string().optional(),
        expiresAt: z.string().datetime().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const d = await governanceService.createDelegation(req.auth!.userId, req.body);
    res.status(201).json({ data: d });
  }),
);

router.get('/delegations', asyncHandler(async (_req, res) => {
  const d = await governanceService.listDelegations();
  res.json({ data: d });
}));

// Acting authority
router.post(
  '/acting-authorities',
  validate(
    z.object({
      body: z.object({
        projectId: z.string().uuid().optional(),
        actingId: z.string().uuid(),
        reason: z.string().min(1),
        expiresAt: z.string().datetime().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const a = await governanceService.createActingAuthority(req.auth!.userId, req.body);
    res.status(201).json({ data: a });
  }),
);

router.post(
  '/acting-authorities/:id/activate',
  asyncHandler(async (req, res) => {
    const a = await governanceService.activateActingAuthority(String(req.params.id), req.auth!.userId);
    res.json({ data: a });
  }),
);

// Exceptions
router.post(
  '/exceptions',
  validate(
    z.object({
      body: z.object({
        projectId: z.string().uuid().optional(),
        reason: z.string().min(1),
        scope: z.any().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const e = await governanceService.createException(req.auth!.userId, req.body);
    res.status(201).json({ data: e });
  }),
);

router.post(
  '/exceptions/:id/approve',
  asyncHandler(async (req, res) => {
    const e = await governanceService.approveException(String(req.params.id), req.auth!.userId);
    res.json({ data: e });
  }),
);

// Protected audit
router.post(
  '/protected-audits',
  validate(
    z.object({
      body: z.object({
        projectId: z.string().uuid().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        severity: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const a = await governanceService.createProtectedAudit(req.auth!.userId, req.body);
    res.status(201).json({ data: a });
  }),
);

router.post(
  '/protected-audits/:id/triage',
  asyncHandler(async (req, res) => {
    const a = await governanceService.triageProtectedAudit(String(req.params.id), req.auth!.userId);
    res.json({ data: a });
  }),
);

// Leave
router.post(
  '/leave',
  validate(
    z.object({
      body: z.object({
        projectId: z.string().uuid().optional(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        reason: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const l = await governanceService.createLeave(req.auth!.userId, req.body);
    res.status(201).json({ data: l });
  }),
);

router.post(
  '/leave/:id/approve',
  asyncHandler(async (req, res) => {
    const l = await governanceService.approveLeave(String(req.params.id), req.auth!.userId);
    res.json({ data: l });
  }),
);

// Procurement
router.post(
  '/requisitions',
  validate(
    z.object({
      body: z.object({
        projectId: z.string().uuid().optional(),
        items: z.any().optional(),
        totalAmount: z.number().optional(),
        notes: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const r = await governanceService.createRequisition(req.auth!.userId, req.body);
    res.status(201).json({ data: r });
  }),
);

router.post(
  '/requisitions/:id/approve',
  asyncHandler(async (req, res) => {
    const r = await governanceService.approveRequisition(String(req.params.id), req.auth!.userId);
    res.json({ data: r });
  }),
);

router.post(
  '/purchase-orders',
  validate(
    z.object({
      body: z.object({
        projectId: z.string().uuid().optional(),
        requisitionId: z.string().uuid().optional(),
        supplierId: z.string().uuid().optional(),
        items: z.any().optional(),
        totalAmount: z.number().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const po = await governanceService.createPO(req.auth!.userId, req.body);
    res.status(201).json({ data: po });
  }),
);

export { router as governanceRouter };
