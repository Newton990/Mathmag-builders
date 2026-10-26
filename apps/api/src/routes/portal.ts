// src/routes/portal.ts
// Read-only client portal. Every query is scoped to the signed-in client's own
// email and only returns content with an active, approved publication.
import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { actorFromRequest } from '../services/access.service.js';
import {
  getPortalProject,
  getPortalPublication,
  listPortalProjects,
} from '../services/portal.service.js';
import { IdParamSchema } from './schemas.js';
import { getParam } from './request.js';

export const portalRouter = Router();
portalRouter.use(requireAuth, requireRole(UserRole.CLIENT));

portalRouter.get(
  '/projects',
  asyncHandler(async (req, res) => {
    const result = await listPortalProjects(actorFromRequest(req));
    res.json(result);
  }),
);

portalRouter.get(
  '/projects/:id',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const project = await getPortalProject(
      actorFromRequest(req),
      getParam(req, 'id'),
    );
    res.json({ project });
  }),
);

portalRouter.get(
  '/publications/:id',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const publication = await getPortalPublication(
      actorFromRequest(req),
      getParam(req, 'id'),
    );
    res.json({ publication });
  }),
);
