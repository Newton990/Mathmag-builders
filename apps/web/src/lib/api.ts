// src/lib/api.ts
// Typed fetch wrapper with access-token refresh.
// In local dev, keep using the Vite proxy; in production, point to the deployed Render API.
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : 'https://mathmag-api.onrender.com/api')).replace(/\/+$/, '');

const DEMO_ROLE = (): string => {
  if (typeof window === 'undefined') return 'LEAD_ARCHITECT';
  const stored = window.localStorage.getItem('mbms.demoRole');
  if (
    stored === 'CLIENT_RELATIONS_OFFICER' ||
    stored === 'VISITING_OFFICER' ||
    stored === 'LEAD_ARCHITECT' ||
    stored === 'JUNIOR_ARCHITECT' ||
    stored === 'CLIENT' ||
    stored === 'ADMIN_MANAGEMENT'
  ) {
    return stored;
  }
  return 'LEAD_ARCHITECT';
};

const demoDate = (offsetDays: number) => new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString();

const demoContact = (fullName: string, organisation: string | null, phone: string, email: string) => ({
  id: `${fullName.toLowerCase().replace(/\s+/g, '-')}-contact`,
  fullName,
  organisation,
  primaryPhone: phone,
  alternatePhone: null,
  email,
  sourceChannel: 'WHATSAPP',
  consentMarketing: true,
  consentDataProc: true,
  notes: 'Demo use only — sample client record.',
});

const demoProjects = [
  {
    id: 'proj-1001',
    reference: 'MBMS-1001',
    projectType: 'Residential Villa',
    siteCounty: 'Nairobi',
    siteSubCounty: 'Westlands',
    siteArea: 'Karura',
    siteDirections: 'Off Kiambu Road, next to the Karura market',
    siteDescription: '3-bedroom duplex with internal courtyard and utility wing.',
    currentStage: 'PUBLISHED_TO_CLIENT',
    createdAt: demoDate(-28),
    updatedAt: demoDate(-2),
    contact: demoContact('Aisha Wanjiku', 'Wanjiku Family', '+254712345678', 'aisha@demo.co.ke'),
    visitBooking: {
      id: 'booking-1001',
      projectId: 'proj-1001',
      scheduledAt: demoDate(2),
      status: 'VISIT_COMPLETED',
      paymentStatus: 'PAID',
      visitFeeKes: '18000',
      specialInstructions: 'Please bring the site plan and access gate code.',
      checkInAt: demoDate(-3),
      checkInGps: { latitude: -1.266, longitude: 36.803, accuracy: 9.4 },
      checkOutAt: demoDate(-3),
      checkOutGps: { latitude: -1.267, longitude: 36.804, accuracy: 8.7 },
      assignedOfficerId: 'officer-01',
      assignedOfficer: { id: 'officer-01', name: 'Daniel Ouma', role: 'VISITING_OFFICER' },
      project: null,
      surveys: [],
      history: [],
    },
  },
  {
    id: 'proj-1002',
    reference: 'MBMS-1002',
    projectType: 'Commercial office fit-out',
    siteCounty: 'Nakuru',
    siteSubCounty: 'Nakuru Town',
    siteArea: 'Free Area',
    siteDirections: 'Opposite the main bus park, unit 4A',
    siteDescription: 'Office fit-out including partition walls, electrical reticulation, and reception works.',
    currentStage: 'APPROVED',
    createdAt: demoDate(-41),
    updatedAt: demoDate(-6),
    contact: demoContact('Moses Karanja', 'Karanja Holdings', '+254723456789', 'moses@demo.co.ke'),
    visitBooking: {
      id: 'booking-1002',
      projectId: 'proj-1002',
      scheduledAt: demoDate(5),
      status: 'BOOKED',
      paymentStatus: 'PENDING',
      visitFeeKes: '22000',
      specialInstructions: 'Confirm parking arrangement before arrival.',
      checkInAt: null,
      checkInGps: null,
      checkOutAt: null,
      checkOutGps: null,
      assignedOfficerId: 'officer-02',
      assignedOfficer: { id: 'officer-02', name: 'Mary Njeri', role: 'VISITING_OFFICER' },
      project: null,
      surveys: [],
      history: [],
    },
  },
  {
    id: 'proj-1003',
    reference: 'MBMS-1003',
    projectType: 'School extension',
    siteCounty: 'Mombasa',
    siteSubCounty: 'Kisauni',
    siteArea: 'Mtopanga',
    siteDirections: 'Near the main road junction beside the church compound',
    siteDescription: '1-storey classroom block with roof drainage and a security gate.',
    currentStage: 'REPORT_GENERATING',
    createdAt: demoDate(-15),
    updatedAt: demoDate(-1),
    contact: demoContact('Salma Omar', 'Bright Path Academy', '+254733445566', 'salma@demo.co.ke'),
    visitBooking: {
      id: 'booking-1003',
      projectId: 'proj-1003',
      scheduledAt: demoDate(1),
      status: 'RESCHEDULED',
      paymentStatus: 'PAID',
      visitFeeKes: '16000',
      specialInstructions: 'Arrive after 9:00am; gate opens late.',
      checkInAt: null,
      checkInGps: null,
      checkOutAt: null,
      checkOutGps: null,
      assignedOfficerId: 'officer-03',
      assignedOfficer: { id: 'officer-03', name: 'Joseph Kariuki', role: 'VISITING_OFFICER' },
      project: null,
      surveys: [],
      history: [],
    },
  },
].map((project) => ({
  ...project,
  visitBooking: project.visitBooking ? { ...project.visitBooking, project: { ...project } } : null,
}));

