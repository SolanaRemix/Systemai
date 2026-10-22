import os from 'node:os';
import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { validatePowerShellCommand } from '../backend/powershell-bridge';
import { advanceWorkflow, createWorkflow, listWorkflows, rollbackWorkflow } from '../backend/workflow-engine';
import { TelemetryCollector } from '../backend/monitor-engine';
import {
  createSnapshot,
  deletePolicy,
  getAdminDashboard,
  getDeveloperDashboard,
  getSecurityPosture,
  getUserDashboard,
  listLogs,
  verifySnapshot,
  purgeLogs,
  setPolicy
} from '../backend/dashboard-service';
import {
  CreateSnapshotSchema,
  CreateWorkflowSchema,
  SanitizeSchema,
  WorkflowIdSchema,
  LogQuerySchema,
  VerifySnapshotSchema,
  DeletePolicySchema,
  PurgeLogsSchema,
  SetPolicySchema,
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

const collector = new TelemetryCollector();
const getTelemetry = (): TelemetrySnapshot => TelemetrySchema.parse(collector.collect());

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

  ipcMain.handle('dashboard:getUser', () => getUserDashboard(db));
  ipcMain.handle('dashboard:getDeveloper', () => getDeveloperDashboard(db));
  ipcMain.handle('dashboard:getAdmin', () => getAdminDashboard(db));
  ipcMain.handle('admin:setPolicy', (_, payload: unknown): { ok: true } => {
    const { key, value } = SetPolicySchema.parse(payload);
    setPolicy(db, key, value);
    return { ok: true };
  });
  ipcMain.handle('admin:deletePolicy', (_, payload: unknown): { ok: boolean } => ({
    ok: deletePolicy(db, DeletePolicySchema.parse(payload).key)
  }));
  ipcMain.handle('admin:createSnapshot', (_, payload: unknown): { id: string } => ({
    id: createSnapshot(db, CreateSnapshotSchema.parse(payload).reason)
  }));
  ipcMain.handle('admin:purgeLogs', (_, payload: unknown): { removed: number } => ({
    removed: purgeLogs(db, PurgeLogsSchema.parse(payload).olderThanDays)
  }));
  ipcMain.handle('logs:list', (_, payload: unknown) => listLogs(db, LogQuerySchema.parse(payload ?? {})));
  ipcMain.handle('snapshot:verify', (_, payload: unknown) => verifySnapshot(db, VerifySnapshotSchema.parse(payload).id));
  ipcMain.handle('sanitizer:check', (_, payload: unknown) => validatePowerShellCommand(SanitizeSchema.parse(payload).command));
  ipcMain.handle('workflow:list', () => listWorkflows(db));
  ipcMain.handle('workflow:create', (_, payload: unknown) => {
    const { title, command } = CreateWorkflowSchema.parse(payload);
    return createWorkflow(db, title, command);
  });
  ipcMain.handle('workflow:advance', (_, payload: unknown) => advanceWorkflow(db, WorkflowIdSchema.parse(payload).id));
  ipcMain.handle('workflow:rollback', (_, payload: unknown) => rollbackWorkflow(db, WorkflowIdSchema.parse(payload).id));
  ipcMain.handle('security:getPosture', () => getSecurityPosture(db));
};
