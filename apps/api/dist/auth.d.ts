export interface JWTPayload {
    sub: string;
    userId: string;
    email: string;
    role: string;
    mfaVerified?: boolean;
    stepUp?: boolean;
    iat?: number;
    exp?: number;
}
export interface AuthContext {
    userId: string;
    email: string;
    role: string;
    mfaVerified: boolean;
    stepUp: boolean;
}
export declare function verifyAccessToken(token: string): Promise<JWTPayload>;
export declare function extractAuth(request: Request): Promise<AuthContext | null>;
export declare function requireAuth(request: Request): Promise<AuthContext>;
export declare function requireMfa(auth: AuthContext): void;
export declare function requireStepUp(auth: AuthContext): void;
export declare function requireRole(auth: AuthContext, ...roles: string[]): void;
export declare function isLeadArchitect(auth: AuthContext): boolean;
export declare function isStaffRole(role: string): boolean;
//# sourceMappingURL=auth.d.ts.map