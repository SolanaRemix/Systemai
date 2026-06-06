import type {
  AppInfo,
  ChatRequest,
  ChatResponse,
  PerformanceMode,
  TelemetrySnapshot
} from '../ipc/channels';

declare global {
  interface Window {
    systemai: {
      getAppInfo: () => Promise<AppInfo>;
      getTelemetry: () => Promise<TelemetrySnapshot>;
      sendChat: (request: ChatRequest) => Promise<ChatResponse>;
      setPerformanceMode: (mode: PerformanceMode) => Promise<{ ok: true }>;
      setAutoStart: (enabled: boolean) => Promise<{ ok: true; enabled: boolean }>;
    };
  }
}

export {};
