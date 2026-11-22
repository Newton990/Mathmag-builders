export interface AppConfig {
    NODE_ENV: 'development' | 'test' | 'production';
    DATABASE_URL: string;
    API_PORT: number;
    JWT_SECRET: string;
    JWT_ACCESS_EXPIRY_SECONDS: number;
    JWT_STEP_UP_EXPIRY_SECONDS: number;
    JWT_REFRESH_EXPIRY_MS: number;
    MFA_ENCRYPTION_KEY: string;
    AUTH_MAX_FAILED_ATTEMPTS: number;
    AUTH_LOCKOUT_DURATION_MS: number;
    CORS_ORIGIN: string;
    LOG_LEVEL: string;
    STORAGE_ENDPOINT: string;
    STORAGE_PORT: number;
    STORAGE_USE_SSL: boolean;
    STORAGE_ACCESS_KEY: string;
    STORAGE_SECRET_KEY: string;
    STORAGE_BUCKET: string;
    MAX_UPLOAD_SIZE_BYTES: number;
    SIGNED_URL_TTL_SECONDS: number;
}
export declare function loadConfig(): AppConfig;
export declare const config: AppConfig;
//# sourceMappingURL=config.d.ts.map