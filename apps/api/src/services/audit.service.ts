// src/services/audit.service.ts
// Every critical action must write an audit event before returning a response.
// This service is the ONLY way to create audit events — no direct Prisma calls.
// The DB trigger prevents UPDATE/DELETE on audit_events.
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { logger } from '../logger.js';

export interface AuditParams {
  actorId: string | null; // null for system-generated events
  action: string; // e.g. 'BOOKING_CONFIRMED', 'REPORT_APPROVED'
  entityType: string; // e.g. 'Project', 'VisitBooking'
  entityId: string;
  projectId?: string | undefined;
  before?: Record<string, unknown> | null | undefined;
  after?: Record<string, unknown> | null | undefined;
  reason?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export async function writeAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditEvent.create({ data: toCreateInput(params) });
  } catch (err) {
    // Audit failure must never silently swallow — log at error level.
    // Do NOT suppress: the caller should know if audit writing fails.
    logger.error({
      msg: 'AUDIT WRITE FAILED',
      action: params.action,
      entityId: params.entityId,
      error: String(err),
    });
    throw new Error(`Audit write failed for action ${params.action}: ${String(err)}`);
  }
}

/**
 * Write an audit event inside an existing transaction. Use this for any action
 * that must atomically commit business state + its audit trail.
 */
export async function writeAuditTx(
  tx: Prisma.TransactionClient,
  params: AuditParams,
): Promise<void> {
  await tx.auditEvent.create({ data: toCreateInput(params) });
}

function toCreateInput(params: AuditParams): Prisma.AuditEventCreateInput {
  const data: Prisma.AuditEventCreateInput = {
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    reason: params.reason ?? null,
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  };

  if (params.actorId) data.actor = { connect: { id: params.actorId } };
  if (params.projectId) data.project = { connect: { id: params.projectId } };
  if (params.before != null) data.before = params.before as Prisma.InputJsonValue;
  if (params.after != null) data.after = params.after as Prisma.InputJsonValue;

  return data;
}

// Helper: extract IP and user agent from Express request
export function extractRequestMeta(req: { ip?: string; headers: Record<string, unknown> }): {
  ipAddress: string | undefined;
  userAgent: string | undefined;
} {
  return {
    ipAddress: req.ip,
    userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
  };
}

/**
 * Object-style facade kept for the auth service and other legacy call sites.
 * New code should call writeAudit()/writeAuditTx() directly.
 */
export const auditService = {
  log: writeAudit,
};

