// src/routes/reports.ts
// Generated report versions, Lead Architect review, assignment and download.
// Publication itself lives in publications.ts so approval and publication can
// never be confused.
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { actorFromRequest } from '../services/access.service.js';
import {
  getReport,
  getReportDownloadUrl,
  listReports,
  publishReport,
  reviewReport,
  submitReportForReview,
} from '../services/report-workflow.service.js';
import {
  DownloadQuery,
  IdParamSchema,
  PublishReportSchema,
  ReportListQuery,
  ReviewReportSchema,
} from './schemas.js';
import { getParam } from './request.js';

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

// Clients may download the PDF of an actively published report. The service
// re-checks ownership, publication and approval. DOCX is rejected for clients.
reportsRouter.get(
  '/:id/download',
  validate(DownloadQuery),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof DownloadQuery>['query'];
    const result = await getReportDownloadUrl(
      actorFromRequest(req),
      getParam(req, 'id'),
      query.format,
    );
    res.json(result);
  }),
);

// Every other report operation is internal.
reportsRouter.use(requireStaff);

reportsRouter.get(
  '/',
  validate(ReportListQuery),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof ReportListQuery>['query'];
    const result = await listReports(actorFromRequest(req), {
      projectId: query.projectId,
      approvalState: query.approvalState,
      skip: query.skip,
      take: query.take,
    });
    res.json(result);
  }),
);

reportsRouter.get(
  '/:id',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const report = await getReport(actorFromRequest(req), getParam(req, 'id'));
    res.json({ report });
  }),
);

reportsRouter.post(
  '/:id/submit-review',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const report = await submitReportForReview(
      actorFromRequest(req),
      getParam(req, 'id'),
      req,
    );
    res.json({ report });
  }),
);

const reviewHandler = asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof ReviewReportSchema>['body'];
  const report = await reviewReport(
    actorFromRequest(req),
    getParam(req, 'id'),
    body.decision,
    body.comments,
    req,
  );
  res.json({ report });
});

reportsRouter.post('/:id/review', validate(ReviewReportSchema), reviewHandler);
// Alias matching the specification's endpoint name.
reportsRouter.post('/:id/lead-review', validate(ReviewReportSchema), reviewHandler);

reportsRouter.post(
  '/:id/publish',
  validate(PublishReportSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof PublishReportSchema>['body'];
    const publication = await publishReport(
      actorFromRequest(req),
      getParam(req, 'id'),
      body.permittedMediaIds,
      req,
    );
    res.status(201).json({ publication });
  }),
);
