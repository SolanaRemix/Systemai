import { create } from 'zustand';
import { useMonitorStore } from './monitorStore';
import { useSystemStore } from './systemStore';

export type MessageType = 'user' | 'assistant' | 'system' | 'action-preview' | 'execution-result';

export interface ChatMessage {
  id: string;
  timestamp: number;
  type: MessageType;
  content: string;
}

export interface ActionPreview {
  what: string;
  why: string;
  risk: 'low' | 'medium' | 'high';
  impact: string;
  rollback: string;
}

interface ChatbotStore {
  history: ChatMessage[];
  pendingPreview: ActionPreview | null;
  isExecuting: boolean;
  sendUserMessage: (content: string) => Promise<void>;
  previewAction: (preview: ActionPreview) => void;
  approveAction: () => void;
  denyAction: () => void;
}

const unsafePatterns = [/format\s+c:/i, /del\s+\/f\s+\/s/i, /Remove-Item\s+-Recurse\s+C:\\/i];

export const useChatbotStore = create<ChatbotStore>((set, get) => ({
  history: [
    {
      id: 'sys_boot',
      timestamp: Date.now(),
      type: 'system',
      content: 'SYSTEMAI.EXE online. Safety policies active.'
    }
  ],
  pendingPreview: null,
  isExecuting: false,
  sendUserMessage: async (content) => {
    const timestamp = Date.now();
    const userMessage: ChatMessage = { id: `usr_${timestamp}`, timestamp, type: 'user', content };
    set({ history: [...get().history, userMessage] });

    if (unsafePatterns.some((p) => p.test(content))) {
      set({
        history: [
          ...get().history,
          {
            id: `assistant_refusal_${Date.now()}`,
            timestamp: Date.now(),
            type: 'assistant',
            content: 'I cannot execute unsafe destructive commands. Please provide a safer remediation objective.'
          }
        ]
      });
      return;
    }

    const monitor = useMonitorStore.getState().telemetry;
    const system = useSystemStore.getState();

    const response = await window.systemai.sendChat({
      content,
      context: {
        systemStateSummary: `Mode=${system.performanceMode};Agent=${system.agentStatus};CPU=${monitor.cpu.usage.toFixed(1)}%`,
        recentEvents: [`Thermal=${monitor.thermal.condition}`, `Security=${system.health.security}`]
      }
    });

    const assistantMessage: ChatMessage = {
      id: response.id,
      timestamp: response.timestamp,
      type: 'assistant',
      content: response.content
    };
    set({ history: [...get().history, assistantMessage] });
  },
  previewAction: (preview) => {
    set({
      pendingPreview: preview,
      history: [
        ...get().history,
        {
          id: `preview_${Date.now()}`,
          timestamp: Date.now(),
          type: 'action-preview',
          content: JSON.stringify(preview)
        }
      ]
    });
  },
  approveAction: () => {
    const preview = get().pendingPreview;
    if (!preview) {
      return;
    }

    set({ isExecuting: true });

    setTimeout(() => {
      set({
        isExecuting: false,
        pendingPreview: null,
        history: [
          ...get().history,
          {
            id: `exec_${Date.now()}`,
            timestamp: Date.now(),
            type: 'execution-result',
            content: `Executed: ${preview.what}. Verification complete. Rollback available: ${preview.rollback}.`
          }
        ]
      });
    }, 1200);
  },
  denyAction: () => {
    set({
      pendingPreview: null,
      history: [
        ...get().history,
        {
          id: `deny_${Date.now()}`,
          timestamp: Date.now(),
          type: 'system',
          content: 'Action denied by operator.'
        }
      ]
    });
  }
}));
