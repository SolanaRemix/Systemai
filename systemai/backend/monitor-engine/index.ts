import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import type { TelemetrySnapshot } from '../../src/ipc/channels';

export interface TelemetryEvent {
  source: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export const normalizeTelemetryEvent = (event: TelemetryEvent): TelemetryEvent => ({
  ...event,
  source: event.source.toLowerCase().trim()
});

type CpuTimes = { idle: number; total: number }[];

const readCpuTimes = (): CpuTimes =>
  os.cpus().map((c) => {
    const t = c.times;
    return { idle: t.idle, total: t.user + t.nice + t.sys + t.idle + t.irq };
  });

const round1 = (n: number): number => Math.round(n * 10) / 10;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, n));

const readFile = (p: string): string | null => {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
};

/** Max temperature (°C) across Linux thermal zones; 0 when unavailable. */
const readTemperature = (): number => {
  try {
    const temps = fs
      .readdirSync('/sys/class/thermal')
      .filter((d) => d.startsWith('thermal_zone'))
      .map((d) => Number(readFile(`/sys/class/thermal/${d}/temp`)))
      .filter((n) => Number.isFinite(n) && n > 0)
      .map((n) => n / 1000);
    return temps.length ? Math.max(...temps) : 0;
  } catch {
    return 0;
  }
};

/** Cumulative [rxBytes, txBytes] over non-loopback interfaces (Linux). */
const readNetBytes = (): [number, number] => {
  const raw = readFile('/proc/net/dev');
  if (!raw) return [0, 0];
  let rx = 0;
  let tx = 0;
  for (const line of raw.split('\n').slice(2)) {
    const [name, rest] = line.split(':');
    if (!rest || name.trim() === 'lo') continue;
    const cols = rest.trim().split(/\s+/).map(Number);
    rx += cols[0] || 0;
    tx += cols[8] || 0;
  }
  return [rx, tx];
};

/** Cumulative [readBytes, writeBytes] across physical-looking block devices (Linux). */
const readDiskBytes = (): [number, number] => {
  const raw = readFile('/proc/diskstats');
  if (!raw) return [0, 0];
  let r = 0;
  let w = 0;
  for (const line of raw.split('\n')) {
    const c = line.trim().split(/\s+/);
    if (c.length < 10 || !/^(sd[a-z]+|vd[a-z]+|xvd[a-z]+|nvme\d+n\d+|mmcblk\d+)$/.test(c[2])) continue;
    r += Number(c[5]) * 512;
    w += Number(c[9]) * 512;
  }
  return [r, w];
};

const readActiveConnections = (): number =>
  ['/proc/net/tcp', '/proc/net/tcp6'].reduce((n, f) => {
    const raw = readFile(f);
    return n + (raw ? Math.max(raw.trim().split('\n').length - 1, 0) : 0);
  }, 0);

const readGpu = (): TelemetrySnapshot['gpu'] => {
  const empty = { usage: 0, vramTotalMb: 0, vramUsedMb: 0, temperature: 0 };
  try {
    const out = execFileSync(
      'nvidia-smi',
      ['--query-gpu=utilization.gpu,memory.total,memory.used,temperature.gpu', '--format=csv,noheader,nounits'],
      { timeout: 1500, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const [usage, total, used, temp] = out.split('\n')[0].split(',').map((v) => Number(v.trim()));
    return [usage, total, used, temp].every(Number.isFinite)
      ? { usage, vramTotalMb: total, vramUsedMb: used, temperature: temp }
      : empty;
  } catch {
    return empty;
  }
};

const readDiskUsage = (): number => {
  try {
    const s = fs.statfsSync(os.platform() === 'win32' ? process.cwd().slice(0, 3) : '/');
    return s.blocks ? clamp(((s.blocks - s.bfree) / s.blocks) * 100) : 0;
  } catch {
    return 0;
  }
};

/**
 * Collects real host telemetry. Rate metrics are computed from deltas between successive calls.
 * Metrics the host cannot provide (e.g. GPU without nvidia-smi, temperature without thermal zones)
 * are reported as 0 rather than invented.
 */
export class TelemetryCollector {
  private prevCpu: CpuTimes = readCpuTimes();
  private prevNet = readNetBytes();
  private prevDisk = readDiskBytes();
  private prevAt = Date.now();

  collect(): TelemetrySnapshot {
    const now = Date.now();
    const seconds = Math.max((now - this.prevAt) / 1000, 0.001);

    const cpu = readCpuTimes();
    const perCore = cpu.map((c, i) => {
      const p = this.prevCpu[i] ?? c;
      const total = c.total - p.total;
      return total > 0 ? round1(clamp((1 - (c.idle - p.idle) / total) * 100)) : 0;
    });
    const usage = perCore.length ? round1(perCore.reduce((a, b) => a + b, 0) / perCore.length) : 0;

    const net = readNetBytes();
    const disk = readDiskBytes();
    const mbps = (cur: number, prev: number): number => round1(Math.max(cur - prev, 0) / seconds / 1_000_000);
    const upMbps = round1(Math.max(net[1] - this.prevNet[1], 0) * 8 / seconds / 1_000_000);
    const downMbps = round1(Math.max(net[0] - this.prevNet[0], 0) * 8 / seconds / 1_000_000);
    const readMbps = mbps(disk[0], this.prevDisk[0]);
    const writeMbps = mbps(disk[1], this.prevDisk[1]);

    this.prevCpu = cpu;
    this.prevNet = net;
    this.prevDisk = disk;
    this.prevAt = now;

    const total = os.totalmem();
    const free = os.freemem();
    const temperature = round1(readTemperature());
    const usedPercent = round1(readDiskUsage());

    return {
      cpu: { usage, temperature, perCore },
      memory: { total, used: total - free, available: free, pressure: round1(clamp(((total - free) / total) * 100)) },
      gpu: readGpu(),
      disk: { readMbps, writeMbps, health: round1(clamp(100 - Math.max(usedPercent - 90, 0) * 5)), usedPercent },
      network: { upMbps, downMbps, activeConnections: readActiveConnections() },
      thermal: {
        throttling: temperature >= 95,
        condition: temperature >= 85 ? 'hot' : temperature >= 70 ? 'warm' : 'normal'
      }
    };
  }
}
