// src/lib/api.ts
// Typed fetch wrapper with access-token refresh.
// In local dev, keep using the Vite proxy; in production, point to the deployed Render API.
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : 'https://mathmag-api.onrender.com/api')).replace(/\/+$/, '');

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export const isDemoMode = (): boolean => {
  // Build-time opt-out: set VITE_DEMO_MODE=false in production .env to
  // prevent demo mode from ever activating (URL params and localStorage are
  // then ignored).  Defaults to 'true' when the env var is absent so that
  // the app continues to work without a backend in development.
  if (import.meta.env.VITE_DEMO_MODE === 'false') return false;

  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const demoExplicit = params.get('demo') === 'true';
  const liveExplicit = params.get('live') === 'true';
  const storedValue = window.localStorage.getItem('mbms.demo');

  if (liveExplicit) {
    window.localStorage.setItem('mbms.demo', 'false');
    return false;
  }
  if (storedValue === 'false' && !demoExplicit) return false;
  if (demoExplicit || storedValue === 'true' || !storedValue) {
    window.localStorage.setItem('mbms.demo', 'true');
    return true;
  }
  return true;
};

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
  if (isDemoMode()) {
    // Demo mode: return mock data for demo, no backend required
    if (options.method === 'GET' || !options.method) {
      // Strip query params before matching so paths like /projects?take=100 match correctly
      const basePath = path.split('?')[0] ?? path;
      const isList =
        basePath.includes('/list') ||
        !!basePath.match(
          /\/(conversations|projects|inbox|reports|bookings|surveys|tasks|users|clients|staff|tenders|quotations|purchase-orders|invoices|payments|sites|materials|labor|equipment|documents|governance|notifications|alerts|delegations|exceptions|audits|leave|requisitions|site-logs|grns|work-holds|variations|handovers|mobilizations|engagements|contracts)$/,
        );
      if (isList) return { items: [], total: 0 } as T;
      if (path.includes('items') || path.includes('data')) return [] as T;
      return {} as T;
    }
    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') return { success: true } as T;
    if (options.method === 'DELETE') return { success: true } as T;
    return {} as T;
  }

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
