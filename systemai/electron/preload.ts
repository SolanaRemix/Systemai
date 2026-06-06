import { contextBridge, ipcRenderer } from 'electron';
import {
  ChatRequestSchema,
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
}

const api: SystemAIApi = {
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  getTelemetry: () => ipcRenderer.invoke('monitor:getTelemetry'),
  sendChat: (request) => ipcRenderer.invoke('chat:send', ChatRequestSchema.parse(request)),
  setPerformanceMode: (mode) =>
    ipcRenderer.invoke('settings:setPerformanceMode', SetPerformanceModeSchema.parse({ mode })),
  setAutoStart: (enabled) => ipcRenderer.invoke('settings:setAutoStart', SetAutoStartSchema.parse({ enabled }))
};

contextBridge.exposeInMainWorld('systemai', api);
