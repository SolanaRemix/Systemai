export type WorkflowStage = 'preview' | 'approve' | 'execute' | 'verify' | 'rollback';

export interface WorkflowState {
  id: string;
  stage: WorkflowStage;
  updatedAt: number;
}

export const nextStage = (stage: WorkflowStage): WorkflowStage => {
  const order: WorkflowStage[] = ['preview', 'approve', 'execute', 'verify', 'rollback'];
  const index = order.indexOf(stage);
  return order[Math.min(index + 1, order.length - 1)];
};
