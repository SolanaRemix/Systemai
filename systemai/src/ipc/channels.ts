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
