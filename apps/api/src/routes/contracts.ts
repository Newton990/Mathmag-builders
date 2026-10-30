// src/routes/contracts.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import * as contractsService from '../services/contracts.service.js';

const router = Router();
router.use(requireAuth);

// Create service engagement
router.post(
  '/projects/:projectId/engagements',
  validate(
    z.object({
      body: z.object({
        type: z.enum(['DESIGN_ONLY', 'PRINTING_ONLY', 'APPROVALS_ONLY', 'TECHNICAL_INSPECTION', 'LABOUR_ONLY', 'FULL_CONSTRUCTION']),
        description: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const engagement = await contractsService.createServiceEngagement(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: engagement });
  }),
);

// Get engagements
router.get(
  '/projects/:projectId/engagements',
  asyncHandler(async (req, res) => {
    const engagements = await contractsService.getServiceEngagements(String(req.params.projectId));
    res.json({ data: engagements });
  }),
);

// Create contract
router.post(
  '/projects/:projectId/contracts',
  validate(
    z.object({
      body: z.object({
        engagementId: z.string().uuid().optional(),
        parties: z.any().optional(),
        terms: z.any().optional(),
        value: z.number().optional(),
        currency: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const contract = await contractsService.createContract(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: contract });
  }),
);

// Get contracts
router.get(
  '/projects/:projectId/contracts',
  asyncHandler(async (req, res) => {
    const contracts = await contractsService.getContracts(String(req.params.projectId));
    res.json({ data: contracts });
  }),
);

// Get contract details
router.get(
  '/contracts/:contractId',
  asyncHandler(async (req, res) => {
    const contract = await contractsService.getContract(String(req.params.contractId));
    res.json({ data: contract });
  }),
);

// Send contract
router.post(
  '/contracts/:contractId/send',
  asyncHandler(async (req, res) => {
    const contract = await contractsService.sendContract(String(req.params.contractId), req.auth!.userId);
    res.json({ data: contract });
  }),
);

// Execute contract
router.post(
  '/contracts/:contractId/execute',
  asyncHandler(async (req, res) => {
    const contract = await contractsService.executeContract(String(req.params.contractId), req.auth!.userId);
    res.json({ data: contract });
  }),
);

// Terminate contract
router.post(
  '/contracts/:contractId/terminate',
  asyncHandler(async (req, res) => {
    const contract = await contractsService.terminateContract(String(req.params.contractId), req.auth!.userId);
    res.json({ data: contract });
  }),
);

export { router as contractsRouter };