const demoConversations = [
  {
    id: 'conv-101',
    status: 'VISIT_AGREED',
    channel: 'WHATSAPP',
    subject: 'Villa site walkthrough and design validation',
    lastActivityAt: demoDate(-1),
    followUpAt: demoDate(1),
    createdAt: demoDate(-9),
    contact: demoContact('Aisha Wanjiku', 'Wanjiku Family', '+254712345678', 'aisha@demo.co.ke'),
    assignedStaff: { id: 'staff-1', name: 'Njeri Wambui', role: 'CLIENT_RELATIONS_OFFICER' },
    linkedProject: { id: 'proj-1001', reference: 'MBMS-1001', currentStage: 'PUBLISHED_TO_CLIENT' },
    _count: { messages: 7 },
  },
  {
    id: 'conv-102',
    status: 'IN_DISCUSSION',
    channel: 'PHONE',
    subject: 'Office fit-out approval timeline',
    lastActivityAt: demoDate(-3),
    followUpAt: demoDate(3),
    createdAt: demoDate(-12),
    contact: demoContact('Moses Karanja', 'Karanja Holdings', '+254723456789', 'moses@demo.co.ke'),
    assignedStaff: { id: 'staff-2', name: 'Amos Otieno', role: 'LEAD_ARCHITECT' },
    linkedProject: { id: 'proj-1002', reference: 'MBMS-1002', currentStage: 'APPROVED' },
    _count: { messages: 4 },
  },
  {
    id: 'conv-103',
    status: 'OPEN',
    channel: 'EMAIL',
    subject: 'School extension scope confirmation',
    lastActivityAt: demoDate(-5),
    followUpAt: demoDate(2),
    createdAt: demoDate(-15),
    contact: demoContact('Salma Omar', 'Bright Path Academy', '+254733445566', 'salma@demo.co.ke'),
    assignedStaff: { id: 'staff-3', name: 'Kibet Langat', role: 'JUNIOR_ARCHITECT' },
    linkedProject: null,
    _count: { messages: 2 },
  },
];

