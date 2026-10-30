// src/routes/publications.ts
// Explicit client publication and revocation. An approved report is NOT
// visible in the portal until one of these actions creates a publication.
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { actorFromRequest } from '../services/access.service.js';
import {
  publishReport,
  revokePublication,
} from '../services/report-workflow.service.js';
import {
  CreatePublicationSchema,
  RevokePublicationSchema,
} from './schemas.js';
import { getParam } from './request.js';

export const publicationsRouter = Router();
publicationsRouter.use(requireAuth, requireStaff);

publicationsRouter.post(
  '/',
  validate(CreatePublicationSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof CreatePublicationSchema>['body'];
    const publication = await publishReport(
      actorFromRequest(req),
      body.reportVersionId,
      body.permittedMediaIds,
      req,
    );
    res.status(201).json({ publication });
  }),
);

publicationsRouter.post(
  '/:id/revoke',
  validate(RevokePublicationSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof RevokePublicationSchema>['body'];
    const publication = await revokePublication(
      actorFromRequest(req),
      getParam(req, 'id'),
      body.reason,
      req,
    );
    res.json({ publication });
  }),
);
