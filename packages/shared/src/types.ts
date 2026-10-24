// packages/shared/src/types.ts
// Shared TypeScript types and Zod schemas used by both API and web.
import { z } from 'zod';

/** Kenya phone number — normalised to +254 format. */
export const PhoneNumberSchema = z
  .string()
  .trim()
  .transform((val) => {
    // Strip spaces, dashes, parentheses
    const cleaned = val.replace(/[\s\-().]/g, '');
    // Already in +254 format
    if (cleaned.startsWith('+254')) return cleaned;
    // 07... or 01... → +2547... or +2541...
    if (/^0[7|1]\d{8}$/.test(cleaned)) return `+254${cleaned.slice(1)}`;
    // 254... without plus
    if (cleaned.startsWith('254') && cleaned.length === 12) return `+${cleaned}`;
    return cleaned; // Return as-is; further validation catches invalid
  })
  .refine((val) => /^\+254[7|1]\d{8}$/.test(val), {
    message: 'Phone number must be a valid Kenyan number (e.g. +254712345678)',
  });

export type PhoneNumber = z.infer<typeof PhoneNumberSchema>;

/** GPS coordinate with accuracy. */
export const GpsCoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
  altitude: z.number().optional(),
  capturedAt: z.string().datetime(),
  note: z.string().max(500).optional(),
});

export type GpsCoordinate = z.infer<typeof GpsCoordinateSchema>;

/** Paginated list response envelope. */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** Standard API success response. */
export interface ApiResponse<T = unknown> {
  data: T;
  meta?: Record<string, unknown>;
}

/** Standard API error response. */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    detail?: string;
  };
}