const demoReports = [
  {
    id: 'report-203',
    versionNumber: 2,
    approvalState: 'APPROVED',
    generatorStatus: 'GENERATED',
    createdAt: demoDate(-4),
    survey: {
      booking: {
        project: demoProjects[0],
      },
    },
  },
  {
    id: 'report-204',
    versionNumber: 1,
    approvalState: 'IN_REVIEW',
    generatorStatus: 'GENERATED',
    createdAt: demoDate(-8),
    survey: {
      booking: {
        project: demoProjects[1],
      },
    },
  },
  {
    id: 'report-205',
    versionNumber: 1,
    approvalState: 'DRAFT',
    generatorStatus: 'PENDING',
    createdAt: demoDate(-10),
    survey: {
      booking: {
        project: demoProjects[2],
      },
    },
  },
];

const demoBookings = demoProjects.map((project) => ({
  id: project.visitBooking?.id,
  projectId: project.id,
  scheduledAt: project.visitBooking?.scheduledAt ?? demoDate(7),
  status: project.visitBooking?.status ?? 'BOOKED',
  paymentStatus: project.visitBooking?.paymentStatus ?? 'PENDING',
  visitFeeKes: project.visitBooking?.visitFeeKes ?? '15000',
  specialInstructions: project.visitBooking?.specialInstructions ?? 'Site access to be confirmed.',
  checkInAt: project.visitBooking?.checkInAt ?? null,
  checkInGps: project.visitBooking?.checkInGps ?? null,
  checkOutAt: project.visitBooking?.checkOutAt ?? null,
  checkOutGps: project.visitBooking?.checkOutGps ?? null,
  assignedOfficerId: project.visitBooking?.assignedOfficerId ?? 'officer-01',
  assignedOfficer: project.visitBooking?.assignedOfficer ?? { id: 'officer-01', name: 'Daniel Ouma', role: 'VISITING_OFFICER' },
  project,
  surveys: project.visitBooking?.surveys ?? [],
  history: project.visitBooking?.history ?? [],
}));

const demoPortalProjects = [
  {
    id: 'proj-1001',
    reference: 'MBMS-1001',
    siteArea: 'Karura',
    siteCounty: 'Nairobi',
    projectType: 'Residential Villa',
    currentStage: 'PUBLISHED_TO_CLIENT',
    visitBooking: {
      id: 'booking-1001',
      scheduledAt: demoDate(2),
    },
    hasPublishedReport: true,
  },
  {
    id: 'proj-1002',
    reference: 'MBMS-1002',
    siteArea: 'Free Area',
    siteCounty: 'Nakuru',
    projectType: 'Commercial office fit-out',
    currentStage: 'APPROVED',
    visitBooking: {
      id: 'booking-1002',
      scheduledAt: demoDate(5),
    },
    hasPublishedReport: false,
  },
];

const demoUserForRole = (): Record<string, unknown> => {
  const role = DEMO_ROLE();
  const users: Record<string, Record<string, unknown>> = {
    LEAD_ARCHITECT: {
      id: 'demo-admin',
      name: 'Demo Lead Architect',
      email: 'lead@mathmag.co.ke',
      role: 'LEAD_ARCHITECT',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: true,
    },
    VISITING_OFFICER: {
      id: 'demo-field',
      name: 'Demo Field Officer',
      email: 'field@mathmag.co.ke',
      role: 'VISITING_OFFICER',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: true,
    },
    CLIENT: {
      id: 'demo-client',
      name: 'Demo Client',
      email: 'client@demo.co.ke',
      role: 'CLIENT',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: false,
    },
    ADMIN_MANAGEMENT: {
      id: 'demo-mgmt',
      name: 'Demo Management',
      email: 'management@mathmag.co.ke',
      role: 'ADMIN_MANAGEMENT',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: true,
    },
    CLIENT_RELATIONS_OFFICER: {
      id: 'demo-cro',
      name: 'Demo Client Relations Officer',
      email: 'cro@mathmag.co.ke',
      role: 'CLIENT_RELATIONS_OFFICER',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: true,
    },
    JUNIOR_ARCHITECT: {
      id: 'demo-junior',
      name: 'Demo Junior Architect',
      email: 'junior@mathmag.co.ke',
      role: 'JUNIOR_ARCHITECT',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: true,
    },
  };

  return users[role] ?? users.LEAD_ARCHITECT;
};

