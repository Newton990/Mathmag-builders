// src/services/media.service.ts
// Survey media originals live in private object storage. Nothing is public:
// every read is authorized here and then exposed as a short-lived signed URL.
import { createHash, randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { MediaKind, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { extractRequestMeta, writeAudit } from './audit.service.js';
import { assertCanCaptureSurvey, getProjectAccess, type Actor } from './access.service.js';
import { buildStorageKey, getSignedUrl, putObject, removeObject } from './storage.service.js';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
]);

export interface UploadMediaInput {
  kind: MediaKind;
  category: string;
  caption?: string | undefined;
  capturedAt?: Date | undefined;
  idempotencyKey: string;
  originalName: string;
}

function extensionFor(name: string, mimeType: string): string {
  const match = /\.[a-z0-9]{1,8}$/i.exec(name);
  if (match) return match[0].toLowerCase();
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/webm': '.webm',
    'application/pdf': '.pdf',
  };
  return map[mimeType] ?? '';
}

export async function uploadSurveyMedia(
  actor: Actor,
  surveyId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  input: UploadMediaInput,
  req?: Request,
) {
  const { survey } = await assertCanCaptureSurvey(actor, surveyId);
  if (survey.lockedAt !== null) {
    throw httpError(
      'Media cannot be added to a submitted survey. Create a new version instead.',
      409,
      'SURVEY_LOCKED',
    );
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw httpError(
      `File type ${file.mimetype} is not permitted for survey evidence`,
      400,
      'UNSUPPORTED_MEDIA_TYPE',
    );
  }

  const existing = await prisma.surveyMedia.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    return { media: existing, created: false as const };
  }

  const checksum = createHash('sha256').update(file.buffer).digest('hex');
  const mediaId = randomUUID();
  const storageKey = buildStorageKey([
    'projects',
    survey.booking.projectId,
    'surveys',
    surveyId,
    'media',
    `${mediaId}${extensionFor(input.originalName, file.mimetype)}`,
  ]);

  await putObject(storageKey, file.buffer, file.mimetype, {
    'x-amz-meta-checksum': checksum,
    'x-amz-meta-survey-id': surveyId,
  });

  try {
    const media = await prisma.surveyMedia.create({
      data: {
        id: mediaId,
        surveyId,
        kind: input.kind,
        category: input.category,
        storageKey,
        checksum,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        idempotencyKey: input.idempotencyKey,
        ...(input.caption !== undefined ? { caption: input.caption } : {}),
        ...(input.capturedAt !== undefined ? { capturedAt: input.capturedAt } : {}),
      },
    });

    await writeAudit({
      actorId: actor.userId,
      action: 'SURVEY_MEDIA_UPLOADED',
      entityType: 'SurveyMedia',
      entityId: media.id,
      projectId: survey.booking.projectId,
      after: {
        surveyId,
        kind: input.kind,
        category: input.category,
        checksum,
        sizeBytes: file.size,
      },
      ...(req ? extractRequestMeta(req) : {}),
    });

    return { media, created: true as const };
  } catch (err) {
    // Keep storage and database consistent if the row could not be written.
    await removeObject(storageKey).catch(() => undefined);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const duplicate = await prisma.surveyMedia.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (duplicate) return { media: duplicate, created: false as const };
    }
    throw err;
  }
}

export async function listSurveyMedia(actor: Actor, surveyId: string) {
  const survey = await prisma.siteSurvey.findUnique({
    where: { id: surveyId },
    select: {
      id: true,
      booking: { select: { projectId: true } },
      media: { orderBy: { uploadedAt: 'asc' } },
    },
  });
  if (!survey) throw httpError('Survey not found', 404, 'SURVEY_NOT_FOUND');
  await getProjectAccess(actor, survey.booking.projectId);
  return survey.media;
}

export interface AuthorizedMedia {
  media: {
    id: string;
    surveyId: string;
    category: string;
    caption: string | null;
    kind: MediaKind;
    storageKey: string;
    previewKey: string | null;
    mimeType: string;
    checksum: string;
    sizeBytes: bigint;
  };
  projectId: string;
  viaPublicationId: string | null;
}

/**
 * A client may only read media that is explicitly included in an active
 * publication of their own project whose report version is still APPROVED.
 * Staff access follows normal project scope.
 */
export async function authorizeMediaRead(
  actor: Actor,
  mediaId: string,
): Promise<AuthorizedMedia> {
  const media = await prisma.surveyMedia.findUnique({
    where: { id: mediaId },
    include: {
      survey: {
        select: {
          booking: {
            select: {
              projectId: true,
              project: { select: { contact: { select: { email: true } } } },
            },
          },
        },
      },
      permittedPublications: {
        include: { reportVersion: { select: { approvalState: true, surveyId: true } } },
      },
    },
  });
  if (!media) throw httpError('Media not found', 404, 'MEDIA_NOT_FOUND');

  const projectId = media.survey.booking.projectId;

  if (actor.role === UserRole.CLIENT) {
    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      select: { email: true },
    });
    const contactEmail = media.survey.booking.project.contact.email;
    if (
      !user ||
      !contactEmail ||
      user.email.toLowerCase() !== contactEmail.toLowerCase()
    ) {
      throw httpError('Media not found', 404, 'MEDIA_NOT_FOUND');
    }

    const publication = media.permittedPublications.find(
      (item) =>
        item.revokedAt === null &&
        item.reportVersion.approvalState === 'APPROVED' &&
        item.reportVersion.surveyId === media.surveyId,
    );
    if (!publication) {
      throw httpError(
        'This media has not been published to your portal',
        403,
        'NOT_PUBLISHED',
      );
    }
    return {
      media,
      projectId,
      viaPublicationId: publication.id,
    };
  }

  await getProjectAccess(actor, projectId);
  return { media, projectId, viaPublicationId: null };
}

export async function getMediaDownloadUrl(actor: Actor, mediaId: string) {
  const authorized = await authorizeMediaRead(actor, mediaId);
  const url = await getSignedUrl(authorized.media.storageKey);
  return {
    mediaId: authorized.media.id,
    mimeType: authorized.media.mimeType,
    checksum: authorized.media.checksum,
    url,
  };
}
