import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "./schema";

const defaultDbPath = path.resolve(process.cwd(), "data", "water.sqlite");
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : defaultDbPath;
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

const migrationsTable = "__drizzle_migrations";
const migrationsFolder = path.resolve(process.cwd(), "drizzle");

function baselineLegacyDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ${migrationsTable} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at NUMERIC
    );
  `);

  const existingUserTables = new Set(
    sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('meter_readings', 'bills')",
      )
      .all()
      .map((row) => String((row as { name: string }).name)),
  );
  const hasLegacySchema =
    existingUserTables.has("meter_readings") && existingUserTables.has("bills");

  const migrationCount = sqlite
    .prepare(`SELECT COUNT(*) as count FROM ${migrationsTable}`)
    .get() as { count: number };

  if (!hasLegacySchema || migrationCount.count > 0) {
    return;
  }

  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  if (!fs.existsSync(journalPath)) {
    return;
  }

  const journal = JSON.parse(
    fs.readFileSync(journalPath, "utf-8"),
  ) as {
    entries: Array<{ tag: string; when: number }>;
  };
  const insertMigration = sqlite.prepare(
    `INSERT INTO ${migrationsTable} (hash, created_at) VALUES (?, ?)`,
  );

  for (const entry of journal.entries) {
    const migrationPath = path.join(migrationsFolder, `${entry.tag}.sql`);
    if (!fs.existsSync(migrationPath)) {
      continue;
    }
    const sql = fs.readFileSync(migrationPath, "utf-8");
    const hash = crypto.createHash("sha256").update(sql).digest("hex");
    insertMigration.run(hash, entry.when);
  }
}

baselineLegacyDatabase();

export const db = drizzle(sqlite, { schema });

migrate(db, {
  migrationsFolder,
});
