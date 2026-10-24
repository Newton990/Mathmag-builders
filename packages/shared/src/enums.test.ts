// packages/shared/src/enums.test.ts
import { describe, it, expect } from 'vitest';
import { UserRole, BookingStatus, SurveyStatus } from './enums.js';
import { PhoneNumberSchema } from './types.js';

describe('UserRole enum', () => {
  it('has all six roles', () => {
    const roles = Object.values(UserRole);
    expect(roles).toContain('CLIENT_RELATIONS_OFFICER');
    expect(roles).toContain('VISITING_OFFICER');
    expect(roles).toContain('LEAD_ARCHITECT');
    expect(roles).toContain('JUNIOR_ARCHITECT');
    expect(roles).toContain('CLIENT');
    expect(roles).toContain('ADMIN_MANAGEMENT');
    expect(roles).toHaveLength(6);
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
