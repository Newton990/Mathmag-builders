// src/routes/surveys.ts
// Survey drafts, submission (immutable lock) and report generation trigger.
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { actorFromRequest } from '../services/access.service.js';
import {
  getSurvey,
  saveSurveyDraft,
  submitSurvey,
} from '../services/survey.service.js';
import { generateReportForSurvey } from '../services/report-workflow.service.js';
import { IdParamSchema, SurveyDraftPatchSchema } from './schemas.js';
import { getParam } from './request.js';

export const surveysRouter = Router();
surveysRouter.use(requireAuth, requireStaff);

surveysRouter.get(
  '/:id',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const survey = await getSurvey(actorFromRequest(req), getParam(req, 'id'));
    res.json({ survey });
  }),
);

surveysRouter.patch(
  '/:id/draft',
  validate(SurveyDraftPatchSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof SurveyDraftPatchSchema>['body'];
    const survey = await saveSurveyDraft(
      actorFromRequest(req),
      getParam(req, 'id'),
      {
        sectionB: body.sectionB,
        sectionC: body.sectionC,
        sectionD: body.sectionD,
        sectionE: body.sectionE,
        sectionF: body.sectionF,
        sectionG: body.sectionG,
      },
      req,
    );
    res.json({ survey });
  }),
);

surveysRouter.post(
  '/:id/submit',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const survey = await submitSurvey(
      actorFromRequest(req),
      getParam(req, 'id'),
      req,
    );
    res.json({ survey });
  }),
);

surveysRouter.post(
  '/:id/report',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const result = await generateReportForSurvey(
      actorFromRequest(req),
      getParam(req, 'id'),
      req,
    );
    res.status(result.created ? 201 : 200).json(result);
  }),
);
