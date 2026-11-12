// ================================================================================
// MBMS — Database Adapter (Wasmer Edge Compatible)
// Uses postgres.js when DATABASE_URL is set (external PostgreSQL on Wasmer),
// otherwise falls back to in-memory Maps (local dev / no-DB).
// ================================================================================

import postgres from 'postgres';

let sql: ReturnType<typeof postgres> | null = null;

export function getSql(): ReturnType<typeof postgres> | null {
  return sql;
}

export function initSql(): void {
  const url = process.env.DATABASE_URL;
  if (url) {
    sql = postgres(url, { max: 5, connect_timeout: 5 });
  }
}

initSql();

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
  designPackages.clear();
  designTasks.clear();
  acceptanceRecords.clear();
  acceptanceVerifications.clear();
  approvalCases.clear();
  contracts.clear();
  mobilizations.clear();
  siteLogs.clear();
  workHolds.clear();
  delegations.clear();
  safetyHolds.clear();
  suppliers.clear();
  invoices.clear();
  workerReports.clear();
  verifications.clear();
  directoryEntries.clear();
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

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 2 — Planning & Design Packages
// ═════════════════════════════════════════════════════════════════════════════

interface DesignPackage {
  id: string;
  projectId: string;
  discipline: string;
  isReleased: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DesignTask {
  id: string;
  packageId: string;
  title: string;
  status: string;
  assignedToId: string | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const designPackages = new Map<string, DesignPackage>();
const designTasks = new Map<string, DesignTask>();

export function createDesignPackage(pkg: DesignPackage): void {
  designPackages.set(pkg.id, pkg);
}

export function getDesignPackage(id: string): DesignPackage | undefined {
  return designPackages.get(id);
}

export function listDesignPackages(projectId?: string): DesignPackage[] {
  let items = Array.from(designPackages.values());
  if (projectId) items = items.filter((p) => p.projectId === projectId);
  return items.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateDesignPackage(
  id: string,
  updates: Partial<DesignPackage>,
): DesignPackage | undefined {
  const existing = designPackages.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  designPackages.set(id, updated);
  return updated;
}

export function createDesignTask(task: DesignTask): void {
  designTasks.set(task.id, task);
}

export function getDesignTask(id: string): DesignTask | undefined {
  return designTasks.get(id);
}

export function listDesignTasks(packageId?: string): DesignTask[] {
  let items = Array.from(designTasks.values());
  if (packageId) items = items.filter((t) => t.packageId === packageId);
  return items.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateDesignTask(
  id: string,
  updates: Partial<DesignTask>,
): DesignTask | undefined {
  const existing = designTasks.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  designTasks.set(id, updated);
  return updated;
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 3 — Client Acceptance
// ═════════════════════════════════════════════════════════════════════════════

interface AcceptanceRecord {
  id: string;
  projectId: string;
  method: string;
  status: string;
  acceptedById: string | null;
  acceptedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AcceptanceVerification {
  id: string;
  acceptanceId: string;
  verifiedById: string;
  decision: string; // VERIFIED / RETURNED_FOR_CLARIFICATION / REJECTED
  comments: string | null;
  verifiedAt: string;
}

const acceptanceRecords = new Map<string, AcceptanceRecord>();
const acceptanceVerifications = new Map<string, AcceptanceVerification>();

export function createAcceptanceRecord(record: AcceptanceRecord): void {
  acceptanceRecords.set(record.id, record);
}

export function getAcceptanceRecord(id: string): AcceptanceRecord | undefined {
  return acceptanceRecords.get(id);
}

export function listAcceptanceRecords(projectId?: string): AcceptanceRecord[] {
  let items = Array.from(acceptanceRecords.values());
  if (projectId) items = items.filter((a) => a.projectId === projectId);
  return items.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateAcceptanceRecord(
  id: string,
  updates: Partial<AcceptanceRecord>,
): AcceptanceRecord | undefined {
  const existing = acceptanceRecords.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  acceptanceRecords.set(id, updated);
  return updated;
}

export function createAcceptanceVerification(
  verification: AcceptanceVerification,
): void {
  acceptanceVerifications.set(verification.id, verification);
}

export function listAcceptanceVerifications(
  acceptanceId: string,
): AcceptanceVerification[] {
  return Array.from(acceptanceVerifications.values())
    .filter((v) => v.acceptanceId === acceptanceId)
    .sort((a, b) =>
      new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 4 — Approvals
// ═════════════════════════════════════════════════════════════════════════════

interface ApprovalCase {
  id: string;
  projectId: string;
  type: string; // e.g. "PERMIT", "DESIGN", "VARIATION"
  status: string; // OPEN / IN_PROGRESS / SUBMITTED / RETURNED / CLEARED / REJECTED
  decidedById: string | null;
  decidedAt: string | null;
  decision: string | null; // APPROVED / REJECTED / RETURNED
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

const approvalCases = new Map<string, ApprovalCase>();

export function createApprovalCase(caseItem: ApprovalCase): void {
  approvalCases.set(caseItem.id, caseItem);
}

export function getApprovalCase(id: string): ApprovalCase | undefined {
  return approvalCases.get(id);
}

export function listApprovalCases(projectId?: string): ApprovalCase[] {
  let items = Array.from(approvalCases.values());
  if (projectId) items = items.filter((c) => c.projectId === projectId);
  return items.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateApprovalCase(
  id: string,
  updates: Partial<ApprovalCase>,
): ApprovalCase | undefined {
  const existing = approvalCases.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  approvalCases.set(id, updated);
  return updated;
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 5 — Contracts
// ═════════════════════════════════════════════════════════════════════════════

interface Contract {
  id: string;
  projectId: string;
  status: string; // DRAFT / SENT / UNDER_NEGOTIATION / EXECUTED / TERMINATED / EXPIRED
  engagementType: string;
  executedById: string | null;
  executedAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

const contracts = new Map<string, Contract>();

export function createContract(contract: Contract): void {
  contracts.set(contract.id, contract);
}

export function getContract(id: string): Contract | undefined {
  return contracts.get(id);
}

export function listContracts(projectId?: string): Contract[] {
  let items = Array.from(contracts.values());
  if (projectId) items = items.filter((c) => c.projectId === projectId);
  return items.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateContract(
  id: string,
  updates: Partial<Contract>,
): Contract | undefined {
  const existing = contracts.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  contracts.set(id, updated);
  return updated;
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 6 — Construction
// ═════════════════════════════════════════════════════════════════════════════

interface Mobilization {
  id: string;
  projectId: string;
  status: string; // PLANNED / MOBILIZED / DEMOBILIZED
  mobilizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SiteLog {
  id: string;
  projectId: string;
  entry: string;
  recordedById: string | null;
  recordedAt: string;
}

interface WorkHold {
  id: string;
  projectId: string;
  reason: string;
  isActive: boolean;
  liftedById: string | null;
  liftedAt: string | null;
  liftReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const mobilizations = new Map<string, Mobilization>();
const siteLogs = new Map<string, SiteLog>();
const workHolds = new Map<string, WorkHold>();

export function createMobilization(m: Mobilization): void {
  mobilizations.set(m.id, m);
}

export function getMobilization(id: string): Mobilization | undefined {
  return mobilizations.get(id);
}

export function listMobilizations(projectId?: string): Mobilization[] {
  let items = Array.from(mobilizations.values());
  if (projectId) items = items.filter((m) => m.projectId === projectId);
  return items.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateMobilization(
  id: string,
  updates: Partial<Mobilization>,
): Mobilization | undefined {
  const existing = mobilizations.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  mobilizations.set(id, updated);
  return updated;
}

export function createSiteLog(log: SiteLog): void {
  siteLogs.set(log.id, log);
}

export function listSiteLogs(projectId?: string): SiteLog[] {
  let items = Array.from(siteLogs.values());
  if (projectId) items = items.filter((l) => l.projectId === projectId);
  return items.sort((a, b) =>
    new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
}

export function createWorkHold(hold: WorkHold): void {
  workHolds.set(hold.id, hold);
}

export function getWorkHold(id: string): WorkHold | undefined {
  return workHolds.get(id);
}

export function listWorkHolds(projectId?: string, activeOnly = false): WorkHold[] {
  let items = Array.from(workHolds.values());
  if (projectId) items = items.filter((h) => h.projectId === projectId);
  if (activeOnly) items = items.filter((h) => h.isActive);
  return items.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateWorkHold(
  id: string,
  updates: Partial<WorkHold>,
): WorkHold | undefined {
  const existing = workHolds.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  workHolds.set(id, updated);
  return updated;
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 7 — Central Administration & Governance
// ═════════════════════════════════════════════════════════════════════════════

interface Delegation {
  id: string;
  fromRole: string;
  toRole: string;
  scope: string;
  status: string; // ACTIVE / SUSPENDED / REVOKED / EXPIRED
  delegatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SafetyHold {
  id: string;
  projectId: string;
  reason: string;
  isActive: boolean;
  liftedById: string | null;
  liftedAt: string | null;
  liftReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  bankAccount: string | null;
  beneficiaryVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Invoice {
  id: string;
  projectId: string;
  supplierId: string | null;
  amountKes: number;
  status: string; // PENDING / PARTIALLY_PAID / PAID / WAIVED
  paidById: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WorkerReport {
  id: string;
  projectId: string;
  title: string;
  content: string;
  submittedById: string | null;
  submittedAt: string;
}

interface Verification {
  id: string;
  workerReportId: string;
  verifiedById: string;
  decision: string; // VERIFIED / RETURNED / REJECTED
  comments: string | null;
  verifiedAt: string;
}

interface DirectoryEntry {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const delegations = new Map<string, Delegation>();
const safetyHolds = new Map<string, SafetyHold>();
const suppliers = new Map<string, Supplier>();
const invoices = new Map<string, Invoice>();
const workerReports = new Map<string, WorkerReport>();
const verifications = new Map<string, Verification>();
const directoryEntries = new Map<string, DirectoryEntry>();

// ── Delegations ──────────────────────────────────────────────────────────────
export function createDelegation(d: Delegation): void {
  delegations.set(d.id, d);
}

export function listDelegations(): Delegation[] {
  return Array.from(delegations.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateDelegation(
  id: string,
  updates: Partial<Delegation>,
): Delegation | undefined {
  const existing = delegations.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  delegations.set(id, updated);
  return updated;
}

// ── Safety holds ─────────────────────────────────────────────────────────────
export function createSafetyHold(hold: SafetyHold): void {
  safetyHolds.set(hold.id, hold);
}

export function getSafetyHold(id: string): SafetyHold | undefined {
  return safetyHolds.get(id);
}

export function listSafetyHolds(projectId?: string, activeOnly = false): SafetyHold[] {
  let items = Array.from(safetyHolds.values());
  if (projectId) items = items.filter((h) => h.projectId === projectId);
  if (activeOnly) items = items.filter((h) => h.isActive);
  return items.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateSafetyHold(
  id: string,
  updates: Partial<SafetyHold>,
): SafetyHold | undefined {
  const existing = safetyHolds.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  safetyHolds.set(id, updated);
  return updated;
}

// ── Suppliers ────────────────────────────────────────────────────────────────
export function createSupplier(s: Supplier): void {
  suppliers.set(s.id, s);
}

export function getSupplier(id: string): Supplier | undefined {
  return suppliers.get(id);
}

export function listSuppliers(): Supplier[] {
  return Array.from(suppliers.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateSupplier(
  id: string,
  updates: Partial<Supplier>,
): Supplier | undefined {
  const existing = suppliers.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  suppliers.set(id, updated);
  return updated;
}

// ── Invoices ─────────────────────────────────────────────────────────────────
export function createInvoice(inv: Invoice): void {
  invoices.set(inv.id, inv);
}

export function getInvoice(id: string): Invoice | undefined {
  return invoices.get(id);
}

export function listInvoices(projectId?: string): Invoice[] {
  let items = Array.from(invoices.values());
  if (projectId) items = items.filter((i) => i.projectId === projectId);
  return items.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateInvoice(
  id: string,
  updates: Partial<Invoice>,
): Invoice | undefined {
  const existing = invoices.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  invoices.set(id, updated);
  return updated;
}

// ── Worker reports ───────────────────────────────────────────────────────────
export function createWorkerReport(r: WorkerReport): void {
  workerReports.set(r.id, r);
}

export function getWorkerReport(id: string): WorkerReport | undefined {
  return workerReports.get(id);
}

export function listWorkerReports(projectId?: string): WorkerReport[] {
  let items = Array.from(workerReports.values());
  if (projectId) items = items.filter((r) => r.projectId === projectId);
  return items.sort((a, b) =>
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export function updateWorkerReport(
  id: string,
  updates: Partial<WorkerReport>,
): WorkerReport | undefined {
  const existing = workerReports.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  workerReports.set(id, updated);
  return updated;
}

// ── Verifications ────────────────────────────────────────────────────────────
export function createVerification(v: Verification): void {
  verifications.set(v.id, v);
}

export function listVerifications(workerReportId: string): Verification[] {
  return Array.from(verifications.values())
    .filter((v) => v.workerReportId === workerReportId)
    .sort((a, b) =>
      new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
    );
}

// ── Directory ────────────────────────────────────────────────────────────────
export function createDirectoryEntry(entry: DirectoryEntry): void {
  directoryEntries.set(entry.id, entry);
}

export function getDirectoryEntry(id: string): DirectoryEntry | undefined {
  return directoryEntries.get(id);
}

export function listDirectoryEntries(): DirectoryEntry[] {
  return Array.from(directoryEntries.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateDirectoryEntry(
  id: string,
  updates: Partial<DirectoryEntry>,
): DirectoryEntry | undefined {
  const existing = directoryEntries.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  directoryEntries.set(id, updated);
  return updated;
}
