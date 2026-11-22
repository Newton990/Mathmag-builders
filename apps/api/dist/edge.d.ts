interface Env {
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    MFA_ENCRYPTION_KEY?: string;
    CORS_ORIGIN?: string;
    NODE_ENV?: string;
    STORAGE_ENDPOINT?: string;
    STORAGE_PORT?: string;
    STORAGE_USE_SSL?: string;
    STORAGE_ACCESS_KEY?: string;
    STORAGE_SECRET_KEY?: string;
    STORAGE_BUCKET?: string;
}
export default function handler(request: Request, env: Env): Promise<Response>;
export declare function initializeApi(): Promise<void>;
export {};
//# sourceMappingURL=edge.d.ts.map