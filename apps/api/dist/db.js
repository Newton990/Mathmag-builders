import postgres from 'postgres';
const tables = [
    'bookings',
    'projects',
    'surveys',
    'report_versions',
    'publications',
    'media',
    'design_packages',
    'design_tasks',
    'acceptance_records',
    'acceptance_verifications',
    'approval_cases',
    'contracts',
    'mobilizations',
    'site_logs',
    'work_holds',
    'delegations',
    'safety_holds',
    'suppliers',
    'invoices',
    'worker_reports',
    'verifications',
    'directory_entries',
];
const initialSchema = [
    `CREATE SEQUENCE IF NOT EXISTS project_reference_seq START WITH 1`,
    ...tables.flatMap((table) => [
        `CREATE TABLE IF NOT EXISTS ${table} (
      id text PRIMARY KEY,
      data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
      project_id text GENERATED ALWAYS AS (data->>'projectId') STORED,
      related_id text GENERATED ALWAYS AS (
        COALESCE(data->>'packageId', data->>'acceptanceId', data->>'workerReportId', data->>'surveyId')
      ) STORED,
      active boolean GENERATED ALWAYS AS (
        CASE WHEN data ? 'isActive' THEN (data->>'isActive')::boolean ELSE NULL END
      ) STORED
    )`,
        `CREATE INDEX IF NOT EXISTS ${table}_project_id_idx ON ${table} (project_id) WHERE project_id IS NOT NULL`,
        `CREATE INDEX IF NOT EXISTS ${table}_related_id_idx ON ${table} (related_id) WHERE related_id IS NOT NULL`,
    ]),
    `CREATE UNIQUE INDEX IF NOT EXISTS bookings_idempotency_key_idx
    ON bookings ((data->>'idempotencyKey'))
    WHERE data ? 'idempotencyKey'`,
];
let sql = null;
let migrationPromise = null;
function getSql() {
    if (!sql) {
        const url = process.env.DATABASE_URL;
        if (!url)
            throw new Error('DATABASE_URL must be set before using PostgreSQL storage.');
        sql = postgres(url, {
            max: Number(process.env.DB_POOL_MAX) || 5,
            connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT_SECONDS) || 10,
            idle_timeout: 20,
        });
    }
    return sql;
}
export async function initializeDatabase() {
    if (migrationPromise)
        return migrationPromise;
    migrationPromise = (async () => {
        const db = getSql();
        await db `SELECT 1`;
        await db `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version integer PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;
        await db.begin(async (transaction) => {
            await transaction `SELECT pg_advisory_xact_lock(742810341)`;
            const applied = await transaction `
        SELECT version FROM schema_migrations WHERE version = 1
      `;
            if (applied.length > 0)
                return;
            for (const statement of initialSchema) {
                await transaction.unsafe(statement);
            }
            await transaction `
        INSERT INTO schema_migrations (version) VALUES (1)
        ON CONFLICT (version) DO NOTHING
      `;
        });
    })().catch((err) => {
        migrationPromise = null;
        throw err;
    });
    return migrationPromise;
}
export async function closeDatabase() {
    if (!sql)
        return;
    const db = sql;
    sql = null;
    migrationPromise = null;
    await db.end({ timeout: 5 });
}
async function createRecord(table, value) {
    const db = getSql();
    const rows = await db `
    INSERT INTO ${db(table)} (id, data)
    VALUES (${value.id}, ${value}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    RETURNING data
  `;
    const row = rows[0];
    if (!row)
        throw new Error(`Failed to insert ${table} record ${value.id}.`);
    return row.data;
}
async function getRecord(table, id) {
    if (!id)
        return undefined;
    const db = getSql();
    const rows = await db `SELECT data FROM ${db(table)} WHERE id = ${id}`;
    return rows[0]?.data;
}
async function updateRecord(table, id, updates, touchUpdatedAt = true) {
    if (!id)
        return undefined;
    const db = getSql();
    const patch = {
        ...updates,
        ...(touchUpdatedAt ? { updatedAt: new Date().toISOString() } : {}),
        id,
    };
    const rows = await db `
    UPDATE ${db(table)}
    SET data = data || ${patch}::jsonb
    WHERE id = ${id}
    RETURNING data
  `;
    return rows[0]?.data;
}
async function listRecords(table, sortKey, filter = {}) {
    const db = getSql();
    const order = db `(data->>${sortKey})::timestamptz DESC`;
    let rows;
    if (filter.projectId !== undefined && filter.relatedId !== undefined && filter.activeOnly) {
        rows = await db `
      SELECT data FROM ${db(table)}
      WHERE project_id = ${filter.projectId} AND related_id = ${filter.relatedId} AND active = true
      ORDER BY ${order}
    `;
    }
    else if (filter.projectId !== undefined && filter.activeOnly) {
        rows = await db `
      SELECT data FROM ${db(table)}
      WHERE project_id = ${filter.projectId} AND active = true
      ORDER BY ${order}
    `;
    }
    else if (filter.projectId !== undefined && filter.relatedId !== undefined) {
        rows = await db `
      SELECT data FROM ${db(table)}
      WHERE project_id = ${filter.projectId} AND related_id = ${filter.relatedId}
      ORDER BY ${order}
    `;
    }
    else if (filter.projectId !== undefined) {
        rows = await db `
      SELECT data FROM ${db(table)}
      WHERE project_id = ${filter.projectId}
      ORDER BY ${order}
    `;
    }
    else if (filter.relatedId !== undefined) {
        rows = await db `
      SELECT data FROM ${db(table)}
      WHERE related_id = ${filter.relatedId}
      ORDER BY ${order}
    `;
    }
    else if (filter.activeOnly) {
        rows = await db `
      SELECT data FROM ${db(table)}
      WHERE active = true
      ORDER BY ${order}
    `;
    }
    else {
        rows = await db `SELECT data FROM ${db(table)} ORDER BY ${order}`;
    }
    return rows.map((row) => row.data);
}
export async function nextProjectSequence() {
    const db = getSql();
    const rows = await db `SELECT nextval('project_reference_seq') AS value`;
    const row = rows[0];
    if (!row)
        throw new Error('Failed to allocate a project reference sequence.');
    return Number(row.value);
}
export async function resetStore() {
    const db = getSql();
    await db.begin(async (transaction) => {
        for (const table of tables) {
            await transaction.unsafe(`TRUNCATE TABLE ${table} CASCADE`);
        }
        await transaction `ALTER SEQUENCE project_reference_seq RESTART WITH 1`;
    });
}
export async function createProjectAndBooking(project, booking) {
    const db = getSql();
    return db.begin(async (transaction) => {
        const idempotencyKey = String(booking.idempotencyKey);
        await transaction `SELECT pg_advisory_xact_lock(hashtext(${idempotencyKey}))`;
        const existing = await transaction `
      SELECT id FROM bookings WHERE data->>'idempotencyKey' = ${idempotencyKey}
    `;
        if (existing.length > 0)
            return false;
        await transaction `
      INSERT INTO projects (id, data)
      VALUES (${project.id}, ${project}::jsonb)
    `;
        await transaction `
      INSERT INTO bookings (id, data)
      VALUES (${booking.id}, ${booking}::jsonb)
    `;
        return true;
    });
}
export const createBooking = (value) => createRecord('bookings', value);
export const getBooking = (id) => getRecord('bookings', id);
export const updateBooking = (id, updates) => updateRecord('bookings', id, updates);
export const listBookings = () => listRecords('bookings', 'createdAt');
export async function findBookingByIdempotencyKey(idempotencyKey) {
    const db = getSql();
    const rows = await db `
    SELECT data FROM bookings WHERE data->>'idempotencyKey' = ${idempotencyKey}
  `;
    return rows[0]?.data;
}
export const createProject = (value) => createRecord('projects', value);
export const getProject = (id) => getRecord('projects', id);
export const updateProject = (id, updates) => updateRecord('projects', id, updates);
export const listProjects = () => listRecords('projects', 'updatedAt');
export const createSurvey = (value) => createRecord('surveys', value);
export const getSurvey = (id) => getRecord('surveys', id);
export const updateSurvey = (id, updates) => updateRecord('surveys', id, updates);
export const listSurveys = () => listRecords('surveys', 'createdAt');
export const createReportVersion = (value) => createRecord('report_versions', value);
export const getReportVersion = (id) => getRecord('report_versions', id);
export const updateReportVersion = (id, updates) => updateRecord('report_versions', id, updates);
export const listReportVersions = () => listRecords('report_versions', 'createdAt');
export const createPublication = (value) => createRecord('publications', value);
export const getPublication = (id) => getRecord('publications', id);
export const updatePublication = (id, updates) => updateRecord('publications', id, updates, false);
export const listPublications = () => listRecords('publications', 'publishedAt');
export const createMedia = (value) => createRecord('media', value);
export const getMedia = (id) => getRecord('media', id);
export const listMedia = () => listRecords('media', 'uploadedAt');
export const createDesignPackage = (value) => createRecord('design_packages', value);
export const getDesignPackage = (id) => getRecord('design_packages', id);
export const listDesignPackages = (projectId) => listRecords('design_packages', 'createdAt', { projectId });
export const updateDesignPackage = (id, updates) => updateRecord('design_packages', id, updates);
export const createDesignTask = (value) => createRecord('design_tasks', value);
export const getDesignTask = (id) => getRecord('design_tasks', id);
export const listDesignTasks = (packageId) => listRecords('design_tasks', 'createdAt', { relatedId: packageId });
export const updateDesignTask = (id, updates) => updateRecord('design_tasks', id, updates);
export const createAcceptanceRecord = (value) => createRecord('acceptance_records', value);
export const getAcceptanceRecord = (id) => getRecord('acceptance_records', id);
export const listAcceptanceRecords = (projectId) => listRecords('acceptance_records', 'createdAt', { projectId });
export const updateAcceptanceRecord = (id, updates) => updateRecord('acceptance_records', id, updates);
export const createAcceptanceVerification = (value) => createRecord('acceptance_verifications', value);
export const listAcceptanceVerifications = (acceptanceId) => listRecords('acceptance_verifications', 'verifiedAt', { relatedId: acceptanceId });
export const createApprovalCase = (value) => createRecord('approval_cases', value);
export const getApprovalCase = (id) => getRecord('approval_cases', id);
export const listApprovalCases = (projectId) => listRecords('approval_cases', 'createdAt', { projectId });
export const updateApprovalCase = (id, updates) => updateRecord('approval_cases', id, updates);
export const createContract = (value) => createRecord('contracts', value);
export const getContract = (id) => getRecord('contracts', id);
export const listContracts = (projectId) => listRecords('contracts', 'createdAt', { projectId });
export const updateContract = (id, updates) => updateRecord('contracts', id, updates);
export const createMobilization = (value) => createRecord('mobilizations', value);
export const getMobilization = (id) => getRecord('mobilizations', id);
export const listMobilizations = (projectId) => listRecords('mobilizations', 'createdAt', { projectId });
export const updateMobilization = (id, updates) => updateRecord('mobilizations', id, updates);
export const createSiteLog = (value) => createRecord('site_logs', value);
export const listSiteLogs = (projectId) => listRecords('site_logs', 'recordedAt', { projectId });
export const createWorkHold = (value) => createRecord('work_holds', value);
export const getWorkHold = (id) => getRecord('work_holds', id);
export const listWorkHolds = (projectId, activeOnly = false) => listRecords('work_holds', 'createdAt', { projectId, activeOnly });
export const updateWorkHold = (id, updates) => updateRecord('work_holds', id, updates);
export const createDelegation = (value) => createRecord('delegations', value);
export const listDelegations = () => listRecords('delegations', 'createdAt');
export const updateDelegation = (id, updates) => updateRecord('delegations', id, updates);
export const createSafetyHold = (value) => createRecord('safety_holds', value);
export const getSafetyHold = (id) => getRecord('safety_holds', id);
export const listSafetyHolds = (projectId, activeOnly = false) => listRecords('safety_holds', 'createdAt', { projectId, activeOnly });
export const updateSafetyHold = (id, updates) => updateRecord('safety_holds', id, updates);
export const createSupplier = (value) => createRecord('suppliers', value);
export const getSupplier = (id) => getRecord('suppliers', id);
export const listSuppliers = () => listRecords('suppliers', 'createdAt');
export const updateSupplier = (id, updates) => updateRecord('suppliers', id, updates);
export const createInvoice = (value) => createRecord('invoices', value);
export const getInvoice = (id) => getRecord('invoices', id);
export const listInvoices = (projectId) => listRecords('invoices', 'createdAt', { projectId });
export const updateInvoice = (id, updates) => updateRecord('invoices', id, updates);
export const createWorkerReport = (value) => createRecord('worker_reports', value);
export const getWorkerReport = (id) => getRecord('worker_reports', id);
export const listWorkerReports = (projectId) => listRecords('worker_reports', 'submittedAt', { projectId });
export const updateWorkerReport = (id, updates) => updateRecord('worker_reports', id, updates);
export const createVerification = (value) => createRecord('verifications', value);
export const listVerifications = (workerReportId) => listRecords('verifications', 'verifiedAt', { relatedId: workerReportId });
export const createDirectoryEntry = (value) => createRecord('directory_entries', value);
export const getDirectoryEntry = (id) => getRecord('directory_entries', id);
export const listDirectoryEntries = () => listRecords('directory_entries', 'createdAt');
export const updateDirectoryEntry = (id, updates) => updateRecord('directory_entries', id, updates);
//# sourceMappingURL=db.js.map