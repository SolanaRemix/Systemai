import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSnapshot,
  deletePolicy,
  getAdminDashboard,
  getDeveloperDashboard,
  getUserDashboard,
  purgeLogs,
  setPolicy
} from '../backend/dashboard-service';

let db: Database.Database;
beforeEach(() => {
  db = new Database(':memory:');
  db.exec(fs.readFileSync(path.resolve(__dirname, '../database/schema/init.sql'), 'utf8'));
});

describe('dashboard service', () => {
  it('returns an empty user dashboard', () => {
    const d = getUserDashboard(db);
    expect(d.latest).toBeNull();
    expect(d.health).toBe(100);
  });

  it('aggregates telemetry', () => {
    db.prepare(
      "INSERT INTO telemetry_snapshots (cpu_usage,cpu_temp,ram_used,ram_total,gpu_usage,disk_health,net_up,net_down,thermal_condition,throttling) VALUES (50,60,4,8,20,90,1,1,'normal',0)"
    ).run();
    const d = getUserDashboard(db);
    expect(d.averages.cpu).toBe(50);
    expect(d.health).toBeLessThan(100);
  });

  it('manages policies, snapshots, purge with audit', () => {
    setPolicy(db, 'performanceMode', 'eco');
    expect(getUserDashboard(db).performanceMode).toBe('eco');
    const id = createSnapshot(db, 'before change');
    const admin = getAdminDashboard(db);
    expect(admin.snapshots[0].id).toBe(id);
    expect(admin.snapshots[0].integrity_hash).toHaveLength(64);
    expect(admin.audit.length).toBe(2);
    expect(deletePolicy(db, 'performanceMode')).toBe(true);
    expect(deletePolicy(db, 'nope')).toBe(false);
    db.prepare("INSERT INTO execution_logs (created_at, level, message, source) VALUES ('2000-01-01','error','old','x')").run();
    expect(purgeLogs(db, 30)).toBe(1);
    const dev = getDeveloperDashboard(db);
    expect(dev.channels.length).toBeGreaterThan(5);
    expect(dev.tables.find((t) => t.name === 'policy_store')?.rows).toBe(0);
  });
});

describe('logs and snapshot verification', () => {
  it('filters logs and escapes wildcards', async () => {
    const { listLogs, verifySnapshot } = await import('../backend/dashboard-service');
    db.prepare("INSERT INTO execution_logs (level,message,source) VALUES ('error','disk 100% full','a'),('info','ok','b')").run();
    expect(listLogs(db, { level: 'error' })).toHaveLength(1);
    expect(listLogs(db, { search: '100%' })).toHaveLength(1);
    expect(listLogs(db, { search: '%' })).toHaveLength(1);
    expect(listLogs(db, {})).toHaveLength(2);
    const id = createSnapshot(db, 'x');
    expect(verifySnapshot(db, id)).toEqual({ exists: true, wellFormed: true, rollbackReady: true });
    expect(verifySnapshot(db, 'missing').exists).toBe(false);
  });
});
