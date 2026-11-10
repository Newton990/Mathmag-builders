// packages/shared/src/survey-schemas.test.ts
import { describe, it, expect } from 'vitest';
import { SectionCSchema, SectionESchema, SectionFSchema, NotAvailableSchema } from './survey-schemas.js';

describe('NotAvailable schema', () => {
  it('requires a reason', () => {
    expect(() => NotAvailableSchema.parse({ notAvailable: true, reason: '' })).toThrow();
    expect(NotAvailableSchema.parse({ notAvailable: true, reason: 'Client declined' })).toBeTruthy();
  });
});

describe('Section C (orientation)', () => {
  it('enforces the "computed / informational" label on sunPath', () => {
    const valid = SectionCSchema.parse({
      compassNorthDeg: 15,
      sunPath: { sunrise: '06:15', sunset: '18:45', solarNoonAzimuth: 180, label: 'computed / informational' },
      windDirection: { direction: 'South-westerly', label: 'observed' },
      topography: 'Gently sloping',
      groundConditions: 'Firm red laterite',
      drainageNotes: 'Good natural drainage',
    });
    expect(valid.sunPath).not.toBeNull();
    if (valid.sunPath && 'label' in valid.sunPath) {
      expect(valid.sunPath.label).toBe('computed / informational');
    }
  });

  it('rejects wrong sunPath label', () => {
    expect(() =>
      SectionCSchema.parse({
        sunPath: { sunrise: '06:15', sunset: '18:45', solarNoonAzimuth: 180, label: 'measured' },
        windDirection: { direction: 'N', label: 'observed' },
      }),
    ).toThrow();
  });

  it('enforces "observed" label on windDirection', () => {
    expect(() =>
      SectionCSchema.parse({
        windDirection: { direction: 'North', label: 'measured by instrument' },
      }),
    ).toThrow();
  });

  it('accepts notAvailable for sunPath', () => {
    const result = SectionCSchema.parse({
      sunPath: { notAvailable: true, reason: 'GPS not available for calculation' },
      windDirection: { notAvailable: true, reason: 'Calm day, no direction discernible' },
      compassNorthDeg: { notAvailable: true, reason: 'Compass malfunction' },
    });
    expect(result).toBeTruthy();
  });
});

describe('Section E (sketch)', () => {
  it('enforces the preliminary label', () => {
    const result = SectionESchema.parse({ sketchVersionId: '00000000-0000-0000-0000-000000000001' });
    expect(result.label).toBe('Preliminary field sketch - not a cadastral survey');
  });

  it('rejects a wrong label', () => {
    expect(() =>
      SectionESchema.parse({
        sketchVersionId: '00000000-0000-0000-0000-000000000001',
        label: 'Final survey drawing',
      }),
    ).toThrow();
  });
});

describe('Section F (design brief)', () => {
  it('parses a complete brief', () => {
    const result = SectionFSchema.parse({
      projectDescription: 'A four-bedroom family home with a study',
      buildingType: 'Residential',
      storeys: 2,
      rooms: [
        { type: 'Bedroom', quantity: 4 },
        { type: 'Bathroom', quantity: 3 },
      ],
      officerRecommendations: 'Consider solar orientation for the main living area',
    });
    expect(result.rooms).toHaveLength(2);
    expect(result.officerRecommendations).toBeDefined();
  });

  it('accepts notAvailable for budget', () => {
    const result = SectionFSchema.parse({
      budgetRangeKesMin: { notAvailable: true, reason: 'Client not ready to disclose' },
    });
    expect(result.budgetRangeKesMin).toBeTruthy();
  });
});
