import postgres from 'postgres';

type RecordValue = { id: string; [key: string]: any };
type TableName =
  | 'bookings'
  | 'projects'
  | 'surveys'
  | 'report_versions'
  | 'publications'
  | 'media'
  | 'design_packages'
  | 'design_tasks'
  | 'acceptance_records'
  | 'acceptance_verifications'
  | 'approval_cases'
  | 'contracts'
  | 'mobilizations'
  | 'site_logs'
  | 'work_holds'
  | 'delegations'
  | 'safety_holds'
  | 'suppliers'
  | 'invoices'
  | 'worker_reports'
  | 'verifications'
  | 'directory_entries';

const tables: TableName[] = [
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

let sql: ReturnType<typeof postgres> | null = null;
let migrationPromise: Promise<void> | null = null;

function getSql(): ReturnType<typeof postgres> {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL must be set before using PostgreSQL storage.');
    sql = postgres(url, {
      max: Number(process.env.DB_POOL_MAX) || 5,
      connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT_SECONDS) || 10,
      idle_timeout: 20,
    });
  }
  return sql;
}

export async function initializeDatabase(): Promise<void> {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    const db = getSql();
    await db`SELECT 1`;
    await db`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version integer PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;

    await db.begin(async (transaction) => {
      await transaction`SELECT pg_advisory_xact_lock(742810341)`;
      const applied = await transaction`
        SELECT version FROM schema_migrations WHERE version = 1
      `;
      if (applied.length > 0) return;

      for (const statement of initialSchema) {
        await transaction.unsafe(statement);
      }

      await transaction`
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

export async function closeDatabase(): Promise<void> {
  if (!sql) return;
  const db = sql;
  sql = null;
  migrationPromise = null;
  await db.end({ timeout: 5 });
}

async function createRecord<T extends RecordValue>(table: TableName, value: T): Promise<T> {
  const db = getSql();
  const rows = await db`
    INSERT INTO ${db(table)} (id, data)
    VALUES (${value.id}, ${value as any}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    RETURNING data
  `;
  const row = rows[0];
  if (!row) throw new Error(`Failed to insert ${table} record ${value.id}.`);
  return row.data as T;
}

async function getRecord<T extends RecordValue>(table: TableName, id: string | undefined): Promise<T | undefined> {
  if (!id) return undefined;
  const db = getSql();
  const rows = await db`SELECT data FROM ${db(table)} WHERE id = ${id}`;
  return rows[0]?.data as T | undefined;
}

async function updateRecord<T extends RecordValue>(
  table: TableName,
  id: string | undefined,
  updates: Partial<T>,
  touchUpdatedAt = true,
): Promise<T | undefined> {
  if (!id) return undefined;
  const db = getSql();
  const patch = {
    ...updates,
    ...(touchUpdatedAt ? { updatedAt: new Date().toISOString() } : {}),
    id,
  };
  const rows = await db`
    UPDATE ${db(table)}
    SET data = data || ${patch as any}::jsonb
    WHERE id = ${id}
    RETURNING data
  `;
  return rows[0]?.data as T | undefined;
}

async function listRecords<T extends RecordValue>(
  table: TableName,
  sortKey: string,
  filter: { projectId?: string | undefined; relatedId?: string | undefined; activeOnly?: boolean } = {},
): Promise<T[]> {
  const db = getSql();
  const order = db`(data->>${sortKey})::timestamptz DESC`;
  let rows;

  if (filter.projectId !== undefined && filter.relatedId !== undefined && filter.activeOnly) {
    rows = await db`
      SELECT data FROM ${db(table)}
      WHERE project_id = ${filter.projectId} AND related_id = ${filter.relatedId} AND active = true
      ORDER BY ${order}
    `;
  } else if (filter.projectId !== undefined && filter.activeOnly) {
    rows = await db`
      SELECT data FROM ${db(table)}
      WHERE project_id = ${filter.projectId} AND active = true
      ORDER BY ${order}
    `;
  } else if (filter.projectId !== undefined && filter.relatedId !== undefined) {
    rows = await db`
      SELECT data FROM ${db(table)}
      WHERE project_id = ${filter.projectId} AND related_id = ${filter.relatedId}
      ORDER BY ${order}
    `;
  } else if (filter.projectId !== undefined) {
    rows = await db`
      SELECT data FROM ${db(table)}
      WHERE project_id = ${filter.projectId}
      ORDER BY ${order}
    `;
  } else if (filter.relatedId !== undefined) {
    rows = await db`
      SELECT data FROM ${db(table)}
      WHERE related_id = ${filter.relatedId}
      ORDER BY ${order}
    `;
  } else if (filter.activeOnly) {
    rows = await db`
      SELECT data FROM ${db(table)}
      WHERE active = true
      ORDER BY ${order}
    `;
  } else {
    rows = await db`SELECT data FROM ${db(table)} ORDER BY ${order}`;
  }

  return rows.map((row) => row.data as T);
}

export async function nextProjectSequence(): Promise<number> {
  const db = getSql();
  const rows = await db`SELECT nextval('project_reference_seq') AS value`;
  const row = rows[0];
  if (!row) throw new Error('Failed to allocate a project reference sequence.');
  return Number(row.value);
}

export async function resetStore(): Promise<void> {
  const db = getSql();
  await db.begin(async (transaction) => {
    for (const table of tables) {
      await transaction.unsafe(`TRUNCATE TABLE ${table} CASCADE`);
    }
    await transaction`ALTER SEQUENCE project_reference_seq RESTART WITH 1`;
  });
}

export async function createProjectAndBooking(
  project: RecordValue,
  booking: RecordValue,
): Promise<boolean> {
  const db = getSql();
  return db.begin(async (transaction) => {
    const idempotencyKey = String(booking.idempotencyKey);
    await transaction`SELECT pg_advisory_xact_lock(hashtext(${idempotencyKey}))`;
    const existing = await transaction`
      SELECT id FROM bookings WHERE data->>'idempotencyKey' = ${idempotencyKey}
    `;
    if (existing.length > 0) return false;

    await transaction`
      INSERT INTO projects (id, data)
      VALUES (${project.id}, ${project as any}::jsonb)
    `;
    await transaction`
      INSERT INTO bookings (id, data)
      VALUES (${booking.id}, ${booking as any}::jsonb)
    `;
    return true;
  });
}

export const createBooking = (value: RecordValue) => createRecord('bookings', value);
export const getBooking = (id: string | undefined) => getRecord('bookings', id);
export const updateBooking = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('bookings', id, updates);
export const listBookings = () => listRecords('bookings', 'createdAt');

export async function findBookingByIdempotencyKey(idempotencyKey: string): Promise<RecordValue | undefined> {
  const db = getSql();
  const rows = await db`
    SELECT data FROM bookings WHERE data->>'idempotencyKey' = ${idempotencyKey}
  `;
  return rows[0]?.data as RecordValue | undefined;
}

export const createProject = (value: RecordValue) => createRecord('projects', value);
export const getProject = (id: string | undefined) => getRecord('projects', id);
export const updateProject = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('projects', id, updates);
export const listProjects = () => listRecords('projects', 'updatedAt');

export const createSurvey = (value: RecordValue) => createRecord('surveys', value);
export const getSurvey = (id: string | undefined) => getRecord('surveys', id);
export const updateSurvey = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('surveys', id, updates);
export const listSurveys = () => listRecords('surveys', 'createdAt');

export const createReportVersion = (value: RecordValue) => createRecord('report_versions', value);
export const getReportVersion = (id: string | undefined) => getRecord('report_versions', id);
export const updateReportVersion = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('report_versions', id, updates);
export const listReportVersions = () => listRecords('report_versions', 'createdAt');

export const createPublication = (value: RecordValue) => createRecord('publications', value);
export const getPublication = (id: string | undefined) => getRecord('publications', id);
export const updatePublication = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('publications', id, updates, false);
export const listPublications = () => listRecords('publications', 'publishedAt');

export const createMedia = (value: RecordValue) => createRecord('media', value);
export const getMedia = (id: string | undefined) => getRecord('media', id);
export const listMedia = () => listRecords('media', 'uploadedAt');

export const createDesignPackage = (value: RecordValue) => createRecord('design_packages', value);
export const getDesignPackage = (id: string | undefined) => getRecord('design_packages', id);
export const listDesignPackages = (projectId?: string) => listRecords('design_packages', 'createdAt', { projectId });
export const updateDesignPackage = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('design_packages', id, updates);

export const createDesignTask = (value: RecordValue) => createRecord('design_tasks', value);
export const getDesignTask = (id: string | undefined) => getRecord('design_tasks', id);
export const listDesignTasks = (packageId?: string) => listRecords('design_tasks', 'createdAt', { relatedId: packageId });
export const updateDesignTask = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('design_tasks', id, updates);

export const createAcceptanceRecord = (value: RecordValue) => createRecord('acceptance_records', value);
export const getAcceptanceRecord = (id: string | undefined) => getRecord('acceptance_records', id);
export const listAcceptanceRecords = (projectId?: string) => listRecords('acceptance_records', 'createdAt', { projectId });
export const updateAcceptanceRecord = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('acceptance_records', id, updates);

export const createAcceptanceVerification = (value: RecordValue) => createRecord('acceptance_verifications', value);
export const listAcceptanceVerifications = (acceptanceId: string) => listRecords('acceptance_verifications', 'verifiedAt', { relatedId: acceptanceId });

export const createApprovalCase = (value: RecordValue) => createRecord('approval_cases', value);
export const getApprovalCase = (id: string | undefined) => getRecord('approval_cases', id);
export const listApprovalCases = (projectId?: string) => listRecords('approval_cases', 'createdAt', { projectId });
export const updateApprovalCase = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('approval_cases', id, updates);

export const createContract = (value: RecordValue) => createRecord('contracts', value);
export const getContract = (id: string | undefined) => getRecord('contracts', id);
export const listContracts = (projectId?: string) => listRecords('contracts', 'createdAt', { projectId });
export const updateContract = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('contracts', id, updates);

export const createMobilization = (value: RecordValue) => createRecord('mobilizations', value);
export const getMobilization = (id: string | undefined) => getRecord('mobilizations', id);
export const listMobilizations = (projectId?: string) => listRecords('mobilizations', 'createdAt', { projectId });
export const updateMobilization = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('mobilizations', id, updates);

export const createSiteLog = (value: RecordValue) => createRecord('site_logs', value);
export const listSiteLogs = (projectId?: string) => listRecords('site_logs', 'recordedAt', { projectId });

export const createWorkHold = (value: RecordValue) => createRecord('work_holds', value);
export const getWorkHold = (id: string | undefined) => getRecord('work_holds', id);
export const listWorkHolds = (projectId?: string, activeOnly = false) => listRecords('work_holds', 'createdAt', { projectId, activeOnly });
export const updateWorkHold = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('work_holds', id, updates);

export const createDelegation = (value: RecordValue) => createRecord('delegations', value);
export const listDelegations = () => listRecords('delegations', 'createdAt');
export const updateDelegation = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('delegations', id, updates);

export const createSafetyHold = (value: RecordValue) => createRecord('safety_holds', value);
export const getSafetyHold = (id: string | undefined) => getRecord('safety_holds', id);
export const listSafetyHolds = (projectId?: string, activeOnly = false) => listRecords('safety_holds', 'createdAt', { projectId, activeOnly });
export const updateSafetyHold = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('safety_holds', id, updates);

export const createSupplier = (value: RecordValue) => createRecord('suppliers', value);
export const getSupplier = (id: string | undefined) => getRecord('suppliers', id);
export const listSuppliers = () => listRecords('suppliers', 'createdAt');
export const updateSupplier = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('suppliers', id, updates);

export const createInvoice = (value: RecordValue) => createRecord('invoices', value);
export const getInvoice = (id: string | undefined) => getRecord('invoices', id);
export const listInvoices = (projectId?: string) => listRecords('invoices', 'createdAt', { projectId });
export const updateInvoice = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('invoices', id, updates);

export const createWorkerReport = (value: RecordValue) => createRecord('worker_reports', value);
export const getWorkerReport = (id: string | undefined) => getRecord('worker_reports', id);
export const listWorkerReports = (projectId?: string) => listRecords('worker_reports', 'submittedAt', { projectId });
export const updateWorkerReport = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('worker_reports', id, updates);

export const createVerification = (value: RecordValue) => createRecord('verifications', value);
export const listVerifications = (workerReportId: string) => listRecords('verifications', 'verifiedAt', { relatedId: workerReportId });

export const createDirectoryEntry = (value: RecordValue) => createRecord('directory_entries', value);
export const getDirectoryEntry = (id: string | undefined) => getRecord('directory_entries', id);
export const listDirectoryEntries = () => listRecords('directory_entries', 'createdAt');
export const updateDirectoryEntry = (id: string | undefined, updates: Partial<RecordValue>) => updateRecord('directory_entries', id, updates);
