import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { HealthReportSchema } from '../src/ipc/channels';
import { collectHealth } from '../backend/monitor-engine/health';

const mk = (): Database.Database => {
  const db = new Database(':memory:');
  db.exec(fs.readFileSync(path.resolve(__dirname, '../database/schema/init.sql'), 'utf8'));
  return db;
};

describe('collectHealth', () => {
  it('reports schema-valid live status', async () => {
    const db = mk();
    const r = HealthReportSchema.parse(await collectHealth(db));
    const by = Object.fromEntries(r.services.map((s) => [s.name, s]));
    expect(by.Database.status).toBe('healthy');
    expect(by.Telemetry.status).toBe('degraded');
    expect(by['Workflow Engine'].status).toBe('healthy');
  });

  it('flags stalled workflows and fresh telemetry', async () => {
    const db = mk();
    db.prepare("INSERT INTO workflows (id,title,command,risk,stage,updated_at) VALUES ('w','t','c','low','approve','2000-01-01')").run();
    db.prepare("INSERT INTO telemetry_snapshots (cpu_usage,cpu_temp,ram_used,ram_total,gpu_usage,disk_health,net_up,net_down,thermal_condition,throttling) VALUES (1,1,1,2,1,99,0,0,'normal',0)").run();
    const by = Object.fromEntries((await collectHealth(db)).services.map((s) => [s.name, s]));
    expect(by['Workflow Engine'].status).toBe('degraded');
    expect(by.Telemetry.status).toBe('healthy');
  });
});
