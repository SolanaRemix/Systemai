import { createHash, randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  AdminDashboardSchema,
  DeveloperDashboardSchema,
  IPC_CHANNELS,
  UserDashboardSchema,
  type AdminDashboard,
  type DeveloperDashboard,
  type UserDashboard
} from '../../src/ipc/channels';

const TABLES = ['telemetry_snapshots', 'snapshot_metadata', 'execution_logs', 'policy_store'] as const;
const count = (db: Database.Database, table: (typeof TABLES)[number]): number =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

const audit = (db: Database.Database, message: string): void => {
  db.prepare('INSERT INTO execution_logs (level, message, source) VALUES (?, ?, ?)').run('info', message, 'admin');
};

/** Aggregates real persisted telemetry/logs for the end-user dashboard. */
export const getUserDashboard = (db: Database.Database): UserDashboard => {
  const latest =
    (db
      .prepare(
        'SELECT cpu_usage, cpu_temp, ram_used, ram_total, gpu_usage, disk_health, thermal_condition, throttling FROM telemetry_snapshots ORDER BY id DESC LIMIT 1'
      )
      .get() as UserDashboard['latest'] | undefined) ?? null;
  const avg = db
    .prepare(
      'SELECT COALESCE(AVG(cpu_usage),0) AS cpu, COALESCE(AVG(gpu_usage),0) AS gpu, COUNT(*) AS samples FROM (SELECT cpu_usage, gpu_usage FROM telemetry_snapshots ORDER BY id DESC LIMIT 100)'
    )
    .get() as { cpu: number; gpu: number; samples: number };
  const mode = db.prepare("SELECT policy_value FROM policy_store WHERE policy_key='performanceMode'").get() as
    | { policy_value: string }
    | undefined;
  const recentLogs = db.prepare('SELECT * FROM execution_logs ORDER BY id DESC LIMIT 10').all();
  const health = latest
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            100 -
              latest.cpu_usage * 0.3 -
              (latest.ram_used / Math.max(latest.ram_total, 1)) * 100 * 0.3 -
              (100 - latest.disk_health) * 0.2 -
              (latest.throttling ? 10 : 0)
          )
        )
      )
    : 100;
  return UserDashboardSchema.parse({
    latest,
    averages: { cpu: Math.round(avg.cpu * 10) / 10, gpu: Math.round(avg.gpu * 10) / 10, samples: avg.samples },
    recentLogs,
    performanceMode: mode?.policy_value ?? 'balanced',
    health
  });
};

/** Developer dashboard: table sizes, log breakdowns, IPC API catalog and recent errors. */
export const getDeveloperDashboard = (db: Database.Database): DeveloperDashboard =>
  DeveloperDashboardSchema.parse({
    tables: TABLES.map((name) => ({ name, rows: count(db, name) })),
    logLevels: db.prepare('SELECT level, COUNT(*) AS count FROM execution_logs GROUP BY level ORDER BY count DESC').all(),
    logSources: db.prepare('SELECT source, COUNT(*) AS count FROM execution_logs GROUP BY source ORDER BY count DESC').all(),
    channels: IPC_CHANNELS,
    recentErrors: db
      .prepare("SELECT * FROM execution_logs WHERE level IN ('error','warn') ORDER BY id DESC LIMIT 25")
      .all()
  });

/** Admin dashboard: policies, rollback snapshots and audit trail. */
export const getAdminDashboard = (db: Database.Database): AdminDashboard =>
  AdminDashboardSchema.parse({
    policies: db.prepare('SELECT policy_key, policy_value, updated_at FROM policy_store ORDER BY policy_key').all(),
    snapshots: db.prepare('SELECT * FROM snapshot_metadata ORDER BY created_at DESC, rowid DESC LIMIT 50').all(),
    audit: db.prepare("SELECT * FROM execution_logs WHERE source='admin' ORDER BY id DESC LIMIT 50").all(),
    totals: {
      logs: count(db, 'execution_logs'),
      snapshots: count(db, 'snapshot_metadata'),
      telemetry: count(db, 'telemetry_snapshots'),
      policies: count(db, 'policy_store')
    }
  });

export const setPolicy = (db: Database.Database, key: string, value: string): void => {
  db.prepare(
    'INSERT INTO policy_store (policy_key, policy_value) VALUES (?, ?) ON CONFLICT(policy_key) DO UPDATE SET policy_value=excluded.policy_value, updated_at=CURRENT_TIMESTAMP'
  ).run(key, value);
  audit(db, `Policy set: ${key}`);
};

export const deletePolicy = (db: Database.Database, key: string): boolean => {
  const changed = db.prepare('DELETE FROM policy_store WHERE policy_key = ?').run(key).changes > 0;
  if (changed) audit(db, `Policy deleted: ${key}`);
  return changed;
};

export const createSnapshot = (db: Database.Database, reason: string): string => {
  const id = `snap_${randomUUID()}`;
  const hash = createHash('sha256')
    .update(JSON.stringify({ id, reason, policies: db.prepare('SELECT * FROM policy_store ORDER BY policy_key').all() }))
    .digest('hex');
  db.prepare('INSERT INTO snapshot_metadata (id, reason, integrity_hash, rollback_ready) VALUES (?, ?, ?, 1)').run(
    id,
    reason,
    hash
  );
  audit(db, `Snapshot created: ${id}`);
  return id;
};

export const purgeLogs = (db: Database.Database, olderThanDays: number): number => {
  const removed = db
    .prepare("DELETE FROM execution_logs WHERE created_at < datetime('now', ?)")
    .run(`-${Math.floor(olderThanDays)} days`).changes;
  audit(db, `Purged ${removed} logs older than ${olderThanDays} days`);
  return removed;
};
