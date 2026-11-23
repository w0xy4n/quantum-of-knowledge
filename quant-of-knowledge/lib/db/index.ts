import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleLite, type PgliteDatabase } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { initialMigration } from "./migration";
import * as schema from "./schema";

type Database = NodePgDatabase<typeof schema>;

type State = {
  db?: Database;
  ready?: Promise<void>;
  pool?: Pool;
  lite?: PGlite;
};

const globalState = globalThis as typeof globalThis & { __evermindDb?: State };
const state = (globalState.__evermindDb ??= {});

function createDatabase(): Database {
  if (process.env.DATABASE_URL) {
    state.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
    return drizzlePg(state.pool, { schema });
  }

  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  const useMemory = isBuild || (process.env.NODE_ENV === "production" && process.env.ALLOW_PGLITE_PRODUCTION !== "true");
  const dataDir = process.env.PGLITE_DATA_DIR || path.join(process.cwd(), "data", "pglite");
  if (!useMemory) mkdirSync(dataDir, { recursive: true });
  state.lite = new PGlite(useMemory ? undefined : dataDir);
  return drizzleLite(state.lite, { schema }) as unknown as Database;
}

export const db: Database = (state.db ??= createDatabase());

export async function ensureDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production" && process.env.ALLOW_PGLITE_PRODUCTION !== "true") {
    throw new Error("DATABASE_URL is required in production. PGlite is only a local development fallback.");
  }
  state.ready ??= (async () => {
    if (state.pool) {
      await state.pool.query(initialMigration);
    } else if (state.lite) {
      await state.lite.waitReady;
      await state.lite.exec(initialMigration);
    }
  })().catch((error) => {
    state.ready = undefined;
    throw error;
  });
  return state.ready;
}

export async function executeRaw(sql: string, params: unknown[] = []): Promise<unknown> {
  await ensureDatabase();
  if (state.pool) return (await state.pool.query(sql, params)).rows;
  if (state.lite) return (await state.lite.query(sql, params)).rows;
  throw new Error("Database is not initialized");
}
