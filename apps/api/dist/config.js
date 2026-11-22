// src/config.ts
// Loads and validates all required environment variables at startup.
// Fails fast with a clear message listing every missing variable.
// Force operational timezone parity across environments (overridable by process env).
process.env.TZ = process.env.TZ || 'Africa/Nairobi';
import { createRequire } from 'module';
// Load .env only for local non-production development convenience.
// In cloud/production, required values must come directly from process.env.
if (process.env['NODE_ENV'] !== 'test') {
    try {
        const require = createRequire(import.meta.url);
        const dotenv = require('dotenv');
        dotenv.config({ override: false });
    }
    catch {
        // dotenv not available or .env missing — rely on process.env
    }
}
if (!process.env.DATABASE_URL) {
    const { DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env;
    if (DB_HOST && DB_PORT && DB_NAME && DB_USERNAME && DB_PASSWORD !== undefined) {
        process.env.DATABASE_URL =
            `postgresql://${DB_USERNAME}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require`;
    }
}
export function loadConfig() {
    const missing = [];
    const invalid = [];
    function get(key, fallback) {
        const val = process.env[key] ?? fallback;
        if (val === undefined || val === '') {
            missing.push(key);
            return '';
        }
        return val;
    }
    function getInt(key, fallback) {
        const raw = process.env[key];
        if (raw === undefined || raw === '') {
            if (fallback !== undefined)
                return fallback;
            missing.push(key);
            return 0;
        }
        const n = parseInt(raw, 10);
        if (isNaN(n)) {
            missing.push(`${key} (must be integer, got "${raw}")`);
            return 0;
        }
        return n;
    }
    const DATABASE_URL = get('DATABASE_URL');
    const JWT_SECRET = get('JWT_SECRET');
    const MFA_ENCRYPTION_KEY = get('MFA_ENCRYPTION_KEY');
    if (DATABASE_URL) {
        try {
            const protocol = new URL(DATABASE_URL).protocol;
            if (protocol !== 'postgres:' && protocol !== 'postgresql:') {
                invalid.push('DATABASE_URL (must use the PostgreSQL protocol)');
            }
        }
        catch {
            invalid.push('DATABASE_URL (must be a valid PostgreSQL connection URL)');
        }
    }
    if (JWT_SECRET && JWT_SECRET.length < 64) {
        invalid.push('JWT_SECRET (must be at least 64 characters)');
    }
    if (MFA_ENCRYPTION_KEY && !/^[a-fA-F0-9]{64}$/.test(MFA_ENCRYPTION_KEY)) {
        invalid.push('MFA_ENCRYPTION_KEY (must be exactly 64 hex characters)');
    }
    const cfg = {
        NODE_ENV: get('NODE_ENV', 'development'),
        DATABASE_URL,
        API_PORT: getInt('API_PORT', Number(process.env.PORT) || 3001),
        JWT_SECRET,
        JWT_ACCESS_EXPIRY_SECONDS: getInt('JWT_ACCESS_EXPIRY_SECONDS', 900),
        JWT_STEP_UP_EXPIRY_SECONDS: getInt('JWT_STEP_UP_EXPIRY_SECONDS', 300),
        JWT_REFRESH_EXPIRY_MS: getInt('JWT_REFRESH_EXPIRY_DAYS', 7) * 24 * 60 * 60 * 1000,
        MFA_ENCRYPTION_KEY,
        AUTH_MAX_FAILED_ATTEMPTS: getInt('AUTH_MAX_FAILED_ATTEMPTS', 5),
        AUTH_LOCKOUT_DURATION_MS: getInt('AUTH_LOCKOUT_MINUTES', 15) * 60 * 1000,
        CORS_ORIGIN: get('CORS_ORIGIN', 'http://localhost:5173'),
        LOG_LEVEL: get('LOG_LEVEL', 'info'),
        STORAGE_ENDPOINT: get('STORAGE_ENDPOINT', 'localhost'),
        STORAGE_PORT: getInt('STORAGE_PORT', 9000),
        STORAGE_USE_SSL: get('STORAGE_USE_SSL', 'false') === 'true',
        STORAGE_ACCESS_KEY: get('STORAGE_ACCESS_KEY', 'minioadmin'),
        STORAGE_SECRET_KEY: get('STORAGE_SECRET_KEY', 'minio123'),
        STORAGE_BUCKET: get('STORAGE_BUCKET', 'mbms-private'),
        MAX_UPLOAD_SIZE_BYTES: getInt('MAX_UPLOAD_SIZE_BYTES', 52428800),
        SIGNED_URL_TTL_SECONDS: getInt('SIGNED_URL_TTL_SECONDS', 300),
    };
    // DATABASE_URL is assembled above from DB_* when Wasmer injects managed
    // PostgreSQL variables. JWT and MFA secrets must always be platform secrets.
    const strictlyRequired = ['DATABASE_URL', 'JWT_SECRET', 'MFA_ENCRYPTION_KEY'];
    const hard = strictlyRequired.filter((k) => !process.env[k]);
    const issues = [...hard.map((k) => `  • ${k}`), ...invalid.map((msg) => `  • ${msg}`)];
    if (issues.length > 0) {
        const list = issues.join('\n');
        throw new Error(`MBMS API cannot start — missing or invalid required environment variables:\n${list}\n\nSet them in Wasmer Edge dashboard or .env for local dev.`);
    }
    return cfg;
}
export const config = loadConfig();
//# sourceMappingURL=config.js.map