// src/lib/survey.ts
// Local form model for the A–G survey. The shared Zod schemas remain the source
// of truth: this module only supplies usable defaults, an offline draft, and a
// pre-submission validation report.
import {
  SectionBSchema,
  SectionCSchema,
  SectionDSchema,
  SectionESchema,
  SectionFSchema,
  SectionGSchema,
  type SectionB,
  type SectionC,
  type SectionD,
  type SectionE,
  type SectionF,
  type SectionG,
} from '@mbms/shared';

export interface SurveySections {
  B: SectionB;
  C: SectionC;
  D: SectionD;
  E: SectionE;
  F: SectionF;
  G: SectionG;
}

export const TERRAIN_LABEL = 'Preliminary field observations - not authoritative surveying';
export const SKETCH_LABEL = 'Preliminary field sketch - not a cadastral survey';

export const CHECKLIST_ITEMS = [
  'Client and project details verified on site',
  'Plot dimensions and boundaries recorded',
  'GPS pin captured at the site',
  'Site photographs and/or videos captured',
  'Orientation, terrain and drainage observations recorded',
  'Sketch or uploaded plan attached',
  'Client requirements and design brief recorded',
];

export const CHECKLIST_STATUSES = ['complete', 'not_available', 'not_observed'] as const;

export function defaultSections(mediaIds: string[] = []): SurveySections {
  return {
    B: {
      schemaVersion: '1.0',
      plotShape: 'rectangular',
      dimensions: [{ side: 'Frontage', lengthM: 0 }],
      totalAreaSqM: 0,
      roadFrontageM: 0,
      accessType: { notAvailable: true, reason: 'Access type not recorded yet' },
      adjacentDevelopments: '',
      existingStructures: '',
      treesAndObstacles: '',
      gpsPin: { notAvailable: true, reason: 'GPS pin not captured yet' },
    },
    C: {
      schemaVersion: '1.0',
      compassNorthDeg: 0,
      sunPath: { notAvailable: true, reason: 'Sun path not computed for this visit' },
      windDirection: { notAvailable: true, reason: 'Wind not observed' },
      topography: { notAvailable: true, reason: 'Topography not recorded yet' },
      groundConditions: { notAvailable: true, reason: 'Ground conditions not recorded yet' },
      drainageNotes: { notAvailable: true, reason: 'Drainage not recorded yet' },
      waterFlowDirection: '',
      terrainLabel: TERRAIN_LABEL,
    },
    D: { schemaVersion: '1.0', mediaIds },
    E: { schemaVersion: '1.0', label: SKETCH_LABEL },
    F: {
      schemaVersion: '1.0',
      projectDescription: '',
      buildingType: '',
      storeys: 1,
      rooms: [],
      stylePreferences: '',
      specialNeeds: '',
    },
    G: {
      schemaVersion: '1.0',
      completionChecklist: CHECKLIST_ITEMS.map((item) => ({ item, status: 'complete' as const })),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeOne<T extends object>(base: T, incoming: unknown): T {
  return isRecord(incoming) ? ({ ...base, ...incoming } as T) : base;
}

export interface IncomingSurveySections {
  sectionB: unknown;
  sectionC: unknown;
  sectionD: unknown;
  sectionE: unknown;
  sectionF: unknown;
  sectionG: unknown;
}

export function mergeSections(base: SurveySections, incoming: IncomingSurveySections): SurveySections {
  return {
    B: mergeOne(base.B, incoming.sectionB),
    C: mergeOne(base.C, incoming.sectionC),
    D: mergeOne(base.D, incoming.sectionD),
    E: mergeOne(base.E, incoming.sectionE),
    F: mergeOne(base.F, incoming.sectionF),
    G: mergeOne(base.G, incoming.sectionG),
  };
}

export function toDraftPayload(sections: SurveySections): Record<string, unknown> {
  return {
    sectionB: sections.B,
    sectionC: sections.C,
    sectionD: sections.D,
    sectionE: sections.E,
    sectionF: sections.F,
    sectionG: sections.G,
  };
}

interface SafeParser {
  safeParse: (value: unknown) => {
    success: boolean;
    error?: { issues: Array<{ path: Array<string | number>; message: string }> };
  };
}

export function validateSections(sections: SurveySections): string[] {
  const checks: Array<{ key: keyof SurveySections; label: string; schema: SafeParser }> = [
    { key: 'B', label: 'Section B', schema: SectionBSchema },
    { key: 'C', label: 'Section C', schema: SectionCSchema },
    { key: 'D', label: 'Section D', schema: SectionDSchema },
    { key: 'E', label: 'Section E', schema: SectionESchema },
    { key: 'F', label: 'Section F', schema: SectionFSchema },
    { key: 'G', label: 'Section G', schema: SectionGSchema },
  ];

  const problems: string[] = [];
  for (const check of checks) {
    const result = check.schema.safeParse(sections[check.key]);
    if (!result.success) {
      const issues = result.error?.issues ?? [];
      for (const issue of issues.slice(0, 4)) {
        problems.push(`${check.label}: ${issue.path.join('.') || 'value'} — ${issue.message}`);
      }
    }
  }

  const checklist = sections.G.completionChecklist;
  if (checklist.length === 0) {
    problems.push('Section G: complete the pre-submission checklist');
  }
  for (const item of checklist) {
    if (item.status !== 'complete' && !item.reason?.trim()) {
      problems.push(`Section G: a reason is required for "${item.item}"`);
    }
  }
  if (!sections.G.officerConfirmedAt) {
    problems.push('Section G: confirm the checklist before submitting');
  }
  return problems;
}

// ── Offline draft ────────────────────────────────────────────────────────────

interface StoredDraft {
  savedAt: string;
  sections: SurveySections;
}

function draftKey(surveyId: string): string {
  return `mbms.surveyDraft.${surveyId}`;
}

export function loadLocalDraft(surveyId: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(surveyId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || typeof parsed['savedAt'] !== 'string' || !isRecord(parsed['sections'])) {
      return null;
    }
    return {
      savedAt: parsed['savedAt'],
      sections: parsed['sections'] as unknown as SurveySections,
    };
  } catch {
    return null;
  }
}

export function saveLocalDraft(surveyId: string, sections: SurveySections): void {
  try {
    const draft: StoredDraft = { savedAt: new Date().toISOString(), sections };
    window.localStorage.setItem(draftKey(surveyId), JSON.stringify(draft));
  } catch {
    // A full or unavailable localStorage must not block the form.
  }
}

export function clearLocalDraft(surveyId: string): void {
  try {
    window.localStorage.removeItem(draftKey(surveyId));
  } catch {
    // Ignore storage failures.
  }
}
