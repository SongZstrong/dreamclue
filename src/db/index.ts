import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;
let sqlClient: postgres.Sql | null = null;

function parsePositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DB_CONNECT_TIMEOUT = parsePositiveInteger(
  process.env.DB_CONNECT_TIMEOUT,
  10
);
const DB_IDLE_TIMEOUT = parsePositiveInteger(process.env.DB_IDLE_TIMEOUT, 20);
const DB_KEEP_ALIVE = parsePositiveInteger(process.env.DB_KEEP_ALIVE, 30);
const DB_RETRY_ATTEMPTS = parsePositiveInteger(
  process.env.DB_RETRY_ATTEMPTS,
  2
);

function createSqlClient() {
  const connectionString = process.env.DATABASE_URL!;

  return postgres(connectionString, {
    prepare: false,
    connect_timeout: DB_CONNECT_TIMEOUT,
    idle_timeout: DB_IDLE_TIMEOUT,
    keep_alive: DB_KEEP_ALIVE,
  });
}

export function getSqlClient() {
  if (sqlClient) return sqlClient;
  sqlClient = createSqlClient();
  return sqlClient;
}

export async function getDb() {
  if (db) return db;
  db = drizzle(getSqlClient(), { schema });
  return db;
}

export async function resetDbClients() {
  const currentClient = sqlClient;
  sqlClient = null;
  db = null;

  if (!currentClient) {
    return;
  }

  try {
    await currentClient.end({ timeout: 0 });
  } catch {
    // Ignore teardown errors while forcing a reconnect.
  }
}

function isRetryableConnectionError(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined;

  return (
    code === 'CONNECTION_CLOSED' ||
    code === 'CONNECTION_ENDED' ||
    code === 'CONNECTION_DESTROYED' ||
    code === 'CONNECT_TIMEOUT'
  );
}

export async function withDbConnectionRetry<T>(
  operation: () => Promise<T>,
  logger: Pick<typeof console, 'warn'> = console
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;

      if (!isRetryableConnectionError(error) || attempt >= DB_RETRY_ATTEMPTS) {
        throw error;
      }

      logger.warn(
        `Database connection dropped (${String((error as { code?: string }).code)}), retrying with a fresh client (${attempt}/${DB_RETRY_ATTEMPTS - 1})`
      );
      await resetDbClients();
    }
  }
}

/**
 * Database connection with Drizzle
 * https://orm.drizzle.team/docs/connect-overview
 *
 * Drizzle <> PostgreSQL
 * https://orm.drizzle.team/docs/get-started-postgresql
 *
 * Get Started with Drizzle and Neon
 * https://orm.drizzle.team/docs/get-started/neon-new
 *
 * Drizzle with Neon Postgres
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-neon
 *
 * Drizzle <> Neon Postgres
 * https://orm.drizzle.team/docs/connect-neon
 *
 * Drizzle with Supabase Database
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
 */
