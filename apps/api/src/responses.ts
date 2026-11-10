// ================================================================================
// MBMS — Response Helpers (Wasmer Edge)
// ================================================================================

interface Env {
  CORS_ORIGIN?: string;
  NODE_ENV?: string;
}

export function corsHeaders(origin: string | null, env: Env): Record<string, string> {
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

export function json(data: unknown, status: number, origin: string | null, env: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin, env),
      'Content-Type': 'application/json',
    },
  });
}

export function error(
  message: string,
  code: string,
  status: number,
  origin: string | null,
  env: Env,
): Response {
  return json({ error: { code, message } }, status, origin, env);
}

export function success(data: unknown, origin: string | null, env: Env, status = 200): Response {
  return json({ data }, status, origin, env);
}

export function parseBody(request: Request): Promise<any> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return request.json().catch(() => undefined);
  }
  if (contentType.includes('multipart/form-data')) {
    return request.formData().catch(() => undefined);
  }
  return request.text().catch(() => undefined);
}
