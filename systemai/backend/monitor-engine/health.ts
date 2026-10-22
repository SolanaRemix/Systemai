import { execFile } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';
import type Database from 'better-sqlite3';
import type { HealthReport, ServiceHealth } from '../../src/ipc/channels';

const run = (cmd: string, args: string[]): Promise<string | null> =>
  new Promise((resolve) => {
    execFile(cmd, args, { timeout: 4000, windowsHide: true }, (err, stdout) => resolve(err ? null : stdout.toString()));
  });

const probePort = (port: number, host = '127.0.0.1'): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = net.connect({ port, host, timeout: 800 });
    socket.once('connect', () => (socket.destroy(), resolve(true)));
    socket.once('timeout', () => (socket.destroy(), resolve(false)));
    socket.once('error', () => resolve(false));
  });

const ps = (script: string): Promise<string | null> =>
  run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]);

/** Windows Defender real-time protection state; 'unknown' where it cannot be determined. */
export const readDefender = async (): Promise<'on' | 'off' | 'unknown'> => {
  if (os.platform() !== 'win32') return 'unknown';
  const out = await ps('(Get-MpComputerStatus).RealTimeProtectionEnabled');
  const v = out?.trim().toLowerCase();
  return v === 'true' ? 'on' : v === 'false' ? 'off' : 'unknown';
};

/** Firewall is 'on' only when all profiles are enabled (Windows) or ufw reports active (Linux). */
export const readFirewall = async (): Promise<'on' | 'off' | 'unknown'> => {
  if (os.platform() === 'win32') {
    const out = await ps('(Get-NetFirewallProfile | Where-Object { -not $_.Enabled }).Count');
    const n = Number(out?.trim());
    return out === null || !Number.isFinite(n) ? 'unknown' : n === 0 ? 'on' : 'off';
  }
  if (os.platform() === 'linux') {
    const out = await run('ufw', ['status']);
    if (out === null) return 'unknown';
    return /Status:\s*active/i.test(out) ? 'on' : 'off';
  }
  return 'unknown';
};

const ageSeconds = (db: Database.Database, sql: string): number | null => {
  const r = db.prepare(sql).get() as { age: number | null } | undefined;
  return r?.age ?? null;
};

/** Collects service and security health from the live system and database. */
export const collectHealth = async (db: Database.Database): Promise<HealthReport> => {
  const services: ServiceHealth[] = [];

  try {
    db.prepare('SELECT 1').get();
    services.push({ name: 'Database', status: 'healthy', detail: 'SQLite responding' });
  } catch (e) {
    services.push({ name: 'Database', status: 'offline', detail: e instanceof Error ? e.message : 'query failed' });
  }

  const age = ageSeconds(db, "SELECT CAST((julianday('now') - julianday(MAX(created_at))) * 86400 AS INTEGER) AS age FROM telemetry_snapshots");
  services.push(
    age === null
      ? { name: 'Telemetry', status: 'degraded', detail: 'No samples recorded yet' }
      : age <= 30
        ? { name: 'Telemetry', status: 'healthy', detail: `Last sample ${age}s ago` }
        : { name: 'Telemetry', status: 'degraded', detail: `Last sample ${age}s ago` }
  );

  const stuck = (db.prepare("SELECT COUNT(*) AS n FROM workflows WHERE stage IN ('approve','execute','verify') AND updated_at < datetime('now','-1 day')").get() as { n: number }).n;
  services.push({
    name: 'Workflow Engine',
    status: stuck > 0 ? 'degraded' : 'healthy',
    detail: stuck > 0 ? `${stuck} workflow(s) idle for over 24h` : 'No stalled workflows'
  });

  const up = await probePort(4201);
  services.push({
    name: 'AI Orchestrator',
    status: up ? 'healthy' : 'offline',
    detail: up ? 'Listening on 4201' : 'Not running (start with SYSTEMAI_RUN_SERVICES=true)'
  });

  const [defender, firewall] = await Promise.all([readDefender(), readFirewall()]);
  return { services, security: { defender, firewall }, checkedAt: Date.now() };
};
