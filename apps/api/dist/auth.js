// ================================================================================
// MBMS — Authentication (Wasmer Edge)
// JWT verification using the Web Standard jose library. No session storage.
// ================================================================================
import { jwtVerify, errors } from 'jose';
import { config } from './config.js';
export async function verifyAccessToken(token) {
    try {
        const secret = new TextEncoder().encode(config.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
        return payload;
    }
    catch (err) {
        if (err instanceof errors.JWTExpired) {
            throw new Error('TOKEN_EXPIRED');
        }
        if (err && typeof err === 'object' && 'code' in err && String(err.code).startsWith('ERR_JWT')) {
            throw new Error('INVALID_TOKEN');
        }
        throw err;
    }
}
export async function extractAuth(request) {
    const header = request.headers.get('authorization');
    if (!header?.startsWith('Bearer ')) {
        return null;
    }
    const token = header.slice(7);
    try {
        const payload = await verifyAccessToken(token);
        return {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            mfaVerified: !!payload.mfaVerified,
            stepUp: !!payload.stepUp,
        };
    }
    catch {
        return null;
    }
}
export async function requireAuth(request) {
    const auth = await extractAuth(request);
    if (!auth) {
        throw new Error('UNAUTHORIZED');
    }
    return auth;
}
export function requireMfa(auth) {
    if (!auth.mfaVerified) {
        throw new Error('MFA_REQUIRED');
    }
}
export function requireStepUp(auth) {
    if (!auth.stepUp) {
        throw new Error('STEP_UP_REQUIRED');
    }
}
export function requireRole(auth, ...roles) {
    if (!roles.includes(auth.role)) {
        throw new Error(`FORBIDDEN: Role '${auth.role}' not permitted`);
    }
}
export function isLeadArchitect(auth) {
    return auth.role === 'LEAD_ARCHITECT';
}
export function isStaffRole(role) {
    return role !== 'CLIENT';
}
//# sourceMappingURL=auth.js.map