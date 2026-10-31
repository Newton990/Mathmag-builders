// packages/shared/src/enums.test.ts
import { describe, it, expect } from 'vitest';
import { UserRole, BookingStatus, SurveyStatus } from './enums.js';
import { PhoneNumberSchema } from './types.js';

describe('UserRole enum', () => {
  it('contains all expected roles', () => {
    const roles = Object.values(UserRole);
    // Module 1 core roles
    expect(roles).toContain('CLIENT_RELATIONS_OFFICER');
    expect(roles).toContain('VISITING_OFFICER');
    expect(roles).toContain('LEAD_ARCHITECT');
    expect(roles).toContain('JUNIOR_ARCHITECT');
    expect(roles).toContain('CLIENT');
    expect(roles).toContain('ADMIN_MANAGEMENT');
    // Modules 2–6 roles
    expect(roles).toContain('GENERAL_MANAGER');
    expect(roles).toContain('DEPARTMENT_HEAD');
    expect(roles).toContain('PROJECT_MANAGER');
    expect(roles).toContain('SITE_SUPERVISOR');
    expect(roles).toContain('STOREKEEPER');
    expect(roles).toContain('INDEPENDENT_AUDITOR');
    expect(roles).toContain('QUALIFIED_PROFESSIONAL');
    expect(roles).toContain('SUBCONTRACTOR');
    expect(roles).toContain('SUPPLIER');
    expect(roles).toHaveLength(15);
  });
});

describe('BookingStatus transitions', () => {
  it('has all five booking states', () => {
    expect(Object.values(BookingStatus)).toHaveLength(5);
  });
});

describe('SurveyStatus', () => {
  it('has all five survey states', () => {
    expect(Object.values(SurveyStatus)).toHaveLength(5);
  });
});

describe('PhoneNumberSchema', () => {
  it('normalises 07XX numbers to +254', () => {
    expect(PhoneNumberSchema.parse('0712345678')).toBe('+254712345678');
  });

  it('accepts already-formatted +254 numbers', () => {
    expect(PhoneNumberSchema.parse('+254712345678')).toBe('+254712345678');
  });

  it('normalises 254XXX without plus', () => {
    expect(PhoneNumberSchema.parse('254712345678')).toBe('+254712345678');
  });

  it('rejects invalid numbers', () => {
    expect(() => PhoneNumberSchema.parse('123')).toThrow();
    expect(() => PhoneNumberSchema.parse('0912345678')).toThrow();
  });

  it('strips spaces and dashes', () => {
    expect(PhoneNumberSchema.parse('0712 345 678')).toBe('+254712345678');
    expect(PhoneNumberSchema.parse('0712-345-678')).toBe('+254712345678');
  });
});
