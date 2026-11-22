import { z } from 'zod';
/** Kenya phone number — normalised to +254 format. */
export declare const PhoneNumberSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
export type PhoneNumber = z.infer<typeof PhoneNumberSchema>;
/** GPS coordinate with accuracy. */
export declare const GpsCoordinateSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    accuracy: z.ZodOptional<z.ZodNumber>;
    altitude: z.ZodOptional<z.ZodNumber>;
    capturedAt: z.ZodString;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
    capturedAt: string;
    accuracy?: number | undefined;
    altitude?: number | undefined;
    note?: string | undefined;
}, {
    latitude: number;
    longitude: number;
    capturedAt: string;
    accuracy?: number | undefined;
    altitude?: number | undefined;
    note?: string | undefined;
}>;
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
//# sourceMappingURL=types.d.ts.map