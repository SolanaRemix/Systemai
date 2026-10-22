import type {
  CommandPreview,
  CreateWorkflowResult,
  SecurityPosture,
  WorkflowRow,
  LogQuery,
  LogRow,
  AdminDashboard,
  DeveloperDashboard,
  UserDashboard,
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
      getUserDashboard: () => Promise<UserDashboard>;
      getDeveloperDashboard: () => Promise<DeveloperDashboard>;
      getAdminDashboard: () => Promise<AdminDashboard>;
      setPolicy: (key: string, value: string) => Promise<{ ok: true }>;
      deletePolicy: (key: string) => Promise<{ ok: boolean }>;
      createSnapshot: (reason: string) => Promise<{ id: string }>;
      purgeLogs: (olderThanDays: number) => Promise<{ removed: number }>;
      listLogs: (query?: LogQuery) => Promise<LogRow[]>;
      verifySnapshot: (id: string) => Promise<{ exists: boolean; wellFormed: boolean; rollbackReady: boolean }>;
      checkCommand: (command: string) => Promise<CommandPreview>;
      listWorkflows: () => Promise<WorkflowRow[]>;
      createWorkflow: (title: string, command: string) => Promise<CreateWorkflowResult>;
      advanceWorkflow: (id: string) => Promise<WorkflowRow>;
      rollbackWorkflow: (id: string) => Promise<WorkflowRow>;
      getSecurityPosture: () => Promise<SecurityPosture>;
    };
  }
}

export {};
