// src/services/audit.service.ts
// Every critical action must call writeAudit before returning a response.
// This service is the ONLY way to create audit events — no direct Prisma calls.
// The DB trigger prevents UPDATE/DELETE on audit_events.
import { prisma } from '../db/client.js';
import { logger } from '../logger.js';

export interface AuditParams {
  actorId: string | null;     // null for system-generated events
  action: string;             // e.g. 'BOOKING_CONFIRMED', 'REPORT_APPROVED'
  entityType: string;         // e.g. 'Project', 'VisitBooking'
  entityId: string;
  projectId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        projectId: params.projectId ?? null,
        before: params.before ?? undefined,
        after: params.after ?? undefined,
        reason: params.reason ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit failure must never silently swallow — log at error level.
    // Do NOT suppress: the caller should know if audit writing fails.
    logger.error({ msg: 'AUDIT WRITE FAILED', action: params.action, entityId: params.entityId, error: String(err) });
    throw new Error(`Audit write failed for action ${params.action}: ${String(err)}`);
  }
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
