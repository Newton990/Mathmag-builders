// src/services/notification.service.ts
// In-app notification records. External delivery (email/WhatsApp) is a later
// adapter; storing the event first means a delivery outage never loses a
// business notification. Failures here must not roll back the business action.
import { NotificationChannel, NotificationEvent } from '@prisma/client';
import { prisma } from '../db/client.js';
import { logger } from '../logger.js';

export interface NotifyParams {
  recipientId: string;
  event: NotificationEvent;
  entityType: string;
  entityId: string;
  title: string;
  body: string;
}

export async function notify(params: NotifyParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        event: params.event,
        entityType: params.entityType,
        entityId: params.entityId,
        title: params.title,
        body: params.body,
        channel: NotificationChannel.IN_APP,
      },
    });
  } catch (err) {
    logger.warn(
      { err: String(err), event: params.event, entityId: params.entityId },
      'Could not store in-app notification',
    );
  }
}

/** Notify the client portal user linked to a contact (matched by email). */
export async function notifyClientByEmail(
  email: string | null,
  params: Omit<NotifyParams, 'recipientId'>,
): Promise<void> {
  if (!email) return;
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, isActive: true },
      select: { id: true, role: true },
    });
    if (!user || user.role !== 'CLIENT') return;
    await notify({ ...params, recipientId: user.id });
  } catch (err) {
    logger.warn({ err: String(err) }, 'Could not resolve client portal recipient');
  }
}
