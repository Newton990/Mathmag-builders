// ================================================================================
// MBMS — Response Helpers (Wasmer Edge)
// ================================================================================
export function corsHeaders(origin, env) {
    const allowed = env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? [];
    const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0] ?? '*';
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-Idempotency-Key',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };
}
export function json(data, status, origin, env) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders(origin, env),
            'Content-Type': 'application/json',
        },
    });
}
export function error(message, code, status, origin, env) {
    return json({ error: { code, message } }, status, origin, env);
}
export function success(data, origin, env, status = 200) {
    return json({ data }, status, origin, env);
}
export function parseBody(request) {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        return request.json().catch(() => undefined);
    }
    if (contentType.includes('multipart/form-data')) {
        return request.formData().catch(() => undefined);
    }
    return request.text().catch(() => undefined);
}
//# sourceMappingURL=responses.js.map