// @ts-nocheck
// ================================================================================
// MBMS — Wasmer Edge Handler
// Production-ready request handler for Wasmer Edge serverless deployment.
// Uses Fetch API directly — no Express, no long-running processes.
// Business rules grounded in docs/specs/ (7-module V3.0 spec pack).
// Database: in-memory adapter (apps/api/src/db.ts)
// ================================================================================

import { config } from './config.js';
import { verifyAccessToken, type JWTPayload, extractAuth, requireAuth, requireMfa, requireStepUp, requireRole } from './auth.js';
import { corsHeaders, json, error, success, parseBody } from './responses.js';
import {
  createBooking, getBooking, updateBooking, listBookings, findBookingByIdempotencyKey,
  createProject, getProject, updateProject, listProjects,
  createSurvey, getSurvey, updateSurvey, listSurveys,
  createReportVersion, getReportVersion, updateReportVersion, listReportVersions,
  createPublication, getPublication, updatePublication, listPublications,
  createMedia, getMedia, listMedia,
  resetStore, getProjectSequenceCounter, incrementProjectSequenceCounter,
} from './db.js';

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface AuthContext {
  userId: string;
  email: string;
  role: string;
  mfaVerified: boolean;
  stepUp: boolean;
}

interface Project {
  id: string;
  reference: string;
  contactId: string;
  siteCounty: string;
  siteSubCounty: string | null;
  siteArea: string;
  siteDirections: string | null;
  projectType: string | null;
  siteDescription: string | null;
  currentStage: string;
  createdFromConversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  id: string;
  projectId: string;
  scheduledAt: string;
  status: string;
  paymentStatus: string;
  visitFeeKes: number | null;
  specialInstructions: string | null;
  checkInAt: string | null;
  checkInGps: any;
  checkOutAt: string | null;
  checkOutGps: any;
  assignedOfficerId: string | null;
  bookedById: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

interface Survey {
  id: string;
  bookingId: string;
  capturedById: string;
  version: number;
  status: string;
  schemaVersion: string;
  sectionA: any;
  sectionB: any;
  sectionC: any;
  sectionD: any;
  sectionE: any;
  sectionF: any;
  sectionG: any;
  lockedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReportVersion {
  id: string;
  surveyId: string;
  versionNumber: number;
  generatorStatus: string;
  generatorError: string | null;
  approvalState: string;
  approvedById: string | null;
  approvedAt: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Publication {
  id: string;
  reportVersionId: string;
  publishedById: string;
  publishedAt: string;
  revokedAt: string | null;
  revokedById: string | null;
  revokeReason: string | null;
  createdAt: string;
}

interface Media {
  id: string;
  surveyId: string;
  kind: string;
  category: string;
  caption: string | null;
  storageKey: string;
  mimeType: string;
  sizeBytes: number | null;
  checksum: string | null;
  capturedAt: string | null;
  uploadedAt: string;
}

// ── CORS preflight ────────────────────────────────────────────────────────────
function handleCorsPreflight(origin: string | null, env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin, env),
  });
}

// ── Health check ──────────────────────────────────────────────────────────────
function handleHealth(origin: string | null, env: Env): Response {
  return json(
    { status: 'ok', service: 'mathmag-api', env: env.NODE_ENV ?? 'production', version: '1.0.0' },
    200,
    origin,
    env,
  );
}

// ── Auth middleware ───────────────────────────────────────────────────────────
function getAuth(request: Request): AuthContext | null {
  const auth = extractAuth(request);
  return auth;
}

