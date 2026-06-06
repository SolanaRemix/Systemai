import os from 'node:os';
import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import {
  AppInfoSchema,
  ChatRequestSchema,
  ChatResponseSchema,
  PerformanceModeSchema,
  SetAutoStartSchema,
  SetPerformanceModeSchema,
  TelemetrySchema,
  type AppInfo,
  type ChatResponse,
  type TelemetrySnapshot
} from '../src/ipc/channels';

const random = (min: number, max: number): number => Math.round((Math.random() * (max - min) + min) * 10) / 10;

const getTelemetry = (): TelemetrySnapshot =>
  TelemetrySchema.parse({
    cpu: {
      usage: random(8, 71),
      temperature: random(40, 85),
      perCore: Array.from({ length: os.cpus().length }, () => random(5, 95))
    },
    memory: {
      total: os.totalmem(),
      used: os.totalmem() - os.freemem(),
      available: os.freemem(),
      pressure: random(5, 90)
    },
    gpu: {
      usage: random(3, 93),
      vramTotalMb: 8192,
      vramUsedMb: random(1000, 7900),
      temperature: random(45, 88)
    },
    disk: {
      readMbps: random(5, 380),
      writeMbps: random(3, 220),
      health: random(74, 99),
      usedPercent: random(30, 82)
    },
    network: {
      upMbps: random(0.2, 25),
      downMbps: random(0.8, 120),
      activeConnections: Math.round(random(12, 340))
    },
    thermal: {
      throttling: Math.random() > 0.88,
      condition: ['normal', 'warm', 'hot'][Math.floor(Math.random() * 3)] as 'normal' | 'warm' | 'hot'
    }
  });

/** Registers validated IPC handlers for the renderer bridge. */
export const registerIpcHandlers = (
  db: Database.Database,
  setAutoStart: (enabled: boolean) => void,
  getAutoStart: () => boolean
): void => {
  ipcMain.handle('app:getInfo', (): AppInfo =>
    AppInfoSchema.parse({
      os: os.platform(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      version: process.env.npm_package_version ?? '0.1.0'
    })
  );

  ipcMain.handle('monitor:getTelemetry', () => {
    const payload = getTelemetry();
    const stmt = db.prepare(
      `INSERT INTO telemetry_snapshots (cpu_usage, cpu_temp, ram_used, ram_total, gpu_usage, disk_health, net_up, net_down, thermal_condition, throttling)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      payload.cpu.usage,
      payload.cpu.temperature,
      payload.memory.used,
      payload.memory.total,
      payload.gpu.usage,
      payload.disk.health,
      payload.network.upMbps,
      payload.network.downMbps,
      payload.thermal.condition,
      payload.thermal.throttling ? 1 : 0
    );
    return payload;
  });

  ipcMain.handle('chat:send', (_, req: unknown): ChatResponse => {
    const request = ChatRequestSchema.parse(req);
    const response: ChatResponse = ChatResponseSchema.parse({
      id: `msg_${Date.now()}`,
      timestamp: Date.now(),
      content: `Acknowledged: ${request.content}\n\nSystem context loaded with ${request.context.recentEvents.length} recent events.`,
      risk: request.content.toLowerCase().includes('delete') ? 'high' : 'low'
    });

    db.prepare('INSERT INTO execution_logs (level, message, source) VALUES (?, ?, ?)').run(
      'info',
      `Chat request processed: ${request.content.slice(0, 120)}`,
      'chatbot'
    );
    return response;
  });

  ipcMain.handle('settings:setPerformanceMode', (_, payload: unknown): { ok: true } => {
    const parsed = SetPerformanceModeSchema.parse(payload);
    PerformanceModeSchema.parse(parsed.mode);
    db.prepare('INSERT INTO policy_store (policy_key, policy_value) VALUES (?, ?) ON CONFLICT(policy_key) DO UPDATE SET policy_value=excluded.policy_value')
      .run('performanceMode', parsed.mode);
    return { ok: true };
  });

  ipcMain.handle('settings:setAutoStart', (_, payload: unknown): { ok: true; enabled: boolean } => {
    const parsed = SetAutoStartSchema.parse(payload);
    setAutoStart(parsed.enabled);
    return { ok: true, enabled: getAutoStart() };
  });
};
