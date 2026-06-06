import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

/** Initializes SQLite database and executes bootstrap schema. */
export const initDatabase = (baseDir: string): Database.Database => {
  const dbPath = process.env.SYSTEMAI_DB_PATH
    ? path.resolve(process.cwd(), process.env.SYSTEMAI_DB_PATH)
    : path.join(baseDir, 'systemai.db');

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  const schemaPath = path.resolve(process.cwd(), 'systemai/database/schema/init.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  return db;
};
