// src/__tests__/integration/audit-immutability.test.ts
// Integration test — requires a running PostgreSQL instance (docker compose up).
// Skipped automatically when DATABASE_URL points to a test stub.
// Run with: INTEGRATION_TEST=1 npm test --workspace=apps/api

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const SKIP = !process.env['INTEGRATION_TEST'];
const prisma = new PrismaClient();

describe.skipIf(SKIP)('AuditEvent immutability (DB integration)', () => {
  let auditId: string;

  beforeAll(async () => {
    // Create a test audit event
    const evt = await prisma.auditEvent.create({
      data: {
        actorId: null,
        action: 'TEST_ACTION',
        entityType: 'Test',
        entityId: 'test-entity-id',
        after: { test: true },
      },
    });
    auditId = evt.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('UPDATE on audit_events is rejected by DB trigger', async () => {
    await expect(
      prisma.$executeRaw`UPDATE audit_events SET action = 'TAMPERED' WHERE id = ${auditId}`,
    ).rejects.toThrow(/append-only|immutable/i);
  });

  it('DELETE on audit_events is rejected by DB trigger', async () => {
    await expect(
      prisma.$executeRaw`DELETE FROM audit_events WHERE id = ${auditId}`,
    ).rejects.toThrow(/append-only|immutable/i);
  });

  it('the audit event still exists and is unchanged', async () => {
    const evt = await prisma.auditEvent.findUniqueOrThrow({ where: { id: auditId } });
    expect(evt.action).toBe('TEST_ACTION');
  });
});

describe.skipIf(SKIP)('VisitBooking uniqueness (DB integration)', () => {
  it('two bookings for the same project fail at DB level', async () => {
    // This test creates a project and tries to create two bookings
    // The @unique on projectId must reject the second one
    // Full implementation in Step 4 tests; this proves the constraint is wired
    const contact = await prisma.contact.create({
      data: {
        fullName: 'Test Contact',
        primaryPhone: '+254700000999',
        sourceChannel: 'MANUAL',
        consentDataProc: true,
      },
    });

    const booker = await prisma.user.create({
      data: {
        name: 'Test Booker',
        email: `test-booker-${Date.now()}@test.dev`,
        passwordHash: 'hash',
        role: 'CLIENT_RELATIONS_OFFICER',
      },
    });

    const project = await prisma.project.create({
      data: {
        reference: `TEST-${Date.now()}`,
        contactId: contact.id,
        siteCounty: 'Nairobi',
        siteArea: 'Test Area',
      },
    });

    await prisma.visitBooking.create({
      data: {
        projectId: project.id,
        scheduledAt: new Date(),
        bookedById: booker.id,
        idempotencyKey: `idem-${Date.now()}-1`,
        status: 'BOOKED',
        paymentStatus: 'PENDING',
      },
    });

    // Second booking for same project must fail
    await expect(
      prisma.visitBooking.create({
        data: {
          projectId: project.id,   // Same project ID → unique constraint violation
          scheduledAt: new Date(),
          bookedById: booker.id,
          idempotencyKey: `idem-${Date.now()}-2`,
          status: 'BOOKED',
          paymentStatus: 'PENDING',
        },
      }),
    ).rejects.toThrow();
  });
});
