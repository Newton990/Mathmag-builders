// src/services/conversation.service.ts
// Communications inbox. Conversations are leads, never projects. A project is
// only created by project.service.confirmVisitBooking().
import {
  ConversationStatus,
  Prisma,
  SourceChannel,
  UserRole,
} from '@prisma/client';
import { prisma } from '../db/client.js';
import { httpError } from '../middleware/errorHandler.js';
import { extractRequestMeta, writeAudit } from './audit.service.js';
import type { Request } from 'express';
import { assertStaff, type Actor } from './access.service.js';

export interface ContactInput {
  fullName: string;
  primaryPhone: string;
  organisation?: string | undefined;
  alternatePhone?: string | undefined;
  email?: string | undefined;
  sourceChannel?: SourceChannel | undefined;
  consentMarketing?: boolean | undefined;
  consentDataProc?: boolean | undefined;
  notes?: string | undefined;
}

export async function findOrCreateContact(input: ContactInput) {
  const or: Prisma.ContactWhereInput[] = [{ primaryPhone: input.primaryPhone }];
  if (input.email) {
    or.push({ email: { equals: input.email, mode: 'insensitive' } });
  }

  const existing = await prisma.contact.findFirst({
    where: { OR: or },
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    return prisma.contact.update({
      where: { id: existing.id },
      data: {
        ...(input.organisation !== undefined ? { organisation: input.organisation } : {}),
        ...(input.alternatePhone !== undefined
          ? { alternatePhone: input.alternatePhone }
          : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.consentMarketing !== undefined
          ? { consentMarketing: input.consentMarketing }
          : {}),
        ...(input.consentDataProc !== undefined
          ? { consentDataProc: input.consentDataProc }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
  }

  return prisma.contact.create({
    data: {
      fullName: input.fullName,
      primaryPhone: input.primaryPhone,
      sourceChannel: input.sourceChannel ?? SourceChannel.MANUAL,
      ...(input.organisation !== undefined ? { organisation: input.organisation } : {}),
      ...(input.alternatePhone !== undefined ? { alternatePhone: input.alternatePhone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.consentMarketing !== undefined
        ? { consentMarketing: input.consentMarketing }
        : {}),
      ...(input.consentDataProc !== undefined
        ? { consentDataProc: input.consentDataProc }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

export interface CreateConversationInput {
  contactId?: string | undefined;
  contact?: ContactInput | undefined;
  channel: SourceChannel;
  subject?: string | undefined;
  assignedStaffId?: string | undefined;
  externalThreadId?: string | undefined;
  initialMessage?: string | undefined;
  followUpAt?: Date | undefined;
}

export async function createConversation(
  actor: Actor,
  input: CreateConversationInput,
  req?: Request,
) {
  assertStaff(actor);
  if (!input.contactId && !input.contact) {
    throw httpError('A contactId or contact details are required', 400, 'CONTACT_REQUIRED');
  }

  const contact =
    input.contactId !== undefined
      ? await prisma.contact.findUnique({ where: { id: input.contactId } })
      : await findOrCreateContact(input.contact!);

  if (!contact) {
    throw httpError('Contact not found', 404, 'CONTACT_NOT_FOUND');
  }

  if (input.assignedStaffId) {
    const assignee = await prisma.user.findUnique({
      where: { id: input.assignedStaffId },
      select: { id: true, role: true, isActive: true },
    });
    if (!assignee || !assignee.isActive || assignee.role === UserRole.CLIENT) {
      throw httpError('Assigned staff member is not an active staff user', 400, 'INVALID_ASSIGNEE');
    }
  }

  try {
    const conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
        channel: input.channel,
        ...(input.subject !== undefined ? { subject: input.subject } : {}),
        ...(input.assignedStaffId !== undefined
          ? { assignedStaffId: input.assignedStaffId }
          : {}),
        ...(input.externalThreadId !== undefined
          ? { externalThreadId: input.externalThreadId }
          : {}),
        ...(input.followUpAt !== undefined ? { followUpAt: input.followUpAt } : {}),
      },
    });

    if (input.initialMessage) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          authorId: actor.userId,
          content: input.initialMessage,
        },
      });
    }

    await writeAudit({
      actorId: actor.userId,
      action: 'CONVERSATION_CREATED',
      entityType: 'Conversation',
      entityId: conversation.id,
      after: {
        channel: conversation.channel,
        contactId: contact.id,
        subject: conversation.subject,
      },
      ...(req ? extractRequestMeta(req) : {}),
    });

    return conversation;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw httpError(
        'This external conversation has already been imported',
        409,
        'DUPLICATE_CONVERSATION',
      );
    }
    throw err;
  }
}

export interface ListConversationsFilter {
  status?: ConversationStatus | undefined;
  assignedStaffId?: string | undefined;
  search?: string | undefined;
  skip?: number | undefined;
  take?: number | undefined;
}

export async function listConversations(actor: Actor, filter: ListConversationsFilter) {
  assertStaff(actor);
  const where: Prisma.ConversationWhereInput = {
    ...(filter.status !== undefined ? { status: filter.status } : {}),
    ...(filter.assignedStaffId !== undefined
      ? { assignedStaffId: filter.assignedStaffId }
      : {}),
    ...(filter.search
      ? {
          OR: [
            { contact: { fullName: { contains: filter.search, mode: 'insensitive' } } },
            { contact: { primaryPhone: { contains: filter.search } } },
            { subject: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        contact: true,
        assignedStaff: { select: { id: true, name: true, role: true } },
        linkedProject: { select: { id: true, reference: true, currentStage: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { lastActivityAt: 'desc' },
      skip: filter.skip ?? 0,
      take: Math.min(filter.take ?? 50, 200),
    }),
    prisma.conversation.count({ where }),
  ]);

  return { items, total };
}

export async function getConversation(actor: Actor, conversationId: string) {
  assertStaff(actor);
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      contact: true,
      assignedStaff: { select: { id: true, name: true, role: true } },
      linkedProject: {
        select: { id: true, reference: true, currentStage: true },
      },
      messages: {
        orderBy: { sentAt: 'asc' },
        include: { author: { select: { id: true, name: true, role: true } } },
      },
    },
  });
  if (!conversation) {
    throw httpError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }
  return conversation;
}

export async function addMessage(
  actor: Actor,
  conversationId: string,
  content: string,
  isNote: boolean,
  req?: Request,
) {
  assertStaff(actor);
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, status: true },
  });
  if (!conversation) {
    throw httpError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }
  if (conversation.status === ConversationStatus.CLOSED) {
    throw httpError('Closed conversations cannot receive messages', 409, 'CONVERSATION_CLOSED');
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId,
        authorId: actor.userId,
        content,
        isNote,
      },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastActivityAt: new Date(),
        status:
          conversation.status === ConversationStatus.OPEN
            ? ConversationStatus.IN_DISCUSSION
            : conversation.status,
      },
    });
    await writeAudit({
      actorId: actor.userId,
      action: 'CONVERSATION_MESSAGE_ADDED',
      entityType: 'Conversation',
      entityId: conversationId,
      after: { messageId: created.id, isNote },
      ...(req ? extractRequestMeta(req) : {}),
    });
    return created;
  });

  return message;
}

