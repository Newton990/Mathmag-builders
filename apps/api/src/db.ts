// ================================================================================
// MBMS — In-Memory Database Adapter (Wasmer Edge Compatible)
// No external database required. Data persists for the lifetime of the process.
// ================================================================================

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

// ── In-memory stores ─────────────────────────────────────────────────────────
const bookings = new Map<string, Booking>();
const projects = new Map<string, Project>();
const surveys = new Map<string, Survey>();
const reportVersions = new Map<string, ReportVersion>();
const publications = new Map<string, Publication>();
const mediaStore = new Map<string, Media>();

// ── Counters ─────────────────────────────────────────────────────────────────
let projectSequenceCounter = 0;

export function resetStore() {
  bookings.clear();
  projects.clear();
  surveys.clear();
  reportVersions.clear();
  publications.clear();
  mediaStore.clear();
  projectSequenceCounter = 0;
}

export function getProjectSequenceCounter(): number {
  return projectSequenceCounter;
}

export function incrementProjectSequenceCounter(): void {
  projectSequenceCounter += 1;
}

// ── Booking CRUD ─────────────────────────────────────────────────────────────
export function createBooking(booking: Booking): void {
  bookings.set(booking.id, booking);
}

export function getBooking(id: string): Booking | undefined {
  return bookings.get(id);
}

export function updateBooking(id: string, updates: Partial<Booking>): Booking | undefined {
  const existing = bookings.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  bookings.set(id, updated);
  return updated;
}

export function listBookings(): Booking[] {
  return Array.from(bookings.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function findBookingByIdempotencyKey(idempotencyKey: string): Booking | undefined {
  return Array.from(bookings.values()).find(b => b.idempotencyKey === idempotencyKey);
}

// ── Project CRUD ─────────────────────────────────────────────────────────────
export function createProject(project: Project): void {
  projects.set(project.id, project);
}

export function getProject(id: string): Project | undefined {
  return projects.get(id);
}

export function updateProject(id: string, updates: Partial<Project>): Project | undefined {
  const existing = projects.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  projects.set(id, updated);
  return updated;
}

export function listProjects(): Project[] {
  return Array.from(projects.values()).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// ── Survey CRUD ──────────────────────────────────────────────────────────────
export function createSurvey(survey: Survey): void {
  surveys.set(survey.id, survey);
}

export function getSurvey(id: string): Survey | undefined {
  return surveys.get(id);
}

export function updateSurvey(id: string, updates: Partial<Survey>): Survey | undefined {
  const existing = surveys.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  surveys.set(id, updated);
  return updated;
}

export function listSurveys(): Survey[] {
  return Array.from(surveys.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ── Report CRUD ──────────────────────────────────────────────────────────────
export function createReportVersion(report: ReportVersion): void {
  reportVersions.set(report.id, report);
}

export function getReportVersion(id: string): ReportVersion | undefined {
  return reportVersions.get(id);
}

export function updateReportVersion(id: string, updates: Partial<ReportVersion>): ReportVersion | undefined {
  const existing = reportVersions.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  reportVersions.set(id, updated);
  return updated;
}

export function listReportVersions(): ReportVersion[] {
  return Array.from(reportVersions.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ── Publication CRUD ─────────────────────────────────────────────────────────
export function createPublication(publication: Publication): void {
  publications.set(publication.id, publication);
}

export function getPublication(id: string): Publication | undefined {
  return publications.get(id);
}

export function updatePublication(id: string, updates: Partial<Publication>): Publication | undefined {
  const existing = publications.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  publications.set(id, updated);
  return updated;
}

export function listPublications(): Publication[] {
  return Array.from(publications.values()).sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// ── Media CRUD ───────────────────────────────────────────────────────────────
export function createMedia(media: Media): void {
  mediaStore.set(media.id, media);
}

export function getMedia(id: string): Media | undefined {
  return mediaStore.get(id);
}

export function listMedia(): Media[] {
  return Array.from(mediaStore.values()).sort((a, b) =>
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}
