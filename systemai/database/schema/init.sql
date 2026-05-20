PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS telemetry_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cpu_usage REAL NOT NULL,
  cpu_temp REAL NOT NULL,
  ram_used INTEGER NOT NULL,
  ram_total INTEGER NOT NULL,
  gpu_usage REAL NOT NULL,
  disk_health REAL NOT NULL,
  net_up REAL NOT NULL,
  net_down REAL NOT NULL,
  thermal_condition TEXT NOT NULL,
  throttling INTEGER NOT NULL CHECK (throttling IN (0,1))
);

CREATE TABLE IF NOT EXISTS snapshot_metadata (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NOT NULL,
  integrity_hash TEXT NOT NULL,
  rollback_ready INTEGER NOT NULL CHECK (rollback_ready IN (0,1))
);

CREATE TABLE IF NOT EXISTS execution_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_store (
  policy_key TEXT PRIMARY KEY,
  policy_value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
