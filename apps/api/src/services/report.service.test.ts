// src/services/report.service.test.ts
// The generated report must never leak internal officer-only content.
import { describe, expect, it } from 'vitest';
import { buildReportLines, type ReportSource } from './report.service.js';

function source(): ReportSource {
  return {
    projectReference: 'MB-2026-001',
    clientName: 'Francis Maina',
    clientPhone: '+254712000001',
    clientEmail: 'client@example.dev',
    siteCounty: 'Nairobi',
    siteSubCounty: 'Westlands',
    siteArea: 'Loresho',
    siteDirections: 'Off Waiyaki Way',
    projectType: 'Residential',
    visitDate: new Date('2026-10-26T09:00:00.000Z'),
    officerName: 'Brian Otieno',
    surveyVersion: 1,
    reportVersion: 1,
    generatedAt: new Date('2026-10-26T12:00:00.000Z'),
    sections: {
      a: { projectReference: 'MB-2026-001' },
      b: { plotShape: 'rectangular', totalAreaSqM: 500 },
      c: { windDirection: 'NE', topography: 'gentle slope' },
      d: { mediaIds: [] },
      e: { sketchLabel: 'Preliminary field sketch - not a cadastral survey' },
      f: {
        projectDescription: 'Four-bedroom family home',
        buildingType: 'Residential',
        storeys: 2,
        // Internal-only field: must never appear in the report.
        officerRecommendations: 'INTERNAL: recommend refusing the brief',
      },
      g: {
        completionChecklist: [{ item: 'photos', status: 'complete' }],
        // Internal-only field: must never appear in the report.
        officerNotes: 'INTERNAL: client was difficult, do not quote',
      },
    },
    media: [
      {
        caption: 'Front boundary',
        category: 'plot-boundary',
        kind: 'PHOTO',
        checksum: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      },
    ],
  };
}

describe('buildReportLines', () => {
  it('includes the client-facing sections in order', () => {
    const headings = buildReportLines(source()).map((block) => block.heading);
    expect(headings).toHaveLength(6);
    expect(headings[0]).toContain('Visit and project identity');
    expect(headings[3]).toContain('Client requirements and design brief');
    expect(headings[5]).toContain('Limitations');
  });

  it('never includes internal officer notes or recommendations', () => {
    const serialized = JSON.stringify(buildReportLines(source()));
    expect(serialized).not.toContain('INTERNAL');
    expect(serialized).not.toContain('officerNotes');
    expect(serialized).not.toContain('officerRecommendations');
  });

  it('labels preliminary measurements and computed/observed data', () => {
    const serialized = JSON.stringify(buildReportLines(source()));
    expect(serialized).toContain('preliminary');
    expect(serialized).toContain('computed / informational');
    expect(serialized).toContain('observed');
    expect(serialized).toContain('not a cadastral survey');
  });

  it('records media by category and truncated checksum, never a storage key', () => {
    const serialized = JSON.stringify(buildReportLines(source()));
    expect(serialized).toContain('plot-boundary/PHOTO');
    expect(serialized).toContain('SHA-256 abcdef012345');
    expect(serialized).not.toContain('storageKey');
  });
});
