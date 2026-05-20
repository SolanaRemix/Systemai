import { create } from 'zustand';
import type { AgentStatus, AppInfo, DashboardMode, PerformanceMode } from '../ipc/channels';

export interface HealthScores {
  overall: number;
  security: number;
  stability: number;
  optimization: number;
}

interface SystemStore {
  info: AppInfo;
  health: HealthScores;
  performanceMode: PerformanceMode;
  dashboardMode: DashboardMode;
  agentStatus: AgentStatus;
  autoStartEnabled: boolean;
  setPerformanceMode: (mode: PerformanceMode) => Promise<void>;
  setDashboardMode: (mode: DashboardMode) => void;
  setAgentStatus: (status: AgentStatus) => void;
  hydrateInfo: () => Promise<void>;
  setHealth: (next: Partial<HealthScores>) => void;
  setAutoStart: (enabled: boolean) => Promise<void>;
}

const defaultInfo: AppInfo = { os: 'unknown', hostname: 'unknown', uptime: 0, version: '0.1.0' };

export const useSystemStore = create<SystemStore>((set, get) => ({
  info: defaultInfo,
  health: { overall: 86, security: 89, stability: 84, optimization: 80 },
  performanceMode: 'balanced',
  dashboardMode: 'guided',
  agentStatus: 'idle',
  autoStartEnabled: false,
  setPerformanceMode: async (mode) => {
    await window.systemai.setPerformanceMode(mode);
    set({ performanceMode: mode });
  },
  setDashboardMode: (mode) => set({ dashboardMode: mode }),
  setAgentStatus: (status) => set({ agentStatus: status }),
  hydrateInfo: async () => {
    const info = await window.systemai.getAppInfo();
    set({ info });
  },
  setHealth: (next) => set({ health: { ...get().health, ...next } }),
  setAutoStart: async (enabled) => {
    const result = await window.systemai.setAutoStart(enabled);
    set({ autoStartEnabled: result.enabled });
  }
}));
