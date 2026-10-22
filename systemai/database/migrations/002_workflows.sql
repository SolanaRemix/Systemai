-- Adds persisted orchestrator workflows (also included in schema/init.sql, idempotent)
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  title TEXT NOT NULL,
  command TEXT NOT NULL,
  risk TEXT NOT NULL CHECK (risk IN ('low','medium','high')),
  stage TEXT NOT NULL CHECK (stage IN ('preview','approve','execute','verify','done','rollback'))
);
