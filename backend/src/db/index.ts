import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMA_SQL } from "./schema.js";
import { seedIfEmpty } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "..", "pgdata");

let dbInstance: PGlite | null = null;

/**
 * Boots the embedded PGlite (WASM Postgres) engine, persisted to ./pgdata
 * so demo data survives restarts. Creates the schema and seeds realistic
 * demo data on first run only.
 */
export async function getDb(): Promise<PGlite> {
  if (dbInstance) return dbInstance;

  const db = new PGlite(DATA_DIR);
  await db.waitReady;

  await db.exec(SCHEMA_SQL);
  const { seeded } = await seedIfEmpty(db);
  if (seeded) {
    console.log("[db] Seeded demo data (companies, contacts, deals, reminders)");
  } else {
    console.log("[db] Existing data found, skipping seed");
  }

  dbInstance = db;
  return db;
}
