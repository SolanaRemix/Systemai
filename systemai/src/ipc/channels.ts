import { z } from 'zod';

export const PerformanceModeSchema = z.enum(['eco', 'balanced', 'performance']);
export const DashboardModeSchema = z.enum(['guided', 'auto']);
export const AgentStatusSchema = z.enum([
  'idle',
  'analyze',
  'plan',
  'preview',
  'execute',
  'verify',
  'rollback',
  'safe-mode'
]);

export const AppInfoSchema = z.object({
  os: z.string(),
  hostname: z.string(),
  uptime: z.number(),
  version: z.string()
});

export const TelemetrySchema = z.object({
  cpu: z.object({
    usage: z.number(),
    temperature: z.number(),
    perCore: z.array(z.number())
  }),
  memory: z.object({
    used: z.number(),
    available: z.number(),
    total: z.number(),
    pressure: z.number()
  }),
  gpu: z.object({
    usage: z.number(),
    vramTotalMb: z.number(),
    vramUsedMb: z.number(),
    temperature: z.number()
  }),
  disk: z.object({
    readMbps: z.number(),
    writeMbps: z.number(),
    health: z.number(),
    usedPercent: z.number()
  }),
  network: z.object({
    upMbps: z.number(),
    downMbps: z.number(),
    activeConnections: z.number()
  }),
  thermal: z.object({
    throttling: z.boolean(),
    condition: z.enum(['normal', 'warm', 'hot'])
  })
});

export const ChatRequestSchema = z.object({
  content: z.string().min(1),
  context: z.object({
    systemStateSummary: z.string(),
    recentEvents: z.array(z.string())
  })
});

export const ChatResponseSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  content: z.string(),
  risk: z.enum(['low', 'medium', 'high'])
});

export const SetPerformanceModeSchema = z.object({ mode: PerformanceModeSchema });
export const SetAutoStartSchema = z.object({ enabled: z.boolean() });

export type PerformanceMode = z.infer<typeof PerformanceModeSchema>;
export type DashboardMode = z.infer<typeof DashboardModeSchema>;
export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type AppInfo = z.infer<typeof AppInfoSchema>;
export type TelemetrySnapshot = z.infer<typeof TelemetrySchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const IPC_CHANNELS = [
  { channel: 'app:getInfo', description: 'Host and application info', role: 'user' },
  { channel: 'monitor:getTelemetry', description: 'Collect and persist a telemetry snapshot', role: 'user' },
  { channel: 'chat:send', description: 'Send a chat request to the assistant', role: 'user' },
  { channel: 'settings:setPerformanceMode', description: 'Persist performance mode policy', role: 'user' },
  { channel: 'settings:setAutoStart', description: 'Toggle launch at login', role: 'user' },
  { channel: 'logs:list', description: 'Query execution logs with level/search filters', role: 'user' },
  { channel: 'snapshot:verify', description: 'Verify a snapshot record against its stored integrity hash', role: 'admin' },
  { channel: 'dashboard:getUser', description: 'User dashboard summary', role: 'user' },
  { channel: 'dashboard:getDeveloper', description: 'Developer dashboard: DB stats and API catalog', role: 'developer' },
  { channel: 'dashboard:getAdmin', description: 'Admin dashboard: policies, audit, snapshots', role: 'admin' },
  { channel: 'admin:setPolicy', description: 'Create or update a policy entry', role: 'admin' },
  { channel: 'admin:deletePolicy', description: 'Delete a policy entry', role: 'admin' },
  { channel: 'admin:createSnapshot', description: 'Record a rollback snapshot', role: 'admin' },
  { channel: 'admin:purgeLogs', description: 'Purge execution logs older than N days', role: 'admin' }
] as const;

export const LogRowSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  level: z.string(),
  message: z.string(),
  source: z.string()
});
export const PolicyRowSchema = z.object({
  policy_key: z.string(),
  policy_value: z.string(),
  updated_at: z.string()
});
export const SnapshotRowSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  reason: z.string(),
  integrity_hash: z.string(),
  rollback_ready: z.number()
});

export const UserDashboardSchema = z.object({
  latest: z
    .object({
      cpu_usage: z.number(),
      cpu_temp: z.number(),
      ram_used: z.number(),
      ram_total: z.number(),
      gpu_usage: z.number(),
      disk_health: z.number(),
      thermal_condition: z.string(),
      throttling: z.number()
    })
    .nullable(),
  averages: z.object({ cpu: z.number(), gpu: z.number(), samples: z.number() }),
  recentLogs: z.array(LogRowSchema),
  performanceMode: z.string(),
  health: z.number()
});
export const DeveloperDashboardSchema = z.object({
  tables: z.array(z.object({ name: z.string(), rows: z.number() })),
  logLevels: z.array(z.object({ level: z.string(), count: z.number() })),
  logSources: z.array(z.object({ source: z.string(), count: z.number() })),
  channels: z.array(z.object({ channel: z.string(), description: z.string(), role: z.string() })),
  recentErrors: z.array(LogRowSchema)
});
export const AdminDashboardSchema = z.object({
  policies: z.array(PolicyRowSchema),
  snapshots: z.array(SnapshotRowSchema),
  audit: z.array(LogRowSchema),
  totals: z.object({ logs: z.number(), snapshots: z.number(), telemetry: z.number(), policies: z.number() })
});
export const SetPolicySchema = z.object({
  key: z.string().min(1).max(64).regex(/^[A-Za-z0-9_.-]+$/),
  value: z.string().max(1024)
});
export const DeletePolicySchema = z.object({ key: z.string().min(1).max(64) });
export const CreateSnapshotSchema = z.object({ reason: z.string().min(1).max(256) });
export const PurgeLogsSchema = z.object({ olderThanDays: z.number().int().min(1).max(3650) });

export type UserDashboard = z.infer<typeof UserDashboardSchema>;
export type DeveloperDashboard = z.infer<typeof DeveloperDashboardSchema>;
export type AdminDashboard = z.infer<typeof AdminDashboardSchema>;

export const LogQuerySchema = z.object({
  level: z.enum(['all', 'info', 'warn', 'error']).default('all'),
  search: z.string().max(200).default(''),
  limit: z.number().int().min(1).max(500).default(100)
});
export const VerifySnapshotSchema = z.object({ id: z.string().min(1).max(64) });
export type LogQuery = z.input<typeof LogQuerySchema>;
export type LogRow = z.infer<typeof LogRowSchema>;
