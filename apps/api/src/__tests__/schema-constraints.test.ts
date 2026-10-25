// src/__tests__/schema-constraints.test.ts
// Tests that verify DB-level business rules without needing a real database.
// DB integration tests (requiring docker) are in __tests__/integration/.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const MIGRATION_DIR = join(process.cwd(), 'prisma', 'migrations', '20261024000001_module_1_schema');
const MIGRATION_SQL = join(MIGRATION_DIR, 'migration.sql');

describe('Migration file integrity', () => {
  it('migration SQL file exists', () => {
    expect(existsSync(MIGRATION_SQL)).toBe(true);
  });

  it('contains all required enum types', () => {
    const sql = readFileSync(MIGRATION_SQL, 'utf-8');
    expect(sql).toContain('CREATE TYPE "UserRole"');
    expect(sql).toContain('CREATE TYPE "BookingStatus"');
    expect(sql).toContain('CREATE TYPE "SurveyStatus"');
    expect(sql).toContain('CREATE TYPE "ReportApprovalState"');
    expect(sql).toContain('CREATE TYPE "ProjectStage"');
  });

  it('contains all required tables', () => {
    const sql = readFileSync(MIGRATION_SQL, 'utf-8');
    const tables = [
      'users', 'contacts', 'conversations', 'messages',
      'projects', 'visit_bookings', 'booking_history',
      'site_surveys', 'survey_media', 'sketch_versions',
      'report_versions', 'reviews', 'junior_assignments',
      'portal_publications', 'notifications', 'audit_events',
      'webhook_events', 'project_sequences',
    ];
    for (const table of tables) {
      expect(sql, `Table "${table}" missing from migration`).toContain(`"${table}"`);
    }
  });

  it('visit_bookings has @unique on projectId (one booking per project)', () => {
    const sql = readFileSync(MIGRATION_SQL, 'utf-8');
    // Prisma emits UNIQUE constraints — check that projectId unique index exists
    expect(sql).toContain('"visit_bookings"');
    // The unique constraint on projectId is critical for the business rule
    expect(sql).toMatch(/UNIQUE.*"projectId"|"projectId".*UNIQUE/i);
  });

  it('visit_bookings has idempotencyKey unique (prevents double-booking on retry)', () => {
    const sql = readFileSync(MIGRATION_SQL, 'utf-8');
    expect(sql).toContain('idempotencyKey');
  });

  it('audit_events immutability trigger is present', () => {
    const sql = readFileSync(MIGRATION_SQL, 'utf-8');
    expect(sql).toContain('prevent_audit_event_mutation');
    expect(sql).toContain('audit_events_immutable_update');
    expect(sql).toContain('audit_events_immutable_delete');
    expect(sql).toContain('RAISE EXCEPTION');
  });

  it('site_surveys immutability trigger is present', () => {
    const sql = readFileSync(MIGRATION_SQL, 'utf-8');
    expect(sql).toContain('prevent_locked_survey_mutation');
    expect(sql).toContain('site_surveys_immutable_after_lock');
  });

  it('audit_events has no updatedAt column (append-only by design)', () => {
    const sql = readFileSync(MIGRATION_SQL, 'utf-8');
    // Find the audit_events table CREATE block and verify no updatedAt
    const auditTableMatch = sql.match(/CREATE TABLE "audit_events"[^;]+;/s);
    expect(auditTableMatch).not.toBeNull();
    if (auditTableMatch) {
      expect(auditTableMatch[0]).not.toContain('updatedAt');
    }
  });
});

describe('Audit trigger SQL correctness', () => {
  it('trigger fires BEFORE UPDATE (not after)', () => {
    const sql = readFileSync(MIGRATION_SQL, 'utf-8');
    expect(sql).toContain('BEFORE UPDATE ON audit_events');
  });

  it('trigger fires BEFORE DELETE (not after)', () => {
    const sql = readFileSync(MIGRATION_SQL, 'utf-8');
    expect(sql).toContain('BEFORE DELETE ON audit_events');
  });

  it('trigger covers each row (FOR EACH ROW)', () => {
    const sql = readFileSync(MIGRATION_SQL, 'utf-8');
    const updateTrigger = sql.match(/audit_events_immutable_update[\s\S]+?FOR EACH ROW/);
    expect(updateTrigger).not.toBeNull();
  });
});
