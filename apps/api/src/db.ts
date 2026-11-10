// ================================================================================
// MBMS — Database Adapter (Wasmer Edge Compatible)
// Uses postgres.js which works in serverless/edge environments.
// Connects to external PostgreSQL via DATABASE_URL Wasmer secret.
// ================================================================================

import postgres from 'postgres';

let sql: ReturnType<typeof postgres> | null = null;

export function getSql() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set. Configure it in Wasmer Edge secrets.');
    }
    sql = postgres(databaseUrl, {
      max: 1,
      connect_timeout: 10,
    });
  }
  return sql;
}

export async function closeSql() {
  if (sql) {
    await sql.end();
    sql = null;
  }
}

export async function query(
  strings: TemplateStringsArray,
  ...params: unknown[]
): Promise<any[]> {
  const result = await (getSql() as any)(strings, ...params);
  return result;
}

export async function queryOne(
  strings: TemplateStringsArray,
  ...params: unknown[]
): Promise<any | null> {
  const result = await (getSql() as any)(strings, ...params);
  return result[0] ?? null;
}
