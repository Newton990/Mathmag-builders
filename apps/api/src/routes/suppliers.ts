// src/routes/suppliers.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, requireRole, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import * as supplierService from '../services/supplier.service.js';

const router = Router();
router.use(requireAuth);

// List suppliers (staff)
router.get(
  '/',
  requireStaff,
  asyncHandler(async (_req, res) => {
    const suppliers = await supplierService.getSuppliers();
    res.json({ data: suppliers });
  }),
);

// Get supplier
router.get(
  '/:supplierId',
  requireStaff,
  asyncHandler(async (req, res) => {
    const supplier = await supplierService.getSupplier(String(req.params.supplierId));
    res.json({ data: supplier });
  }),
);

// Create supplier (management)
router.post(
  '/',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'PROJECT_MANAGER'),
  validate(
    z.object({
      body: z.object({
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        bankAccount: z.string().optional(),
        mpesaNumber: z.string().optional(),
        trustedContact: z.string().optional(),
        trustedContactPhone: z.string().optional(),
        actorId: z.string().uuid(),
        projectId: z.string().uuid().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json({ data: supplier });
  }),
);

// Request beneficiary change (management/finance)
router.post(
  '/:supplierId/beneficiary-change',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'PROJECT_MANAGER'),
  validate(
    z.object({
      body: z.object({
        newBankAccount: z.string().optional(),
        newMpesaNumber: z.string().optional(),
        trustedContact: z.string().optional(),
        reason: z.string().optional(),
        projectId: z.string().uuid().optional(),
        actorId: z.string().uuid(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const change = await supplierService.requestBeneficiaryChange(
      String(req.params.supplierId),
      req.body.actorId,
      req.body,
    );
    res.status(201).json({ data: change });
  }),
);

// Verify beneficiary change (GM/Admin)
router.post(
  '/:supplierId/beneficiary-change/:changeId/verify',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER'),
  validate(
    z.object({
      body: z.object({
        actorId: z.string().uuid(),
        verificationContact: z.string().optional(),
        trustedContact: z.string().optional(),
        trustedContactPhone: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const result = await supplierService.verifyBeneficiaryChange(
      String(req.params.changeId),
      req.body.actorId,
      req.body,
    );
    res.json({ data: result });
  }),
);

// Reject beneficiary change (GM/Admin)
router.post(
  '/:supplierId/beneficiary-change/:changeId/reject',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER'),
  validate(
    z.object({
      body: z.object({
        actorId: z.string().uuid(),
        rejectionReason: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const change = await supplierService.rejectBeneficiaryChange(
      String(req.params.changeId),
      req.body.actorId,
      req.body,
    );
    res.json({ data: change });
  }),
);

// Check active beneficiary hold
router.get(
  '/:supplierId/beneficiary-hold',
  requireStaff,
  asyncHandler(async (req, res) => {
    const hold = await supplierService.getActiveBeneficiaryHold(String(req.params.supplierId));
    res.json({ data: hold });
  }),
);

export const supplierRouter = router;
