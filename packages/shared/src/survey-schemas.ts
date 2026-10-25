// packages/shared/src/survey-schemas.ts
// Zod schemas for SiteSurvey sections A–G.
// These are the source of truth for both API validation and offline form storage.
// schemaVersion "1.0" — bump when adding breaking changes.

import { z } from 'zod';
import { GpsCoordinateSchema } from './types.js';

// ── Not-Available wrapper ─────────────────────────────────────────────────────
// Any field can be replaced by this to mark it as "not available / not observed".
// A reason is ALWAYS required — never silently omit data.
export const NotAvailableSchema = z.object({
  notAvailable: z.literal(true),
  reason: z.string().min(1, 'Reason is required when marking data as not available'),
});
export type NotAvailable = z.infer<typeof NotAvailableSchema>;

export function orNotAvailable<T extends z.ZodTypeAny>(schema: T) {
  return z.union([schema, NotAvailableSchema]);
}

// ── Section A: Auto-populated project snapshot ────────────────────────────────
export const SectionASchema = z.object({
  schemaVersion: z.literal('1.0').default('1.0'),
  projectReference: z.string(),
  clientName: z.string(),
  clientPhone: z.string(),
  siteCounty: z.string(),
  siteArea: z.string(),
  siteDirections: z.string().optional(),
  visitDate: z.string().datetime(),  // ISO UTC; display in Africa/Nairobi
  officerName: z.string(),
  officerEmail: z.string().email(),
});
export type SectionA = z.infer<typeof SectionASchema>;

// ── Section B: Plot configuration ────────────────────────────────────────────
export const PlotShapeEnum = z.enum(['rectangular', 'corner', 'irregular', 'other']);

export const DimensionSchema = z.object({
  side: z.string(),          // e.g. "North", "South", "East", "West", "Frontage"
  lengthM: z.number().nonnegative().optional(),
  lengthFt: z.number().nonnegative().optional(),
  note: z.string().optional(),
});

export const SectionBSchema = z.object({
  schemaVersion: z.literal('1.0').default('1.0'),
  plotShape: orNotAvailable(PlotShapeEnum),
  dimensions: orNotAvailable(z.array(DimensionSchema).min(1)),
  totalAreaSqM: z.number().nonnegative().optional(),
  roadFrontageM: orNotAvailable(z.number().nonnegative()),
  accessType: orNotAvailable(z.string()),           // e.g. "Tarmac road", "Murram road"
  adjacentDevelopments: z.string().optional(),
  existingStructures: z.string().optional(),
  treesAndObstacles: z.string().optional(),
  surveyDocKey: z.string().optional(),              // Uploaded cadastral/survey document
  gpsPin: orNotAvailable(GpsCoordinateSchema),
  gpsPinShareUrl: z.string().url().optional(),
});
export type SectionB = z.infer<typeof SectionBSchema>;

// ── Section C: Orientation, sun, wind, terrain ────────────────────────────────
// IMPORTANT labels enforced in schema:
//   sunPath  → "computed / informational" (via suncalc library, NOT measured)
//   wind     → "observed" (officer's field observation, NOT instrument reading)
//   terrain  → "preliminary" (not authoritative surveying)
export const SectionCSchema = z.object({
  schemaVersion: z.literal('1.0').default('1.0'),
  // True north offset in degrees (manual compass/map adjustment)
  compassNorthDeg: orNotAvailable(z.number().min(0).max(360)),
  // Computed from GPS + date using suncalc; labelled informational
  sunPath: orNotAvailable(z.object({
    sunrise: z.string(),
    sunset: z.string(),
    solarNoonAzimuth: z.number(),
    label: z.literal('computed / informational'),  // Enforced — never omit this
  })),
  // Officer's field observation — NOT a weather instrument reading
  windDirection: orNotAvailable(z.object({
    direction: z.string(),   // e.g. "South-westerly"
    label: z.literal('observed'),  // Enforced
    note: z.string().optional(),
  })),
  // All terrain/drainage notes are PRELIMINARY
  topography: orNotAvailable(z.string()).optional(),
  groundConditions: orNotAvailable(z.string()).optional(),
  drainageNotes: orNotAvailable(z.string()).optional(),
  waterFlowDirection: z.string().optional(),
  terrainLabel: z.literal('Preliminary field observations - not authoritative surveying').default(
    'Preliminary field observations - not authoritative surveying',
  ),
});
export type SectionC = z.infer<typeof SectionCSchema>;

