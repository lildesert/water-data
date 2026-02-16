import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

const defaultDbPath = path.resolve(process.cwd(), "data", "water.sqlite");
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : defaultDbPath;

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(1);
}

const backupDir = path.resolve(process.cwd(), "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(backupDir, `water-${timestamp}.sqlite`);
const escapedBackup = backupPath.replace(/'/g, "''");

const db = new Database(dbPath, { readonly: false });
try {
  db.exec(`VACUUM INTO '${escapedBackup}'`);
  console.log(`Backup created at ${backupPath}`);
} finally {
  db.close();
}