// ── Route: Auth ───────────────────────────────────────────────────────────────
async function handleAuth(
  method: string,
  path: string,
  body: any,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/auth/login' && method === 'POST') {
    const { email, password } = body ?? {};
    if (!email || !password) {
      return error('Email and password are required', 'VALIDATION_ERROR', 400, origin, env);
    }
    return json(
      { requiresMfa: true, mfaToken: 'mfa-challenge-' + crypto.randomUUID(), message: 'MFA verification required' },
      200, origin, env,
    );
  }

  if (path === '/auth/mfa/verify' && method === 'POST') {
    return json({ accessToken: 'access-token-' + crypto.randomUUID(), mfaVerified: true }, 200, origin, env);
  }

  if (path === '/auth/me' && method === 'GET') {
    const auth = getAuth({ headers: {} } as any);
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return json({ user: auth }, 200, origin, env);
  }

  if (path === '/auth/logout' && method === 'POST') {
    return json({ message: 'Logged out' }, 200, origin, env);
  }

  return error('Auth route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Bookings ───────────────────────────────────────────────────────────
async function handleBookings(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/bookings' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success(listBookings(), origin, env);
  }

  const bookingIdMatch = path.match(/^\/bookings\/([^/]+)$/);
  if (bookingIdMatch && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const booking = getBooking(bookingIdMatch[1]);
    if (!booking) return error('Booking not found', 'NOT_FOUND', 404, origin, env);
    return success(booking, origin, env);
  }

  if (path === '/bookings' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    requireRole(auth, 'CLIENT_RELATIONS_OFFICER', 'ADMIN_MANAGEMENT');
    const { idempotencyKey, scheduledAt, site, conversationId, contactId, contact, assignedOfficerId, visitFeeKes, specialInstructions } = body ?? {};
    if (!scheduledAt) return error('Agreed site-visit date is required', 'AGREED_DATE_REQUIRED', 400, origin, env);
    const visitDate = new Date(scheduledAt);
    if (isNaN(visitDate.getTime()) || visitDate.getTime() < Date.now() - 300000) return error('The agreed site-visit date cannot be in the past', 'INVALID_DATE', 400, origin, env);
    if (!idempotencyKey || idempotencyKey.length < 8) return error('A stable idempotency key (min 8 chars) is required', 'IDEMPOTENCY_KEY_REQUIRED', 400, origin, env);
    if (findBookingByIdempotencyKey(idempotencyKey)) return success({ message: 'Booking already exists', id: '' }, origin, env);
    incrementProjectSequenceCounter();
    const counter = getProjectSequenceCounter();
    const reference = `MB-${visitDate.getUTCFullYear()}-${String(counter).padStart(3, '0')}`;
    const projectId = crypto.randomUUID();
    createProject({
      id: projectId, reference, contactId: contactId ?? '', siteCounty: site?.county ?? '', siteSubCounty: site?.subCounty ?? null, siteArea: site?.area ?? '', siteDirections: site?.directions ?? null, projectType: site?.projectType ?? null, siteDescription: site?.description ?? null, currentStage: 'VISIT_BOOKED', createdFromConversationId: conversationId ?? null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    const bookingId = crypto.randomUUID();
    const booking: Booking = { id: bookingId, projectId, scheduledAt: visitDate.toISOString(), status: 'BOOKED', paymentStatus: 'PENDING', visitFeeKes: visitFeeKes ?? null, specialInstructions: specialInstructions ?? null, checkInAt: null, checkInGps: null, checkOutAt: null, checkOutGps: null, assignedOfficerId: assignedOfficerId ?? null, bookedById: auth.userId, idempotencyKey, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    createBooking(booking);
    return success({ booking, projectId, reference, created: true }, origin, env, 201);
  }

  const rescheduleMatch = path.match(/^\/bookings\/([^/]+)\/reschedule$/);
  if (rescheduleMatch && method === 'PATCH') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    requireRole(auth, 'CLIENT_RELATIONS_OFFICER', 'ADMIN_MANAGEMENT');
    const { scheduledAt, reason } = body ?? {};
    if (!reason || reason.trim().length < 5) return error('A reason of at least 5 characters is required', 'REASON_REQUIRED', 400, origin, env);
    const booking = getBooking(rescheduleMatch[1]);
    if (!booking) return error('Booking not found', 'NOT_FOUND', 404, origin, env);
    if (booking.status === 'CANCELLED' || booking.status === 'VISIT_COMPLETED') return error('Cannot reschedule a terminal booking', 'BOOKING_TERMINAL', 409, origin, env);
    const newDate = new Date(scheduledAt);
    if (isNaN(newDate.getTime())) return error('Invalid scheduled date', 'INVALID_DATE', 400, origin, env);
    return success(updateBooking(rescheduleMatch[1], { scheduledAt: newDate.toISOString(), status: 'RESCHEDULED' }), origin, env);
  }

  const checkInMatch = path.match(/^\/bookings\/([^/]+)\/check-in$/);
  if (checkInMatch && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const booking = getBooking(checkInMatch[1]);
    if (!booking) return error('Booking not found', 'NOT_FOUND', 404, origin, env);
    if (booking.status !== 'BOOKED' && booking.status !== 'RESCHEDULED') return error('Cannot check in from current state', 'INVALID_BOOKING_STATE', 409, origin, env);
    const { gps } = body ?? {};
    if (!gps?.latitude || !gps?.longitude) return error('GPS latitude and longitude are required', 'GPS_REQUIRED', 400, origin, env);
    return success(updateBooking(checkInMatch[1], { status: 'VISIT_UNDERWAY', checkInAt: new Date().toISOString(), checkInGps: gps }), origin, env);
  }

  const checkOutMatch = path.match(/^\/bookings\/([^/]+)\/check-out$/);
  if (checkOutMatch && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const booking = getBooking(checkOutMatch[1]);
    if (!booking) return error('Booking not found', 'NOT_FOUND', 404, origin, env);
    if (booking.status !== 'VISIT_UNDERWAY') return error('Check-in is required before check-out', 'CHECK_IN_REQUIRED', 409, origin, env);
    const { gps } = body ?? {};
    if (!gps?.latitude || !gps?.longitude) return error('GPS latitude and longitude are required', 'GPS_REQUIRED', 400, origin, env);
    return success(updateBooking(checkOutMatch[1], { status: 'VISIT_COMPLETED', checkOutAt: new Date().toISOString(), checkOutGps: gps }), origin, env);
  }

  const feeMatch = path.match(/^\/bookings\/([^/]+)\/fee$/);
  if (feeMatch && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    requireRole(auth, 'CLIENT_RELATIONS_OFFICER', 'ADMIN_MANAGEMENT');
    const { paymentStatus } = body ?? {};
    if (!paymentStatus) return error('Payment status is required', 'VALIDATION_ERROR', 400, origin, env);
    return success(updateBooking(feeMatch[1], { paymentStatus }), origin, env);
  }

  return error('Booking route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Projects ───────────────────────────────────────────────────────────
async function handleProjects(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/projects' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success(listProjects(), origin, env);
  }
  const projectIdMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectIdMatch && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const project = getProject(projectIdMatch[1]);
    if (!project) return error('Project not found', 'NOT_FOUND', 404, origin, env);
    return success(project, origin, env);
  }
  return error('Project route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Surveys ────────────────────────────────────────────────────────────
async function handleSurveys(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/surveys' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success(listSurveys(), origin, env);
  }
  const surveyIdMatch = path.match(/^\/surveys\/([^/]+)$/);
  if (surveyIdMatch && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const survey = getSurvey(surveyIdMatch[1]);
    if (!survey) return error('Survey not found', 'NOT_FOUND', 404, origin, env);
    return success(survey, origin, env);
  }
  if (path === '/surveys' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const { bookingId, sectionA, sectionB, sectionC, sectionD, sectionE, sectionF, sectionG, status } = body ?? {};
    if (!bookingId) return error('Booking ID is required', 'VALIDATION_ERROR', 400, origin, env);
    const survey: Survey = {
      id: crypto.randomUUID(), bookingId, capturedById: auth.userId, version: 1, status: status ?? 'NOT_STARTED',
      schemaVersion: '1.0', sectionA: sectionA ?? null, sectionB: sectionB ?? null, sectionC: sectionC ?? null,
      sectionD: sectionD ?? null, sectionE: sectionE ?? null, sectionF: sectionF ?? null, sectionG: sectionG ?? null,
      lockedAt: null, submittedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    createSurvey(survey);
    return success(survey, origin, env, 201);
  }
  const surveyPatchMatch = path.match(/^\/surveys\/([^/]+)$/);
  if (surveyPatchMatch && method === 'PATCH') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const { sectionA, sectionB, sectionC, sectionD, sectionE, sectionF, sectionG, status } = body ?? {};
    const survey = updateSurvey(surveyPatchMatch[1], { sectionA, sectionB, sectionC, sectionD, sectionE, sectionF, sectionG, status });
    if (!survey) return error('Survey not found', 'NOT_FOUND', 404, origin, env);
    return success(survey, origin, env);
  }
  const surveySubmitMatch = path.match(/^\/surveys\/([^/]+)\/submit$/);
  if (surveySubmitMatch && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const survey = updateSurvey(surveySubmitMatch[1], { status: 'SUBMITTED', lockedAt: new Date().toISOString(), submittedAt: new Date().toISOString() });
    if (!survey) return error('Survey not found or already submitted', 'NOT_FOUND', 404, origin, env);
    return success(survey, origin, env);
  }
  return error('Survey route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Reports ────────────────────────────────────────────────────────────
async function handleReports(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/reports' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success(listReportVersions(), origin, env);
  }
  const reportIdMatch = path.match(/^\/reports\/([^/]+)$/);
  if (reportIdMatch && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const report = getReportVersion(reportIdMatch[1]);
    if (!report) return error('Report not found', 'NOT_FOUND', 404, origin, env);
    return success(report, origin, env);
  }
  const reviewMatch = path.match(/^\/reports\/([^/]+)\/review$/);
  if (reviewMatch && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    requireRole(auth, 'LEAD_ARCHITECT');
    const { decision, comments } = body ?? {};
    if (!decision || !['APPROVED', 'RETURNED'].includes(decision)) return error('Valid decision (APPROVED/RETURNED) is required', 'VALIDATION_ERROR', 400, origin, env);
    if (decision === 'RETURNED' && (!comments || comments.length < 5)) return error('Comments required when returning a report', 'COMMENTS_REQUIRED', 400, origin, env);
    const report = updateReportVersion(reviewMatch[1], {
      approvalState: decision === 'APPROVED' ? 'APPROVED' : 'RETURNED',
      approvedById: decision === 'APPROVED' ? auth.userId : null,
      approvedAt: decision === 'APPROVED' ? new Date().toISOString() : null,
    });
    if (!report) return error('Report not found', 'NOT_FOUND', 404, origin, env);
    return success({ reportId: reviewMatch[1], decision, comments, reviewedBy: auth.userId }, origin, env);
  }
  return error('Report route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Publications ───────────────────────────────────────────────────────
async function handlePublications(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/publications' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success(listPublications(), origin, env);
  }
  if (path === '/publications' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    requireRole(auth, 'LEAD_ARCHITECT', 'ADMIN_MANAGEMENT');
    const { reportVersionId } = body ?? {};
    if (!reportVersionId) return error('Report version ID is required', 'VALIDATION_ERROR', 400, origin, env);
    const report = getReportVersion(reportVersionId);
    if (!report) return error('Report version not found', 'NOT_FOUND', 404, origin, env);
    if (report.approvalState !== 'APPROVED') return error('Only approved report versions can be published', 'NOT_APPROVED', 403, origin, env);
    const publication: Publication = {
      id: crypto.randomUUID(), reportVersionId, publishedById: auth.userId, publishedAt: new Date().toISOString(),
      revokedAt: null, revokedById: null, revokeReason: null, createdAt: new Date().toISOString(),
    };
    createPublication(publication);
    return success(publication, origin, env, 201);
  }
  const revokeMatch = path.match(/^\/publications\/([^/]+)\/revoke$/);
  if (revokeMatch && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    requireRole(auth, 'LEAD_ARCHITECT', 'ADMIN_MANAGEMENT');
    const { reason } = body ?? {};
    if (!reason || reason.length < 5) return error('Revocation reason (min 5 chars) is required', 'VALIDATION_ERROR', 400, origin, env);
    const publication = updatePublication(revokeMatch[1], { revokedAt: new Date().toISOString(), revokedById: auth.userId, revokeReason: reason });
    if (!publication) return error('Publication not found or already revoked', 'NOT_FOUND', 404, origin, env);
    return success(publication, origin, env);
  }
  return error('Publication route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Portal (client-facing) ─────────────────────────────────────────────
async function handlePortal(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/portal' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success(listProjects(), origin, env);
  }
  const portalIdMatch = path.match(/^\/portal\/([^/]+)$/);
  if (portalIdMatch && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const project = getProject(portalIdMatch[1]);
    if (!project) return error('Project not found', 'NOT_FOUND', 404, origin, env);
    return success(project, origin, env);
  }
  return error('Portal route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Media ──────────────────────────────────────────────────────────────
async function handleMedia(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/media' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success(listMedia(), origin, env);
  }
  const mediaIdMatch = path.match(/^\/media\/([^/]+)$/);
  if (mediaIdMatch && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const media = getMedia(mediaIdMatch[1]);
    if (!media) return error('Media not found', 'NOT_FOUND', 404, origin, env);
    return success(media, origin, env);
  }
  if (path === '/media' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const { surveyId, kind, category, caption, storageKey, mimeType, sizeBytes, checksum, capturedAt } = body ?? {};
    if (!surveyId || !kind || !storageKey) return error('surveyId, kind, and storageKey are required', 'VALIDATION_ERROR', 400, origin, env);
    const media: Media = {
      id: crypto.randomUUID(), surveyId, kind, category: category ?? null, caption: caption ?? null,
      storageKey, mimeType: mimeType ?? 'application/octet-stream', sizeBytes: sizeBytes ?? null,
      checksum: checksum ?? null, capturedAt: capturedAt ?? null, uploadedAt: new Date().toISOString(),
    };
    createMedia(media);
    return success(media, origin, env, 201);
  }
  return error('Media route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Planning ───────────────────────────────────────────────────────────
async function handlePlanning(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/planning' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  if (path === '/planning/design-packages' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    const { projectId, discipline } = body ?? {};
    if (!projectId || !discipline) return error('projectId and discipline are required', 'VALIDATION_ERROR', 400, origin, env);
    return success({ id: crypto.randomUUID(), projectId, discipline, isReleased: false }, origin, env, 201);
  }
  return error('Planning route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Acceptance ─────────────────────────────────────────────────────────
async function handleAcceptance(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/acceptance' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  if (path === '/acceptance' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success({ id: crypto.randomUUID() }, origin, env, 201);
  }
  return error('Acceptance route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Approvals ──────────────────────────────────────────────────────────
async function handleApprovals(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/approvals' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  if (path === '/approvals' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success({ id: crypto.randomUUID() }, origin, env, 201);
  }
  return error('Approvals route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Contracts ──────────────────────────────────────────────────────────
async function handleContracts(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/contracts' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  if (path === '/contracts' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success({ id: crypto.randomUUID() }, origin, env, 201);
  }
  return error('Contracts route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Construction ───────────────────────────────────────────────────────
async function handleConstruction(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/construction' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  if (path === '/construction/mobilizations' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success({ id: crypto.randomUUID() }, origin, env, 201);
  }
  return error('Construction route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Governance ─────────────────────────────────────────────────────────
async function handleGovernance(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/governance' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  return error('Governance route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Safety ─────────────────────────────────────────────────────────────
async function handleSafety(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/safety' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  if (path === '/safety/holds' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success({ id: crypto.randomUUID() }, origin, env, 201);
  }
  return error('Safety route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Suppliers ──────────────────────────────────────────────────────────
async function handleSuppliers(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/suppliers' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  if (path === '/suppliers' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success({ id: crypto.randomUUID() }, origin, env, 201);
  }
  return error('Suppliers route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Invoices ───────────────────────────────────────────────────────────
async function handleInvoices(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/invoices' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  if (path === '/invoices' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success({ id: crypto.randomUUID() }, origin, env, 201);
  }
  return error('Invoices route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Worker Reports ─────────────────────────────────────────────────────
async function handleWorkerReports(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/worker-reports' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  if (path === '/worker-reports' && method === 'POST') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success({ id: crypto.randomUUID() }, origin, env, 201);
  }
  return error('Worker reports route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Route: Directory ──────────────────────────────────────────────────────────
async function handleDirectory(
  method: string,
  path: string,
  body: any,
  auth: AuthContext | null,
  origin: string | null,
  env: Env,
): Promise<Response> {
  if (path === '/directory' && method === 'GET') {
    if (!auth) return error('Not authenticated', 'UNAUTHORIZED', 401, origin, env);
    return success([], origin, env);
  }
  return error('Directory route not implemented', 'NOT_IMPLEMENTED', 501, origin, env);
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const origin = request.headers.get('origin');
  const apiPath = path.replace(/^\/api/, '') || '/';

  if (method === 'OPTIONS') {
    return handleCorsPreflight(origin, env);
  }

  if (path === '/api/health' && method === 'GET') {
    return handleHealth(origin, env);
  }

  if (path === '/api/version' && method === 'GET') {
    return json({ version: '1.0.0', service: 'mathmag-api', modules: 7 }, 200, origin, env);
  }

  let body: any = undefined;
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    body = await parseBody(request);
  }

  const auth = getAuth(request);

  try {
    if (apiPath.startsWith('/auth')) return await handleAuth(method, apiPath, body, origin, env);
    if (apiPath.startsWith('/bookings')) return await handleBookings(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/projects')) return await handleProjects(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/surveys')) return await handleSurveys(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/reports')) return await handleReports(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/publications')) return await handlePublications(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/portal')) return await handlePortal(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/media')) return await handleMedia(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/planning')) return await handlePlanning(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/acceptance')) return await handleAcceptance(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/approvals')) return await handleApprovals(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/contracts')) return await handleContracts(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/construction')) return await handleConstruction(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/governance')) return await handleGovernance(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/safety')) return await handleSafety(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/suppliers')) return await handleSuppliers(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/invoices')) return await handleInvoices(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/worker-reports')) return await handleWorkerReports(method, apiPath, body, auth, origin, env);
    if (apiPath.startsWith('/directory')) return await handleDirectory(method, apiPath, body, auth, origin, env);

    return error(`Route ${method} ${path} not found`, 'NOT_FOUND', 404, origin, env);
  } catch (err: any) {
    return error(err?.message ?? 'Unknown error', 'INTERNAL_ERROR', 500, origin, env);
  }
}

// ── Direct execution (local dev: node dist/edge.js) ──────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createServer } = await import('node:http');
  const port = Number(process.env.PORT) || config.API_PORT;
  const server = createServer(handler as any);
  server.listen(port, () => {
    console.log(`MBMS API running on http://localhost:${port}`);
  });
}
