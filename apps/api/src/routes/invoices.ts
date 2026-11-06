// src/routes/invoices.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, requireRole, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import * as invoiceService from '../services/invoice.service.js';

const router = Router();
router.use(requireAuth);

// List invoices for project (staff)
router.get(
  '/projects/:projectId',
  requireStaff,
  asyncHandler(async (req, res) => {
    const invoices = await invoiceService.getInvoices(String(req.params.projectId));
    res.json({ data: invoices });
  }),
);

// Get invoice
router.get(
  '/:invoiceId',
  requireStaff,
  asyncHandler(async (req, res) => {
    const invoice = await invoiceService.getInvoice(String(req.params.invoiceId));
    res.json({ data: invoice });
  }),
);

// Create invoice (management/finance/QS)
router.post(
  '/projects/:projectId/invoices',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'PROJECT_MANAGER', 'CLIENT_RELATIONS_OFFICER'),
  validate(
    z.object({
      body: z.object({
        supplierId: z.string().uuid(),
        poId: z.string().uuid().optional(),
        grnId: z.string().uuid().optional(),
        invoiceNumber: z.string().min(1),
        amount: z.number().positive(),
        currency: z.string().optional(),
        actorId: z.string().uuid(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const invoice = await invoiceService.createInvoice(
      String(req.params.projectId),
      req.body.actorId,
      req.body,
    );
    res.status(201).json({ data: invoice });
  }),
);

// Three-way match invoice (accounts)
router.post(
  '/invoices/:invoiceId/match',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER'),
  validate(
    z.object({
      body: z.object({
        actorId: z.string().uuid(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const invoice = await invoiceService.matchInvoice(String(req.params.invoiceId), req.body.actorId);
    res.json({ data: invoice });
  }),
);

// Pay invoice (accounts/payer)
router.post(
  '/invoices/:invoiceId/pay',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER'),
  validate(
    z.object({
      body: z.object({
        actorId: z.string().uuid(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const invoice = await invoiceService.payInvoice(String(req.params.invoiceId), req.body.actorId, req.body);
    res.json({ data: invoice });
  }),
);

export const invoiceRouter = router;
