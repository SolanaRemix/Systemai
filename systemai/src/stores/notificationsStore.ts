import { create } from 'zustand';

export type Severity = 'info' | 'warning' | 'critical' | 'success';

export interface NotificationItem {
  id: string;
  timestamp: number;
  severity: Severity;
  whatChanged: string;
  why: string;
  result: string;
  stability: string;
  rollback: string;
}

interface NotificationsStore {
  items: NotificationItem[];
  filter: Severity | 'all';
  add: (item: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  clear: () => void;
  setFilter: (filter: Severity | 'all') => void;
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  items: [
    {
      id: 'n1',
      timestamp: Date.now(),
      severity: 'info',
      whatChanged: 'Telemetry stream initialized',
      why: 'Enable baseline monitoring',
      result: 'Data feed active',
      stability: 'No impact',
      rollback: 'Disable polling'
    }
  ],
  filter: 'all',
  add: (item) =>
    set({
      items: [{ id: `n_${Date.now()}`, timestamp: Date.now(), ...item }, ...get().items].slice(0, 100)
    }),
  clear: () => set({ items: [] }),
  setFilter: (filter) => set({ filter })
}));
