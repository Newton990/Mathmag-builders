// src/routes/acceptance.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import * as acceptanceService from '../services/acceptance.service.js';

const router = Router();
router.use(requireAuth);

// Create proposal from planning
router.post(
  '/projects/:projectId/proposals/from-planning',
  asyncHandler(async (req, res) => {
    const proposal = await acceptanceService.createProposalFromPlanning(String(req.params.projectId), req.auth!.userId);
    res.status(201).json({ data: proposal });
  }),
);

// Get proposals for project
router.get(
  '/projects/:projectId/proposals',
  asyncHandler(async (req, res) => {
    const proposals = await acceptanceService.getProposals(String(req.params.projectId));
    res.json({ data: proposals });
  }),
);

// Get proposal details
router.get(
  '/proposals/:proposalId',
  asyncHandler(async (req, res) => {
    const proposal = await acceptanceService.getProposal(String(req.params.proposalId));
    res.json({ data: proposal });
  }),
);

// Publish proposal
router.post(
  '/proposals/:proposalId/publish',
  validate(
    z.object({
      body: z.object({
        detailedBudgetVisible: z.boolean().optional(),
        documentIds: z.array(z.string()).optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const proposal = await acceptanceService.publishProposal(String(req.params.proposalId), req.auth!.userId, req.body);
    res.json({ data: proposal });
  }),
);

// Add review/comment
router.post(
  '/proposals/:proposalId/reviews',
  validate(
    z.object({
      body: z.object({
        comment: z.string().min(1),
        reviewerName: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const review = await acceptanceService.addReview(String(req.params.proposalId), req.auth!.userId, req.body);
    res.status(201).json({ data: review });
  }),
);

// Client accept
router.post(
  '/proposals/:proposalId/client-acceptance',
  validate(
    z.object({
      body: z.object({
        method: z.enum(['PORTAL', 'SIGNED_FORM', 'MEETING']),
        acceptanceText: z.string().optional(),
        evidenceKey: z.string().optional(),
        evidenceNotes: z.string().optional(),
        clientIdentity: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const acceptance = await acceptanceService.clientAccept(String(req.params.proposalId), req.auth!.userId, req.body);
    res.status(201).json({ data: acceptance });
  }),
);

// Verify acceptance (management)
router.post(
  '/acceptances/:acceptanceId/verify',
  validate(
    z.object({
      body: z.object({
        status: z.enum(['VERIFIED', 'RETURNED_FOR_CLARIFICATION', 'REJECTED']),
        verificationNotes: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const acceptance = await acceptanceService.verifyAcceptance(String(req.params.acceptanceId), req.auth!.userId, req.body);
    res.json({ data: acceptance });
  }),
);

// Create payment milestone
router.post(
  '/projects/:projectId/payments',
  validate(
    z.object({
      body: z.object({
        amountDue: z.number(),
        milestoneDescription: z.string().optional(),
        proposalId: z.string().uuid().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const payment = await acceptanceService.createPaymentMilestone(String(req.params.projectId), req.body);
    res.status(201).json({ data: payment });
  }),
);

// Verify payment (accounts)
router.post(
  '/payments/:paymentId/verify',
  validate(
    z.object({
      body: z.object({
        transactionRef: z.string().min(1),
        amountPaid: z.number().optional(),
        receiptKey: z.string().optional(),
        notes: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const payment = await acceptanceService.verifyPayment(String(req.params.paymentId), req.auth!.userId, req.body);
    res.json({ data: payment });
  }),
);

// Create payment exception
router.post(
  '/projects/:projectId/payment-exceptions',
  validate(
    z.object({
      body: z.object({
        reason: z.string().min(1),
        conditions: z.string().optional(),
        scope: z.string().optional(),
        withinLegalLimits: z.boolean().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const exception = await acceptanceService.createPaymentException(String(req.params.projectId), req.auth!.userId, req.body);
    res.status(201).json({ data: exception });
  }),
);

// Release to Module 4
router.post(
  '/projects/:projectId/module4/release',
  validate(
    z.object({
      body: z.object({
        gateChecklist: z.any().optional(),
        notes: z.string().optional(),
        paymentExceptionId: z.string().uuid().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const release = await acceptanceService.releaseToModule4(String(req.params.projectId), req.auth!.userId, req.body);
    res.json({ data: release });
  }),
);

// Get releases
router.get(
  '/projects/:projectId/releases',
  asyncHandler(async (req, res) => {
    const releases = await acceptanceService.getReleases(String(req.params.projectId));
    res.json({ data: releases });
  }),
);

export { router as acceptanceRouter };
