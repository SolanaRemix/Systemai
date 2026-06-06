export interface RepairPlan {
  id: string;
  name: string;
  risk: 'low' | 'medium' | 'high';
}

export const previewRepairPlan = (name: string): RepairPlan => ({
  id: `plan_${Date.now()}`,
  name,
  risk: 'medium'
});
