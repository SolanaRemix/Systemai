import { contextBridge, ipcRenderer } from 'electron';
import {
  ChatRequestSchema,
  CreateSnapshotSchema,
  DeletePolicySchema,
  PurgeLogsSchema,
  SetPolicySchema,
  type AdminDashboard,
  type DeveloperDashboard,
  type UserDashboard,
  SetAutoStartSchema,
  SetPerformanceModeSchema,
  type AppInfo,
  type ChatRequest,
  type ChatResponse,
  type PerformanceMode,
  type TelemetrySnapshot
} from '../src/ipc/channels';

interface SystemAIApi {
  getAppInfo: () => Promise<AppInfo>;
  getTelemetry: () => Promise<TelemetrySnapshot>;
  sendChat: (request: ChatRequest) => Promise<ChatResponse>;
  setPerformanceMode: (mode: PerformanceMode) => Promise<{ ok: true }>;
  setAutoStart: (enabled: boolean) => Promise<{ ok: true; enabled: boolean }>;
  getUserDashboard: () => Promise<UserDashboard>;
  getDeveloperDashboard: () => Promise<DeveloperDashboard>;
  getAdminDashboard: () => Promise<AdminDashboard>;
  setPolicy: (key: string, value: string) => Promise<{ ok: true }>;
  deletePolicy: (key: string) => Promise<{ ok: boolean }>;
  createSnapshot: (reason: string) => Promise<{ id: string }>;
  purgeLogs: (olderThanDays: number) => Promise<{ removed: number }>;
}

const api: SystemAIApi = {
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  getTelemetry: () => ipcRenderer.invoke('monitor:getTelemetry'),
  sendChat: (request) => ipcRenderer.invoke('chat:send', ChatRequestSchema.parse(request)),
  setPerformanceMode: (mode) =>
    ipcRenderer.invoke('settings:setPerformanceMode', SetPerformanceModeSchema.parse({ mode })),
  setAutoStart: (enabled) => ipcRenderer.invoke('settings:setAutoStart', SetAutoStartSchema.parse({ enabled })),
  getUserDashboard: () => ipcRenderer.invoke('dashboard:getUser'),
  getDeveloperDashboard: () => ipcRenderer.invoke('dashboard:getDeveloper'),
  getAdminDashboard: () => ipcRenderer.invoke('dashboard:getAdmin'),
  setPolicy: (key, value) => ipcRenderer.invoke('admin:setPolicy', SetPolicySchema.parse({ key, value })),
  deletePolicy: (key) => ipcRenderer.invoke('admin:deletePolicy', DeletePolicySchema.parse({ key })),
  createSnapshot: (reason) => ipcRenderer.invoke('admin:createSnapshot', CreateSnapshotSchema.parse({ reason })),
  purgeLogs: (olderThanDays) => ipcRenderer.invoke('admin:purgeLogs', PurgeLogsSchema.parse({ olderThanDays }))
};

contextBridge.exposeInMainWorld('systemai', api);
