// src/lib/api.ts
// Typed fetch wrapper with access-token refresh for the Vite proxy (/api).

const API_BASE = '/api';

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) {
    window.localStorage.setItem('mbms.accessToken', token);
  } else {
    window.localStorage.removeItem('mbms.accessToken');
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  const stored = window.localStorage.getItem('mbms.accessToken');
  accessToken = stored;
  return accessToken;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  formData?: FormData;
  skipRefresh?: boolean;
}

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string[] | undefined>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string[] | undefined>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (fields !== undefined) {
      this.fields = fields;
    }
  }
}

function buildHeaders(options: RequestOptions): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.formData === undefined && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseError(response: Response, text: string): ApiError {
  let record: Record<string, unknown> = {};
  try {
    if (text) record = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // fall through to generic error
  }

  const topMessage = typeof record['message'] === 'string' ? record['message'] : undefined;
  const topCode = typeof record['code'] === 'string' ? record['code'] : undefined;
  const fields = isRecord(record['fields'])
    ? (record['fields'] as Record<string, string[] | undefined>)
    : undefined;

  if (isRecord(record['error'])) {
    const nested = record['error'];
    if (isRecord(nested)) {
      const error = nested;
      return new ApiError(
        response.status,
        typeof error['code'] === 'string' ? error['code'] : topCode ?? 'REQUEST_FAILED',
        typeof error['message'] === 'string' ? error['message'] : topMessage ?? 'Request failed',
        fields,
      );
    }
    if (typeof nested === 'string') {
      return new ApiError(
        response.status,
        nested,
        topMessage ?? nested,
      );
    }
  }

  if (topCode || topMessage) {
    return new ApiError(response.status, topCode ?? 'REQUEST_FAILED', topMessage ?? 'Request failed', fields);
  }

  return new ApiError(response.status, 'REQUEST_FAILED', `Request failed (${response.status})`);
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return false;
        const payload = (await response.json()) as { accessToken?: string };
        if (!payload.accessToken) return false;
        setAccessToken(payload.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers = buildHeaders(options);
  const method = options.method ?? 'GET';
  if (options.formData !== undefined) {
    return fetch(`${API_BASE}${path}`, { method, credentials: 'include', headers, body: options.formData });
  }
  if (options.body !== undefined) {
    return fetch(`${API_BASE}${path}`, { method, credentials: 'include', headers, body: JSON.stringify(options.body) });
  }
  return fetch(`${API_BASE}${path}`, { method, credentials: 'include', headers });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !options.skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) response = await send(path, options);
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  const text = await response.text();
  throw parseError(response, text);
}

export const api = {
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(path, { ...options, method: 'POST', body });
  },
  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(path, { ...options, method: 'PUT', body });
  },
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(path, { ...options, method: 'PATCH', body });
  },
  delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(path, { ...options, method: 'DELETE' });
  },
  upload<T>(path: string, formData: FormData, options?: Omit<RequestOptions, 'method' | 'body' | 'formData'>) {
    return apiRequest<T>(path, { ...options, method: 'POST', formData });
  },
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
