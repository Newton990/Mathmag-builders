import { httpError } from '../middleware/errorHandler.js';

/** Enforces segregation: an actor cannot approve/verify their own request/action. */
export function assertNotSelfAction(actorId: string, ownerId: string | null | undefined, actionLabel: string): void {
  if (ownerId && actorId === ownerId) {
    throw httpError(`Self-${actionLabel} is not permitted`, 403, 'SELF_APPROVAL_FORBIDDEN');
  }
}
