// src/routes/media.ts
// Private survey evidence. Uploads are verified and stored in the private
// bucket; every read returns a short-lived signed URL after authorization.
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { config } from '../config.js';
import { requireAuth, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { httpError } from '../middleware/errorHandler.js';
import { actorFromRequest } from '../services/access.service.js';
import {
  getMediaDownloadUrl,
  listSurveyMedia,
  uploadSurveyMedia,
} from '../services/media.service.js';
import { IdParamSchema, MediaUploadMetaSchema } from './schemas.js';
import { getParam } from './request.js';

export const mediaRouter = Router();
mediaRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_UPLOAD_SIZE_BYTES, files: 1 },
});

// Clients may read only media explicitly included in an active publication of
// their own project. authorizeMediaRead() enforces that.
mediaRouter.get(
  '/:id/download',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const result = await getMediaDownloadUrl(
      actorFromRequest(req),
      getParam(req, 'id'),
    );
    res.json(result);
  }),
);

// Uploading and listing survey evidence is internal only.
mediaRouter.use(requireStaff);

mediaRouter.post(
  '/surveys/:id',
  upload.single('file'),
  validate(MediaUploadMetaSchema),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      throw httpError('A file is required for this upload', 400, 'FILE_REQUIRED');
    }
    const body = req.body as z.infer<typeof MediaUploadMetaSchema>['body'];
    const result = await uploadSurveyMedia(
      actorFromRequest(req),
      getParam(req, 'id'),
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
      {
        kind: body.kind,
        category: body.category,
        caption: body.caption,
        capturedAt: body.capturedAt,
        idempotencyKey: body.idempotencyKey,
        originalName: file.originalname,
      },
      req,
    );
    res.status(result.created ? 201 : 200).json(result);
  }),
);

mediaRouter.get(
  '/surveys/:id',
  validate(IdParamSchema),
  asyncHandler(async (req, res) => {
    const items = await listSurveyMedia(actorFromRequest(req), getParam(req, 'id'));
    res.json({ items });
  }),
);
