import { z } from 'zod';
export declare const NotAvailableSchema: z.ZodObject<{
    notAvailable: z.ZodLiteral<true>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    notAvailable: true;
    reason: string;
}, {
    notAvailable: true;
    reason: string;
}>;
export type NotAvailable = z.infer<typeof NotAvailableSchema>;
export declare function orNotAvailable<T extends z.ZodTypeAny>(schema: T): z.ZodUnion<[T, z.ZodObject<{
    notAvailable: z.ZodLiteral<true>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    notAvailable: true;
    reason: string;
}, {
    notAvailable: true;
    reason: string;
}>]>;
export declare const SectionASchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
    projectReference: z.ZodString;
    clientName: z.ZodString;
    clientPhone: z.ZodString;
    siteCounty: z.ZodString;
    siteArea: z.ZodString;
    siteDirections: z.ZodOptional<z.ZodString>;
    visitDate: z.ZodString;
    officerName: z.ZodString;
    officerEmail: z.ZodString;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    projectReference: string;
    clientName: string;
    clientPhone: string;
    siteCounty: string;
    siteArea: string;
    visitDate: string;
    officerName: string;
    officerEmail: string;
    siteDirections?: string | undefined;
}, {
    projectReference: string;
    clientName: string;
    clientPhone: string;
    siteCounty: string;
    siteArea: string;
    visitDate: string;
    officerName: string;
    officerEmail: string;
    schemaVersion?: "1.0" | undefined;
    siteDirections?: string | undefined;
}>;
export type SectionA = z.infer<typeof SectionASchema>;
export declare const PlotShapeEnum: z.ZodEnum<["rectangular", "corner", "irregular", "other"]>;
export declare const DimensionSchema: z.ZodObject<{
    side: z.ZodString;
    lengthM: z.ZodOptional<z.ZodNumber>;
    lengthFt: z.ZodOptional<z.ZodNumber>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    side: string;
    note?: string | undefined;
    lengthM?: number | undefined;
    lengthFt?: number | undefined;
}, {
    side: string;
    note?: string | undefined;
    lengthM?: number | undefined;
    lengthFt?: number | undefined;
}>;
export declare const SectionBSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
    plotShape: z.ZodUnion<[z.ZodEnum<["rectangular", "corner", "irregular", "other"]>, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>;
    dimensions: z.ZodUnion<[z.ZodArray<z.ZodObject<{
        side: z.ZodString;
        lengthM: z.ZodOptional<z.ZodNumber>;
        lengthFt: z.ZodOptional<z.ZodNumber>;
        note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        side: string;
        note?: string | undefined;
        lengthM?: number | undefined;
        lengthFt?: number | undefined;
    }, {
        side: string;
        note?: string | undefined;
        lengthM?: number | undefined;
        lengthFt?: number | undefined;
    }>, "many">, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>;
    totalAreaSqM: z.ZodOptional<z.ZodNumber>;
    roadFrontageM: z.ZodUnion<[z.ZodNumber, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>;
    accessType: z.ZodUnion<[z.ZodString, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>;
    adjacentDevelopments: z.ZodOptional<z.ZodString>;
    existingStructures: z.ZodOptional<z.ZodString>;
    treesAndObstacles: z.ZodOptional<z.ZodString>;
    surveyDocKey: z.ZodOptional<z.ZodString>;
    gpsPin: z.ZodUnion<[z.ZodObject<{
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
    }>, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>;
    gpsPinShareUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    plotShape: {
        notAvailable: true;
        reason: string;
    } | "rectangular" | "corner" | "irregular" | "other";
    dimensions: {
        notAvailable: true;
        reason: string;
    } | {
        side: string;
        note?: string | undefined;
        lengthM?: number | undefined;
        lengthFt?: number | undefined;
    }[];
    roadFrontageM: number | {
        notAvailable: true;
        reason: string;
    };
    accessType: string | {
        notAvailable: true;
        reason: string;
    };
    gpsPin: {
        latitude: number;
        longitude: number;
        capturedAt: string;
        accuracy?: number | undefined;
        altitude?: number | undefined;
        note?: string | undefined;
    } | {
        notAvailable: true;
        reason: string;
    };
    totalAreaSqM?: number | undefined;
    adjacentDevelopments?: string | undefined;
    existingStructures?: string | undefined;
    treesAndObstacles?: string | undefined;
    surveyDocKey?: string | undefined;
    gpsPinShareUrl?: string | undefined;
}, {
    plotShape: {
        notAvailable: true;
        reason: string;
    } | "rectangular" | "corner" | "irregular" | "other";
    dimensions: {
        notAvailable: true;
        reason: string;
    } | {
        side: string;
        note?: string | undefined;
        lengthM?: number | undefined;
        lengthFt?: number | undefined;
    }[];
    roadFrontageM: number | {
        notAvailable: true;
        reason: string;
    };
    accessType: string | {
        notAvailable: true;
        reason: string;
    };
    gpsPin: {
        latitude: number;
        longitude: number;
        capturedAt: string;
        accuracy?: number | undefined;
        altitude?: number | undefined;
        note?: string | undefined;
    } | {
        notAvailable: true;
        reason: string;
    };
    schemaVersion?: "1.0" | undefined;
    totalAreaSqM?: number | undefined;
    adjacentDevelopments?: string | undefined;
    existingStructures?: string | undefined;
    treesAndObstacles?: string | undefined;
    surveyDocKey?: string | undefined;
    gpsPinShareUrl?: string | undefined;
}>;
export type SectionB = z.infer<typeof SectionBSchema>;
export declare const SectionCSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
    compassNorthDeg: z.ZodUnion<[z.ZodNumber, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>;
    sunPath: z.ZodUnion<[z.ZodObject<{
        sunrise: z.ZodString;
        sunset: z.ZodString;
        solarNoonAzimuth: z.ZodNumber;
        label: z.ZodLiteral<"computed / informational">;
    }, "strip", z.ZodTypeAny, {
        sunrise: string;
        sunset: string;
        solarNoonAzimuth: number;
        label: "computed / informational";
    }, {
        sunrise: string;
        sunset: string;
        solarNoonAzimuth: number;
        label: "computed / informational";
    }>, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>;
    windDirection: z.ZodUnion<[z.ZodObject<{
        direction: z.ZodString;
        label: z.ZodLiteral<"observed">;
        note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label: "observed";
        direction: string;
        note?: string | undefined;
    }, {
        label: "observed";
        direction: string;
        note?: string | undefined;
    }>, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>;
    topography: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>>;
    groundConditions: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>>;
    drainageNotes: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>>;
    waterFlowDirection: z.ZodOptional<z.ZodString>;
    terrainLabel: z.ZodDefault<z.ZodLiteral<"Preliminary field observations - not authoritative surveying">>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    compassNorthDeg: number | {
        notAvailable: true;
        reason: string;
    };
    sunPath: {
        notAvailable: true;
        reason: string;
    } | {
        sunrise: string;
        sunset: string;
        solarNoonAzimuth: number;
        label: "computed / informational";
    };
    windDirection: {
        notAvailable: true;
        reason: string;
    } | {
        label: "observed";
        direction: string;
        note?: string | undefined;
    };
    terrainLabel: "Preliminary field observations - not authoritative surveying";
    topography?: string | {
        notAvailable: true;
        reason: string;
    } | undefined;
    groundConditions?: string | {
        notAvailable: true;
        reason: string;
    } | undefined;
    drainageNotes?: string | {
        notAvailable: true;
        reason: string;
    } | undefined;
    waterFlowDirection?: string | undefined;
}, {
    compassNorthDeg: number | {
        notAvailable: true;
        reason: string;
    };
    sunPath: {
        notAvailable: true;
        reason: string;
    } | {
        sunrise: string;
        sunset: string;
        solarNoonAzimuth: number;
        label: "computed / informational";
    };
    windDirection: {
        notAvailable: true;
        reason: string;
    } | {
        label: "observed";
        direction: string;
        note?: string | undefined;
    };
    schemaVersion?: "1.0" | undefined;
    topography?: string | {
        notAvailable: true;
        reason: string;
    } | undefined;
    groundConditions?: string | {
        notAvailable: true;
        reason: string;
    } | undefined;
    drainageNotes?: string | {
        notAvailable: true;
        reason: string;
    } | undefined;
    waterFlowDirection?: string | undefined;
    terrainLabel?: "Preliminary field observations - not authoritative surveying" | undefined;
}>;
export type SectionC = z.infer<typeof SectionCSchema>;
export declare const SectionDSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
    mediaIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    mediaIds: string[];
}, {
    mediaIds: string[];
    schemaVersion?: "1.0" | undefined;
}>;
export type SectionD = z.infer<typeof SectionDSchema>;
export declare const SectionESchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
    sketchVersionId: z.ZodOptional<z.ZodString>;
    uploadedKey: z.ZodOptional<z.ZodString>;
    label: z.ZodDefault<z.ZodLiteral<"Preliminary field sketch - not a cadastral survey">>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    label: "Preliminary field sketch - not a cadastral survey";
    sketchVersionId?: string | undefined;
    uploadedKey?: string | undefined;
}, {
    schemaVersion?: "1.0" | undefined;
    label?: "Preliminary field sketch - not a cadastral survey" | undefined;
    sketchVersionId?: string | undefined;
    uploadedKey?: string | undefined;
}>;
export type SectionE = z.infer<typeof SectionESchema>;
export declare const RoomEntrySchema: z.ZodObject<{
    type: z.ZodString;
    quantity: z.ZodNumber;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    quantity: number;
    note?: string | undefined;
}, {
    type: string;
    quantity: number;
    note?: string | undefined;
}>;
export declare const SectionFSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
    projectDescription: z.ZodOptional<z.ZodString>;
    voiceNoteKey: z.ZodOptional<z.ZodString>;
    buildingType: z.ZodOptional<z.ZodString>;
    storeys: z.ZodOptional<z.ZodNumber>;
    rooms: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        quantity: z.ZodNumber;
        note: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        quantity: number;
        note?: string | undefined;
    }, {
        type: string;
        quantity: number;
        note?: string | undefined;
    }>, "many">>;
    stylePreferences: z.ZodOptional<z.ZodString>;
    referencePhotoIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    specialNeeds: z.ZodOptional<z.ZodString>;
    budgetRangeKesMin: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>>;
    budgetRangeKesMax: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>>;
    timeline: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        notAvailable: z.ZodLiteral<true>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        notAvailable: true;
        reason: string;
    }, {
        notAvailable: true;
        reason: string;
    }>]>>;
    officerRecommendations: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    projectDescription?: string | undefined;
    voiceNoteKey?: string | undefined;
    buildingType?: string | undefined;
    storeys?: number | undefined;
    rooms?: {
        type: string;
        quantity: number;
        note?: string | undefined;
    }[] | undefined;
    stylePreferences?: string | undefined;
    referencePhotoIds?: string[] | undefined;
    specialNeeds?: string | undefined;
    budgetRangeKesMin?: number | {
        notAvailable: true;
        reason: string;
    } | undefined;
    budgetRangeKesMax?: number | {
        notAvailable: true;
        reason: string;
    } | undefined;
    timeline?: string | {
        notAvailable: true;
        reason: string;
    } | undefined;
    officerRecommendations?: string | undefined;
}, {
    schemaVersion?: "1.0" | undefined;
    projectDescription?: string | undefined;
    voiceNoteKey?: string | undefined;
    buildingType?: string | undefined;
    storeys?: number | undefined;
    rooms?: {
        type: string;
        quantity: number;
        note?: string | undefined;
    }[] | undefined;
    stylePreferences?: string | undefined;
    referencePhotoIds?: string[] | undefined;
    specialNeeds?: string | undefined;
    budgetRangeKesMin?: number | {
        notAvailable: true;
        reason: string;
    } | undefined;
    budgetRangeKesMax?: number | {
        notAvailable: true;
        reason: string;
    } | undefined;
    timeline?: string | {
        notAvailable: true;
        reason: string;
    } | undefined;
    officerRecommendations?: string | undefined;
}>;
export type SectionF = z.infer<typeof SectionFSchema>;
export declare const ChecklistItemStatus: z.ZodEnum<["complete", "not_available", "not_observed"]>;
export declare const ChecklistItemSchema: z.ZodObject<{
    item: z.ZodString;
    status: z.ZodEnum<["complete", "not_available", "not_observed"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "complete" | "not_available" | "not_observed";
    item: string;
    reason?: string | undefined;
}, {
    status: "complete" | "not_available" | "not_observed";
    item: string;
    reason?: string | undefined;
}>;
export declare const SectionGSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
    completionChecklist: z.ZodArray<z.ZodObject<{
        item: z.ZodString;
        status: z.ZodEnum<["complete", "not_available", "not_observed"]>;
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "complete" | "not_available" | "not_observed";
        item: string;
        reason?: string | undefined;
    }, {
        status: "complete" | "not_available" | "not_observed";
        item: string;
        reason?: string | undefined;
    }>, "many">;
    officerNotes: z.ZodOptional<z.ZodString>;
    officerConfirmedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    completionChecklist: {
        status: "complete" | "not_available" | "not_observed";
        item: string;
        reason?: string | undefined;
    }[];
    officerNotes?: string | undefined;
    officerConfirmedAt?: string | undefined;
}, {
    completionChecklist: {
        status: "complete" | "not_available" | "not_observed";
        item: string;
        reason?: string | undefined;
    }[];
    schemaVersion?: "1.0" | undefined;
    officerNotes?: string | undefined;
    officerConfirmedAt?: string | undefined;
}>;
export type SectionG = z.infer<typeof SectionGSchema>;
export declare const SurveyDraftSchema: z.ZodObject<{
    surveyId: z.ZodOptional<z.ZodString>;
    bookingId: z.ZodString;
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
    sectionA: z.ZodOptional<z.ZodObject<{
        schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
        projectReference: z.ZodString;
        clientName: z.ZodString;
        clientPhone: z.ZodString;
        siteCounty: z.ZodString;
        siteArea: z.ZodString;
        siteDirections: z.ZodOptional<z.ZodString>;
        visitDate: z.ZodString;
        officerName: z.ZodString;
        officerEmail: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        schemaVersion: "1.0";
        projectReference: string;
        clientName: string;
        clientPhone: string;
        siteCounty: string;
        siteArea: string;
        visitDate: string;
        officerName: string;
        officerEmail: string;
        siteDirections?: string | undefined;
    }, {
        projectReference: string;
        clientName: string;
        clientPhone: string;
        siteCounty: string;
        siteArea: string;
        visitDate: string;
        officerName: string;
        officerEmail: string;
        schemaVersion?: "1.0" | undefined;
        siteDirections?: string | undefined;
    }>>;
    sectionB: z.ZodOptional<z.ZodObject<{
        schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
        plotShape: z.ZodUnion<[z.ZodEnum<["rectangular", "corner", "irregular", "other"]>, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>;
        dimensions: z.ZodUnion<[z.ZodArray<z.ZodObject<{
            side: z.ZodString;
            lengthM: z.ZodOptional<z.ZodNumber>;
            lengthFt: z.ZodOptional<z.ZodNumber>;
            note: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            side: string;
            note?: string | undefined;
            lengthM?: number | undefined;
            lengthFt?: number | undefined;
        }, {
            side: string;
            note?: string | undefined;
            lengthM?: number | undefined;
            lengthFt?: number | undefined;
        }>, "many">, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>;
        totalAreaSqM: z.ZodOptional<z.ZodNumber>;
        roadFrontageM: z.ZodUnion<[z.ZodNumber, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>;
        accessType: z.ZodUnion<[z.ZodString, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>;
        adjacentDevelopments: z.ZodOptional<z.ZodString>;
        existingStructures: z.ZodOptional<z.ZodString>;
        treesAndObstacles: z.ZodOptional<z.ZodString>;
        surveyDocKey: z.ZodOptional<z.ZodString>;
        gpsPin: z.ZodUnion<[z.ZodObject<{
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
        }>, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>;
        gpsPinShareUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        schemaVersion: "1.0";
        plotShape: {
            notAvailable: true;
            reason: string;
        } | "rectangular" | "corner" | "irregular" | "other";
        dimensions: {
            notAvailable: true;
            reason: string;
        } | {
            side: string;
            note?: string | undefined;
            lengthM?: number | undefined;
            lengthFt?: number | undefined;
        }[];
        roadFrontageM: number | {
            notAvailable: true;
            reason: string;
        };
        accessType: string | {
            notAvailable: true;
            reason: string;
        };
        gpsPin: {
            latitude: number;
            longitude: number;
            capturedAt: string;
            accuracy?: number | undefined;
            altitude?: number | undefined;
            note?: string | undefined;
        } | {
            notAvailable: true;
            reason: string;
        };
        totalAreaSqM?: number | undefined;
        adjacentDevelopments?: string | undefined;
        existingStructures?: string | undefined;
        treesAndObstacles?: string | undefined;
        surveyDocKey?: string | undefined;
        gpsPinShareUrl?: string | undefined;
    }, {
        plotShape: {
            notAvailable: true;
            reason: string;
        } | "rectangular" | "corner" | "irregular" | "other";
        dimensions: {
            notAvailable: true;
            reason: string;
        } | {
            side: string;
            note?: string | undefined;
            lengthM?: number | undefined;
            lengthFt?: number | undefined;
        }[];
        roadFrontageM: number | {
            notAvailable: true;
            reason: string;
        };
        accessType: string | {
            notAvailable: true;
            reason: string;
        };
        gpsPin: {
            latitude: number;
            longitude: number;
            capturedAt: string;
            accuracy?: number | undefined;
            altitude?: number | undefined;
            note?: string | undefined;
        } | {
            notAvailable: true;
            reason: string;
        };
        schemaVersion?: "1.0" | undefined;
        totalAreaSqM?: number | undefined;
        adjacentDevelopments?: string | undefined;
        existingStructures?: string | undefined;
        treesAndObstacles?: string | undefined;
        surveyDocKey?: string | undefined;
        gpsPinShareUrl?: string | undefined;
    }>>;
    sectionC: z.ZodOptional<z.ZodObject<{
        schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
        compassNorthDeg: z.ZodUnion<[z.ZodNumber, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>;
        sunPath: z.ZodUnion<[z.ZodObject<{
            sunrise: z.ZodString;
            sunset: z.ZodString;
            solarNoonAzimuth: z.ZodNumber;
            label: z.ZodLiteral<"computed / informational">;
        }, "strip", z.ZodTypeAny, {
            sunrise: string;
            sunset: string;
            solarNoonAzimuth: number;
            label: "computed / informational";
        }, {
            sunrise: string;
            sunset: string;
            solarNoonAzimuth: number;
            label: "computed / informational";
        }>, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>;
        windDirection: z.ZodUnion<[z.ZodObject<{
            direction: z.ZodString;
            label: z.ZodLiteral<"observed">;
            note: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label: "observed";
            direction: string;
            note?: string | undefined;
        }, {
            label: "observed";
            direction: string;
            note?: string | undefined;
        }>, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>;
        topography: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>>;
        groundConditions: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>>;
        drainageNotes: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>>;
        waterFlowDirection: z.ZodOptional<z.ZodString>;
        terrainLabel: z.ZodDefault<z.ZodLiteral<"Preliminary field observations - not authoritative surveying">>;
    }, "strip", z.ZodTypeAny, {
        schemaVersion: "1.0";
        compassNorthDeg: number | {
            notAvailable: true;
            reason: string;
        };
        sunPath: {
            notAvailable: true;
            reason: string;
        } | {
            sunrise: string;
            sunset: string;
            solarNoonAzimuth: number;
            label: "computed / informational";
        };
        windDirection: {
            notAvailable: true;
            reason: string;
        } | {
            label: "observed";
            direction: string;
            note?: string | undefined;
        };
        terrainLabel: "Preliminary field observations - not authoritative surveying";
        topography?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        groundConditions?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        drainageNotes?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        waterFlowDirection?: string | undefined;
    }, {
        compassNorthDeg: number | {
            notAvailable: true;
            reason: string;
        };
        sunPath: {
            notAvailable: true;
            reason: string;
        } | {
            sunrise: string;
            sunset: string;
            solarNoonAzimuth: number;
            label: "computed / informational";
        };
        windDirection: {
            notAvailable: true;
            reason: string;
        } | {
            label: "observed";
            direction: string;
            note?: string | undefined;
        };
        schemaVersion?: "1.0" | undefined;
        topography?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        groundConditions?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        drainageNotes?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        waterFlowDirection?: string | undefined;
        terrainLabel?: "Preliminary field observations - not authoritative surveying" | undefined;
    }>>;
    sectionD: z.ZodOptional<z.ZodObject<{
        schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
        mediaIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        schemaVersion: "1.0";
        mediaIds: string[];
    }, {
        mediaIds: string[];
        schemaVersion?: "1.0" | undefined;
    }>>;
    sectionE: z.ZodOptional<z.ZodObject<{
        schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
        sketchVersionId: z.ZodOptional<z.ZodString>;
        uploadedKey: z.ZodOptional<z.ZodString>;
        label: z.ZodDefault<z.ZodLiteral<"Preliminary field sketch - not a cadastral survey">>;
    }, "strip", z.ZodTypeAny, {
        schemaVersion: "1.0";
        label: "Preliminary field sketch - not a cadastral survey";
        sketchVersionId?: string | undefined;
        uploadedKey?: string | undefined;
    }, {
        schemaVersion?: "1.0" | undefined;
        label?: "Preliminary field sketch - not a cadastral survey" | undefined;
        sketchVersionId?: string | undefined;
        uploadedKey?: string | undefined;
    }>>;
    sectionF: z.ZodOptional<z.ZodObject<{
        schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
        projectDescription: z.ZodOptional<z.ZodString>;
        voiceNoteKey: z.ZodOptional<z.ZodString>;
        buildingType: z.ZodOptional<z.ZodString>;
        storeys: z.ZodOptional<z.ZodNumber>;
        rooms: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            quantity: z.ZodNumber;
            note: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            quantity: number;
            note?: string | undefined;
        }, {
            type: string;
            quantity: number;
            note?: string | undefined;
        }>, "many">>;
        stylePreferences: z.ZodOptional<z.ZodString>;
        referencePhotoIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        specialNeeds: z.ZodOptional<z.ZodString>;
        budgetRangeKesMin: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>>;
        budgetRangeKesMax: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>>;
        timeline: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            notAvailable: z.ZodLiteral<true>;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            notAvailable: true;
            reason: string;
        }, {
            notAvailable: true;
            reason: string;
        }>]>>;
        officerRecommendations: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        schemaVersion: "1.0";
        projectDescription?: string | undefined;
        voiceNoteKey?: string | undefined;
        buildingType?: string | undefined;
        storeys?: number | undefined;
        rooms?: {
            type: string;
            quantity: number;
            note?: string | undefined;
        }[] | undefined;
        stylePreferences?: string | undefined;
        referencePhotoIds?: string[] | undefined;
        specialNeeds?: string | undefined;
        budgetRangeKesMin?: number | {
            notAvailable: true;
            reason: string;
        } | undefined;
        budgetRangeKesMax?: number | {
            notAvailable: true;
            reason: string;
        } | undefined;
        timeline?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        officerRecommendations?: string | undefined;
    }, {
        schemaVersion?: "1.0" | undefined;
        projectDescription?: string | undefined;
        voiceNoteKey?: string | undefined;
        buildingType?: string | undefined;
        storeys?: number | undefined;
        rooms?: {
            type: string;
            quantity: number;
            note?: string | undefined;
        }[] | undefined;
        stylePreferences?: string | undefined;
        referencePhotoIds?: string[] | undefined;
        specialNeeds?: string | undefined;
        budgetRangeKesMin?: number | {
            notAvailable: true;
            reason: string;
        } | undefined;
        budgetRangeKesMax?: number | {
            notAvailable: true;
            reason: string;
        } | undefined;
        timeline?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        officerRecommendations?: string | undefined;
    }>>;
    sectionG: z.ZodOptional<z.ZodObject<{
        schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
        completionChecklist: z.ZodArray<z.ZodObject<{
            item: z.ZodString;
            status: z.ZodEnum<["complete", "not_available", "not_observed"]>;
            reason: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status: "complete" | "not_available" | "not_observed";
            item: string;
            reason?: string | undefined;
        }, {
            status: "complete" | "not_available" | "not_observed";
            item: string;
            reason?: string | undefined;
        }>, "many">;
        officerNotes: z.ZodOptional<z.ZodString>;
        officerConfirmedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        schemaVersion: "1.0";
        completionChecklist: {
            status: "complete" | "not_available" | "not_observed";
            item: string;
            reason?: string | undefined;
        }[];
        officerNotes?: string | undefined;
        officerConfirmedAt?: string | undefined;
    }, {
        completionChecklist: {
            status: "complete" | "not_available" | "not_observed";
            item: string;
            reason?: string | undefined;
        }[];
        schemaVersion?: "1.0" | undefined;
        officerNotes?: string | undefined;
        officerConfirmedAt?: string | undefined;
    }>>;
    lastSavedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    bookingId: string;
    surveyId?: string | undefined;
    sectionA?: {
        schemaVersion: "1.0";
        projectReference: string;
        clientName: string;
        clientPhone: string;
        siteCounty: string;
        siteArea: string;
        visitDate: string;
        officerName: string;
        officerEmail: string;
        siteDirections?: string | undefined;
    } | undefined;
    sectionB?: {
        schemaVersion: "1.0";
        plotShape: {
            notAvailable: true;
            reason: string;
        } | "rectangular" | "corner" | "irregular" | "other";
        dimensions: {
            notAvailable: true;
            reason: string;
        } | {
            side: string;
            note?: string | undefined;
            lengthM?: number | undefined;
            lengthFt?: number | undefined;
        }[];
        roadFrontageM: number | {
            notAvailable: true;
            reason: string;
        };
        accessType: string | {
            notAvailable: true;
            reason: string;
        };
        gpsPin: {
            latitude: number;
            longitude: number;
            capturedAt: string;
            accuracy?: number | undefined;
            altitude?: number | undefined;
            note?: string | undefined;
        } | {
            notAvailable: true;
            reason: string;
        };
        totalAreaSqM?: number | undefined;
        adjacentDevelopments?: string | undefined;
        existingStructures?: string | undefined;
        treesAndObstacles?: string | undefined;
        surveyDocKey?: string | undefined;
        gpsPinShareUrl?: string | undefined;
    } | undefined;
    sectionC?: {
        schemaVersion: "1.0";
        compassNorthDeg: number | {
            notAvailable: true;
            reason: string;
        };
        sunPath: {
            notAvailable: true;
            reason: string;
        } | {
            sunrise: string;
            sunset: string;
            solarNoonAzimuth: number;
            label: "computed / informational";
        };
        windDirection: {
            notAvailable: true;
            reason: string;
        } | {
            label: "observed";
            direction: string;
            note?: string | undefined;
        };
        terrainLabel: "Preliminary field observations - not authoritative surveying";
        topography?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        groundConditions?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        drainageNotes?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        waterFlowDirection?: string | undefined;
    } | undefined;
    sectionD?: {
        schemaVersion: "1.0";
        mediaIds: string[];
    } | undefined;
    sectionE?: {
        schemaVersion: "1.0";
        label: "Preliminary field sketch - not a cadastral survey";
        sketchVersionId?: string | undefined;
        uploadedKey?: string | undefined;
    } | undefined;
    sectionF?: {
        schemaVersion: "1.0";
        projectDescription?: string | undefined;
        voiceNoteKey?: string | undefined;
        buildingType?: string | undefined;
        storeys?: number | undefined;
        rooms?: {
            type: string;
            quantity: number;
            note?: string | undefined;
        }[] | undefined;
        stylePreferences?: string | undefined;
        referencePhotoIds?: string[] | undefined;
        specialNeeds?: string | undefined;
        budgetRangeKesMin?: number | {
            notAvailable: true;
            reason: string;
        } | undefined;
        budgetRangeKesMax?: number | {
            notAvailable: true;
            reason: string;
        } | undefined;
        timeline?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        officerRecommendations?: string | undefined;
    } | undefined;
    sectionG?: {
        schemaVersion: "1.0";
        completionChecklist: {
            status: "complete" | "not_available" | "not_observed";
            item: string;
            reason?: string | undefined;
        }[];
        officerNotes?: string | undefined;
        officerConfirmedAt?: string | undefined;
    } | undefined;
    lastSavedAt?: string | undefined;
}, {
    bookingId: string;
    schemaVersion?: "1.0" | undefined;
    surveyId?: string | undefined;
    sectionA?: {
        projectReference: string;
        clientName: string;
        clientPhone: string;
        siteCounty: string;
        siteArea: string;
        visitDate: string;
        officerName: string;
        officerEmail: string;
        schemaVersion?: "1.0" | undefined;
        siteDirections?: string | undefined;
    } | undefined;
    sectionB?: {
        plotShape: {
            notAvailable: true;
            reason: string;
        } | "rectangular" | "corner" | "irregular" | "other";
        dimensions: {
            notAvailable: true;
            reason: string;
        } | {
            side: string;
            note?: string | undefined;
            lengthM?: number | undefined;
            lengthFt?: number | undefined;
        }[];
        roadFrontageM: number | {
            notAvailable: true;
            reason: string;
        };
        accessType: string | {
            notAvailable: true;
            reason: string;
        };
        gpsPin: {
            latitude: number;
            longitude: number;
            capturedAt: string;
            accuracy?: number | undefined;
            altitude?: number | undefined;
            note?: string | undefined;
        } | {
            notAvailable: true;
            reason: string;
        };
        schemaVersion?: "1.0" | undefined;
        totalAreaSqM?: number | undefined;
        adjacentDevelopments?: string | undefined;
        existingStructures?: string | undefined;
        treesAndObstacles?: string | undefined;
        surveyDocKey?: string | undefined;
        gpsPinShareUrl?: string | undefined;
    } | undefined;
    sectionC?: {
        compassNorthDeg: number | {
            notAvailable: true;
            reason: string;
        };
        sunPath: {
            notAvailable: true;
            reason: string;
        } | {
            sunrise: string;
            sunset: string;
            solarNoonAzimuth: number;
            label: "computed / informational";
        };
        windDirection: {
            notAvailable: true;
            reason: string;
        } | {
            label: "observed";
            direction: string;
            note?: string | undefined;
        };
        schemaVersion?: "1.0" | undefined;
        topography?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        groundConditions?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        drainageNotes?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        waterFlowDirection?: string | undefined;
        terrainLabel?: "Preliminary field observations - not authoritative surveying" | undefined;
    } | undefined;
    sectionD?: {
        mediaIds: string[];
        schemaVersion?: "1.0" | undefined;
    } | undefined;
    sectionE?: {
        schemaVersion?: "1.0" | undefined;
        label?: "Preliminary field sketch - not a cadastral survey" | undefined;
        sketchVersionId?: string | undefined;
        uploadedKey?: string | undefined;
    } | undefined;
    sectionF?: {
        schemaVersion?: "1.0" | undefined;
        projectDescription?: string | undefined;
        voiceNoteKey?: string | undefined;
        buildingType?: string | undefined;
        storeys?: number | undefined;
        rooms?: {
            type: string;
            quantity: number;
            note?: string | undefined;
        }[] | undefined;
        stylePreferences?: string | undefined;
        referencePhotoIds?: string[] | undefined;
        specialNeeds?: string | undefined;
        budgetRangeKesMin?: number | {
            notAvailable: true;
            reason: string;
        } | undefined;
        budgetRangeKesMax?: number | {
            notAvailable: true;
            reason: string;
        } | undefined;
        timeline?: string | {
            notAvailable: true;
            reason: string;
        } | undefined;
        officerRecommendations?: string | undefined;
    } | undefined;
    sectionG?: {
        completionChecklist: {
            status: "complete" | "not_available" | "not_observed";
            item: string;
            reason?: string | undefined;
        }[];
        schemaVersion?: "1.0" | undefined;
        officerNotes?: string | undefined;
        officerConfirmedAt?: string | undefined;
    } | undefined;
    lastSavedAt?: string | undefined;
}>;
export type SurveyDraft = z.infer<typeof SurveyDraftSchema>;
//# sourceMappingURL=survey-schemas.d.ts.map