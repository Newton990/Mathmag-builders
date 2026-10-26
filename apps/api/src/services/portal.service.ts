// src/services/portal.service.ts
// Client portal read model. Clients see only their own project and only
// content that the Lead Architect explicitly published. Approved-but-unpublished
// reports are invisible here by construction.
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import type { Actor } from './access.service.js';

async function clientContext(actor: Actor) {
  if (actor.role !== UserRole.CLIENT) {
    throw httpError('Client portal access requires a client account', 403, 'CLIENT_ONLY');
  }
  const user = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: { email: true, name: true, isActive: true },
  });
  if (!user || !user.isActive) {
    throw httpError('Account is not active', 403, 'ACCOUNT_INACTIVE');
  }
  return user;
}

function clientProjectWhere(email: string): Prisma.ProjectWhereInput {
  return { contact: { email: { equals: email, mode: 'insensitive' } } };
}

function activePublicationWhere(now = new Date()): Prisma.PortalPublicationWhereInput {
  return { revokedAt: null, publishedAt: { lte: now } };
}

export async function listPortalProjects(actor: Actor) {
  const user = await clientContext(actor);
  const projects = await prisma.project.findMany({
    where: clientProjectWhere(user.email),
    select: {
      id: true,
      reference: true,
      siteCounty: true,
      siteArea: true,
      projectType: true,
      currentStage: true,
      createdAt: true,
      visitBooking: {
        select: {
          scheduledAt: true,
          status: true,
          assignedOfficer: { select: { name: true } },
        },
      },
      contact: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = await Promise.all(
    projects.map(async (project) => {
      const publication = await prisma.portalPublication.findFirst({
        where: {
          ...activePublicationWhere(),
          reportVersion: {
            approvalState: 'APPROVED',
            survey: { booking: { projectId: project.id } },
          },
        },
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          publishedAt: true,
          reportVersion: {
            select: {
              id: true,
              versionNumber: true,
              approvedAt: true,
            },
          },
          _count: { select: { permittedMedia: true } },
        },
      });
      return {
        ...project,
        publication,
        hasPublishedReport: publication !== null,
      };
    }),
  );

  return { items: enriched, total: enriched.length };
}

async function loadOwnedProject(actor: Actor, projectId: string) {
  const user = await clientContext(actor);
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...clientProjectWhere(user.email) },
    select: {
      id: true,
      reference: true,
      siteCounty: true,
      siteSubCounty: true,
      siteArea: true,
      siteDirections: true,
      projectType: true,
      siteDescription: true,
      currentStage: true,
      createdAt: true,
      contact: { select: { fullName: true, primaryPhone: true, email: true } },
      visitBooking: {
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          paymentStatus: true,
          visitFeeKes: true,
          assignedOfficer: { select: { name: true } },
        },
      },
    },
  });
  if (!project) {
    // Deliberately 404: never confirm that another client's project exists.
    throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }
  return project;
}

export async function getPortalProject(actor: Actor, projectId: string) {
  const project = await loadOwnedProject(actor, projectId);

  const publication = await prisma.portalPublication.findFirst({
    where: {
      ...activePublicationWhere(),
      reportVersion: {
        approvalState: 'APPROVED',
        survey: { booking: { projectId: project.id } },
      },
      ...(project.visitBooking
        ? {}
        : {}),
    },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      publishedAt: true,
      reportVersion: {
        select: {
          id: true,
          versionNumber: true,
          approvedAt: true,
          generatedAt: true,
          pdfKey: true,
        },
      },
      // Only explicitly permitted media metadata — never storage keys.
      permittedMedia: {
        select: {
          id: true,
          kind: true,
          category: true,
          caption: true,
          mimeType: true,
          capturedAt: true,
        },
        orderBy: { uploadedAt: 'asc' },
      },
    },
  });

  return {
    ...project,
    publication: publication
      ? {
          ...publication,
          reportVersion: {
            id: publication.reportVersion.id,
            versionNumber: publication.reportVersion.versionNumber,
            approvedAt: publication.reportVersion.approvedAt,
            generatedAt: publication.reportVersion.generatedAt,
            hasPdf: publication.reportVersion.pdfKey !== null,
          },
        }
      : null,
  };
}

export async function getPortalPublication(actor: Actor, publicationId: string) {
  const user = await clientContext(actor);
  const publication = await prisma.portalPublication.findFirst({
    where: {
      id: publicationId,
      ...activePublicationWhere(),
      reportVersion: {
        approvalState: 'APPROVED',
        survey: {
          booking: {
            project: { contact: { email: { equals: user.email, mode: 'insensitive' } } },
          },
        },
      },
    },
    select: {
      id: true,
      publishedAt: true,
      reportVersion: {
        select: {
          id: true,
          versionNumber: true,
          approvedAt: true,
          generatedAt: true,
          pdfKey: true,
          survey: {
            select: {
              booking: {
                select: {
                  scheduledAt: true,
                  project: {
                    select: { id: true, reference: true, siteCounty: true, siteArea: true },
                  },
                },
              },
            },
          },
        },
      },
      permittedMedia: {
        select: {
          id: true,
          kind: true,
          category: true,
          caption: true,
          mimeType: true,
          capturedAt: true,
        },
        orderBy: { uploadedAt: 'asc' },
      },
    },
  });
  if (!publication) throw httpError('Publication not found', 404, 'PUBLICATION_NOT_FOUND');
  return {
    ...publication,
    reportVersion: {
      ...publication.reportVersion,
      hasPdf: publication.reportVersion.pdfKey !== null,
      pdfKey: undefined,
    },
  };
}
