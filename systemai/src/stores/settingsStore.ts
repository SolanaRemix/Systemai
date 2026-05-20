import { create } from 'zustand';
import type { PerformanceMode } from '../ipc/channels';

interface SettingsStore {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  performanceModeBadge: PerformanceMode;
  setPerformanceModeBadge: (mode: PerformanceMode) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'dark',
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
  performanceModeBadge: 'balanced',
  setPerformanceModeBadge: (mode) => set({ performanceModeBadge: mode })
}));