const demoSignupUser = (fullName: string, email: string, role: string): Record<string, unknown> => ({
  id: `signup-${email.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  name: fullName || 'New MBMS User',
  email: email || 'new-user@mathmag.co.ke',
  role,
  isActive: true,
  lastLoginAt: new Date().toISOString(),
  mfaEnabled: false,
});

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
    const basePath = (path.split('?')[0] ?? path).replace(/\/+$/, '');

    if (basePath === '/auth/login') {
      const email = typeof options.body === 'object' && options.body && 'email' in options.body ? String((options.body as Record<string, unknown>).email ?? '') : '';
      if (email) {
        window.localStorage.setItem('mbms.demoRole', email.includes('client') ? 'CLIENT' : email.includes('field') ? 'VISITING_OFFICER' : email.includes('cro') ? 'CLIENT_RELATIONS_OFFICER' : email.includes('junior') ? 'JUNIOR_ARCHITECT' : email.includes('management') ? 'ADMIN_MANAGEMENT' : 'LEAD_ARCHITECT');
      }
      window.localStorage.setItem('mbms.demo', 'true');
      return {
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
        requiresMfa: false,
      } as T;
    }

    if (basePath === '/auth/signup') {
      const body = (typeof options.body === 'object' && options.body !== null ? options.body : {}) as Record<string, unknown>;
      const fullName = String(body.fullName ?? 'New MBMS User').trim();
      const email = String(body.email ?? 'new-user@mathmag.co.ke').trim();
      const role = String(body.role ?? 'CLIENT');
      const user = demoSignupUser(fullName, email, role);
      window.localStorage.setItem('mbms.demo', 'true');
      window.localStorage.setItem('mbms.demoRole', role);
      window.localStorage.setItem('mbms.signupName', fullName);
      setAccessToken('demo-access-token');
      return {
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
        user,
      } as T;
    }

    if (basePath === '/auth/me') {
      return demoUserForRole() as T;
    }

    if (basePath === '/auth/logout') {
      return { success: true } as T;
    }

    if (basePath === '/conversations') {
      return { items: demoConversations, total: demoConversations.length } as T;
    }

    if (basePath === '/projects') {
      const items = demoProjects.map((project) => ({ ...project, visitBooking: project.visitBooking ?? null }));
      return { items, total: items.length } as T;
    }

    if (basePath === '/reports') {
      return { items: demoReports, total: demoReports.length } as T;
    }

    if (basePath === '/bookings') {
      return { items: demoBookings, total: demoBookings.length } as T;
    }

    if (basePath === '/portal/projects') {
      return { items: demoPortalProjects, total: demoPortalProjects.length } as T;
    }

    if (basePath === '/auth/refresh') {
      return { accessToken: 'demo-access-token', refreshToken: 'demo-refresh-token' } as T;
    }

    if ((options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' || options.method === 'DELETE')) {
      return { success: true } as T;
    }

    if (basePath.startsWith('/projects/')) {
      const match = demoProjects.find((project) => project.id === basePath.split('/').at(-1));
      return (match ?? demoProjects[0]) as T;
    }

    if (basePath.startsWith('/reports/')) {
      const match = demoReports.find((report) => report.id === basePath.split('/').at(-1));
      return (match ?? demoReports[0]) as T;
    }

    if (basePath.startsWith('/portal/projects/')) {
      const match = demoPortalProjects.find((project) => project.id === basePath.split('/').at(-1));
      return (match ?? demoPortalProjects[0]) as T;
    }

    if (basePath.includes('/list') || path.includes('items') || path.includes('data')) {
      return { items: demoProjects, total: demoProjects.length } as T;
    }

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