export async function updateConversation(
  actor: Actor,
  conversationId: string,
  patch: {
    assignedStaffId?: string | null | undefined;
    status?: ConversationStatus | undefined;
    subject?: string | undefined;
    followUpAt?: Date | null | undefined;
  },
  req?: Request,
) {
  assertStaff(actor);
  const before = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!before) {
    throw httpError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
  }

  if (patch.assignedStaffId) {
    const assignee = await prisma.user.findUnique({
      where: { id: patch.assignedStaffId },
      select: { role: true, isActive: true },
    });
    if (!assignee || !assignee.isActive || assignee.role === UserRole.CLIENT) {
      throw httpError('Assigned staff member is not an active staff user', 400, 'INVALID_ASSIGNEE');
    }
  }

  if (patch.status === ConversationStatus.LINKED_TO_PROJECT && !before.linkedProjectId) {
    throw httpError(
      'A conversation becomes LINKED_TO_PROJECT only when a booking is confirmed',
      409,
      'PROJECT_LINK_REQUIRED',
    );
  }

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      ...(patch.assignedStaffId !== undefined
        ? { assignedStaffId: patch.assignedStaffId }
        : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.subject !== undefined ? { subject: patch.subject } : {}),
      ...(patch.followUpAt !== undefined ? { followUpAt: patch.followUpAt } : {}),
      lastActivityAt: new Date(),
    },
  });

  await writeAudit({
    actorId: actor.userId,
    action: 'CONVERSATION_UPDATED',
    entityType: 'Conversation',
    entityId: conversationId,
    before: {
      status: before.status,
      assignedStaffId: before.assignedStaffId,
      subject: before.subject,
    },
    after: {
      status: updated.status,
      assignedStaffId: updated.assignedStaffId,
      subject: updated.subject,
    },
    ...(req ? extractRequestMeta(req) : {}),
  });

  return updated;
}
