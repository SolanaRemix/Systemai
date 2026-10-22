import { create } from 'zustand';
import type { HealthReport, TelemetrySnapshot } from '../ipc/channels';

interface MonitorStore {
  telemetry: TelemetrySnapshot;
  health: HealthReport | null;
  fetchHealth: () => Promise<void>;
  fetchTelemetry: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

let poller: ReturnType<typeof setInterval> | null = null;

const defaultTelemetry: TelemetrySnapshot = {
  cpu: { usage: 0, temperature: 0, perCore: [] },
  memory: { used: 0, available: 0, total: 1, pressure: 0 },
  gpu: { usage: 0, vramTotalMb: 1, vramUsedMb: 0, temperature: 0 },
  disk: { readMbps: 0, writeMbps: 0, health: 100, usedPercent: 0 },
  network: { upMbps: 0, downMbps: 0, activeConnections: 0 },
  thermal: { throttling: false, condition: 'normal' }
};

export const useMonitorStore = create<MonitorStore>((set) => ({
  telemetry: defaultTelemetry,
  health: null,
  fetchHealth: async () => {
    set({ health: await window.systemai.getHealth() });
  },
  fetchTelemetry: async () => {
    const telemetry = await window.systemai.getTelemetry();
    set({ telemetry });
  },
  startPolling: () => {
    if (poller) {
      return;
    }
    poller = setInterval(async () => {
      const telemetry = await window.systemai.getTelemetry();
      set({ telemetry });
    }, Number(process.env.SYSTEMAI_TELEMETRY_INTERVAL_MS ?? 2000));
  },
  stopPolling: () => {
    if (poller) {
      clearInterval(poller);
      poller = null;
    }
  }
}));