// ── Section D: Photo/video register ──────────────────────────────────────────
export const SectionDSchema = z.object({
  schemaVersion: z.literal('1.0').default('1.0'),
  // References to SurveyMedia.id — actual file metadata stored in DB
  mediaIds: z.array(z.string().uuid()),
});
export type SectionD = z.infer<typeof SectionDSchema>;

// ── Section E: Sketch ────────────────────────────────────────────────────────
// Always carry the preliminary label — enforced at schema level.
export const SectionESchema = z.object({
  schemaVersion: z.literal('1.0').default('1.0'),
  // One of: canvas sketch (sketchVersionId) OR uploaded photo/PDF (uploadedKey)
  sketchVersionId: z.string().uuid().optional(),
  uploadedKey: z.string().optional(),
  // Required label — present on every sketch, no exceptions
  label: z.literal('Preliminary field sketch - not a cadastral survey').default(
    'Preliminary field sketch - not a cadastral survey',
  ),
});
export type SectionE = z.infer<typeof SectionESchema>;

// ── Section F: Client design brief ───────────────────────────────────────────
export const RoomEntrySchema = z.object({
  type: z.string(),    // e.g. "Bedroom", "Bathroom", "Kitchen", "Living room"
  quantity: z.number().int().positive(),
  note: z.string().optional(),
});

export const SectionFSchema = z.object({
  schemaVersion: z.literal('1.0').default('1.0'),
  // Client brief fields
  projectDescription: z.string().optional(),
  voiceNoteKey: z.string().optional(),     // Private storage key for voice note
  buildingType: z.string().optional(),      // e.g. "Residential", "Commercial", "Mixed-use"
  storeys: z.number().int().positive().optional(),
  rooms: z.array(RoomEntrySchema).optional(),
  stylePreferences: z.string().optional(),
  referencePhotoIds: z.array(z.string().uuid()).optional(),
  specialNeeds: z.string().optional(),
  // Budget / timeline: OPTIONAL — client may decline; store as notAvailable if so
  budgetRangeKesMin: orNotAvailable(z.number().nonnegative()).optional(),
  budgetRangeKesMax: orNotAvailable(z.number().nonnegative()).optional(),
  timeline: orNotAvailable(z.string()).optional(),
  // INTERNAL — officer's professional recommendations.
  // This box is NEVER shown to the client directly; goes into section 9 of the report.
  officerRecommendations: z.string().optional(),
});
export type SectionF = z.infer<typeof SectionFSchema>;

// ── Section G: Pre-submission review checklist ────────────────────────────────
export const ChecklistItemStatus = z.enum(['complete', 'not_available', 'not_observed']);

export const ChecklistItemSchema = z.object({
  item: z.string(),
  status: ChecklistItemStatus,
  reason: z.string().optional(), // Required when status is not "complete"
});

export const SectionGSchema = z.object({
  schemaVersion: z.literal('1.0').default('1.0'),
  completionChecklist: z.array(ChecklistItemSchema),
  officerNotes: z.string().optional(),
  // The officer explicitly signs off that all items are complete or justified
  officerConfirmedAt: z.string().datetime().optional(),
});
export type SectionG = z.infer<typeof SectionGSchema>;

// ── Full survey schema (for local draft storage) ─────────────────────────────
export const SurveyDraftSchema = z.object({
  surveyId: z.string().uuid().optional(),
  bookingId: z.string().uuid(),
  schemaVersion: z.literal('1.0').default('1.0'),
  sectionA: SectionASchema.optional(),
  sectionB: SectionBSchema.optional(),
  sectionC: SectionCSchema.optional(),
  sectionD: SectionDSchema.optional(),
  sectionE: SectionESchema.optional(),
  sectionF: SectionFSchema.optional(),
  sectionG: SectionGSchema.optional(),
  lastSavedAt: z.string().datetime().optional(),
});
export type SurveyDraft = z.infer<typeof SurveyDraftSchema>;
