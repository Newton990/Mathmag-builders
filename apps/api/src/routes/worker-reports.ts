// src/routes/worker-reports.ts
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, requireRole, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import * as workerReportService from '../services/worker-report.service.js';

const router = Router();
router.use(requireAuth);

// Create worker report (worker)
router.post(
  '/projects/:projectId/worker-reports',
  validate(
    z.object({
      body: z.object({
        workerId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        mediaIds: z.array(z.string()).optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const report = await workerReportService.createWorkerReport(
      String(req.params.projectId),
      req.body.workerId,
      req.body,
    );
    res.status(201).json({ data: report });
  }),
);

// Submit worker report (worker)
router.post(
  '/worker-reports/:reportId/submit',
  validate(
    z.object({
      body: z.object({
        workerId: z.string().uuid(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const report = await workerReportService.submitWorkerReport(
      String(req.params.reportId),
      req.body.workerId,
    );
    res.json({ data: report });
  }),
);

// List worker reports (staff or worker's own)
router.get(
  '/projects/:projectId/worker-reports',
  requireStaff,
  asyncHandler(async (req, res) => {
    // In a real implementation, extract actor role from req.auth
    const reports = await workerReportService.listWorkerReports(
      req.auth!.userId,
      req.auth!.role,
      String(req.params.projectId),
    );
    res.json({ data: reports });
  }),
);

// Get worker report
router.get(
  '/worker-reports/:reportId',
  asyncHandler(async (req, res) => {
    const report = await workerReportService.getWorkerReport(
      req.auth!.userId,
      req.auth!.role,
      String(req.params.reportId),
    );
    res.json({ data: report });
  }),
);

// Verify worker report (supervisor/management)
router.post(
  '/worker-reports/:reportId/verify',
  requireRole('ADMIN_MANAGEMENT', 'GENERAL_MANAGER', 'DEPARTMENT_HEAD', 'PROJECT_MANAGER', 'SITE_SUPERVISOR'),
  validate(
    z.object({
      body: z.object({
        supervisorId: z.string().uuid(),
        status: z.enum(['APPROVED', 'RETURNED']).optional(),
        comments: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req, res) => {
    const result = await workerReportService.verifyWorkerReport(
      String(req.params.reportId),
      req.body.supervisorId,
      req.body,
    );
    res.json({ data: result });
  }),
);

// Delete worker report — always denied (immutable originals)
router.delete(
  '/worker-reports/:reportId',
  asyncHandler(async (_req, res) => {
    res.status(403).json({ error: { code: 'WORKER_REPORT_IMMUTABLE', message: 'Worker report originals cannot be deleted' } });
  }),
);

export const workerReportRouter = router;
