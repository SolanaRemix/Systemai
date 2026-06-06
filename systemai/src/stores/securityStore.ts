import { create } from 'zustand';

export interface ThreatCategory {
  name: 'spoofing' | 'tampering' | 'repudiation' | 'information-disclosure' | 'denial-of-service' | 'elevation-of-privilege';
  risk: 'low' | 'medium' | 'high';
}

export interface ApprovalItem {
  id: string;
  action: string;
  level: 0 | 1 | 2 | 3;
  requestedAt: number;
}

export interface SnapshotItem {
  id: string;
  createdAt: number;
  reason: string;
}

interface SecurityStore {
  securityScore: number;
  threats: ThreatCategory[];
  hardeningTimeline: string[];
  exposureAlerts: string[];
  approvalQueue: ApprovalItem[];
  rollbackSnapshots: SnapshotItem[];
  enqueueApproval: (item: Omit<ApprovalItem, 'id' | 'requestedAt'>) => void;
  resolveApproval: (id: string) => void;
  addExposureAlert: (alert: string) => void;
}

export const useSecurityStore = create<SecurityStore>((set, get) => ({
  securityScore: 87,
  threats: [
    { name: 'spoofing', risk: 'low' },
    { name: 'tampering', risk: 'medium' },
    { name: 'elevation-of-privilege', risk: 'medium' }
  ],
  hardeningTimeline: ['Enabled controlled folder access', 'Applied firewall profile sync'],
  exposureAlerts: ['Legacy SMBv1 remains disabled confirmation pending'],
  approvalQueue: [],
  rollbackSnapshots: [{ id: 'snap_001', createdAt: Date.now() - 3600_000, reason: 'Pre-hardening baseline' }],
  enqueueApproval: (item) =>
    set({
      approvalQueue: [
        ...get().approvalQueue,
        {
          id: `approval_${Date.now()}`,
          requestedAt: Date.now(),
          ...item
        }
      ]
    }),
  resolveApproval: (id) => set({ approvalQueue: get().approvalQueue.filter((entry) => entry.id !== id) }),
  addExposureAlert: (alert) => set({ exposureAlerts: [alert, ...get().exposureAlerts].slice(0, 20) })
}));
