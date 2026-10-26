// src/routes/projects.ts
// Persistent projects only exist after an agreed visit date. Listing is
// role-scoped inside project.service.
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { actorFromRequest } from '../services/access.service.js';
import {
  getProject,
  getProjectByConversation,
  listProjects,
} from '../services/project.service.js';
import { getOrCreateDraftSurvey, listSurveys } from '../services/survey.service.js';
import {
  assignJuniorArchitect,
  listAssignments,
  listProjectPublications,
} from '../services/report-workflow.service.js';
import {
  AssignJuniorSchema,
  IdParamSchema,
  ProjectListQuery,
} from './schemas.js';
import { getParam } from './request.js';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

projectsRouter.get(
  '/',
  validate(ProjectListQuery),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof ProjectListQuery>['query'];
    const result = await listProjects(actorFromRequest(req), {
      stage: query.stage,
      search: query.q,
      skip: query.skip,
      take: query.take,
    });
    res.json(result);
  }),
);

// Registered before /:id so the literal segment can never be mistaken for an id.
projectsRouter.get(
  '/by-conversation/:id',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const project = await getProjectByConversation(
      actorFromRequest(req),
      getParam(req, 'id'),
    );
    res.json({ project });
  }),
);

projectsRouter.get(
  '/:id',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const project = await getProject(actorFromRequest(req), getParam(req, 'id'));
    res.json({ project });
  }),
);

projectsRouter.get(
  '/:id/surveys',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const result = await listSurveys(actorFromRequest(req), getParam(req, 'id'));
    res.json(result);
  }),
);

projectsRouter.post(
  '/:id/surveys',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const result = await getOrCreateDraftSurvey(
      actorFromRequest(req),
      getParam(req, 'id'),
      req,
    );
    res.status(result.created ? 201 : 200).json(result);
  }),
);

projectsRouter.get(
  '/:id/assignments',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const items = await listAssignments(actorFromRequest(req), getParam(req, 'id'));
    res.json({ items });
  }),
);

const assignHandler = asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof AssignJuniorSchema>['body'];
  const result = await assignJuniorArchitect(
    actorFromRequest(req),
    getParam(req, 'id'),
    {
      reportVersionId: body.reportVersionId,
      juniorArchitectId: body.juniorArchitectId,
      dueDate: body.dueDate,
      priority: body.priority,
      instructions: body.instructions,
    },
    req,
  );
  res.status(result.created ? 201 : 200).json(result);
});

projectsRouter.post(
  '/:id/assignments',
  validate(AssignJuniorSchema),
  assignHandler,
);

// Alias matching the specification's endpoint name.
projectsRouter.post(
  '/:id/architectural-assignments',
  validate(AssignJuniorSchema),
  assignHandler,
);

projectsRouter.get(
  '/:id/publications',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const items = await listProjectPublications(
      actorFromRequest(req),
      getParam(req, 'id'),
    );
    res.json({ items });
  }),
);
