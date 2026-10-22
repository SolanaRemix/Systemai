import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { validatePowerShellCommand, type Risk } from '../powershell-bridge';

export type WorkflowStage = 'preview' | 'approve' | 'execute' | 'verify' | 'done' | 'rollback';

export interface WorkflowRow {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  command: string;
  risk: Risk;
  stage: WorkflowStage;
}

const order: WorkflowStage[] = ['preview', 'approve', 'execute', 'verify', 'done'];

export const nextStage = (stage: WorkflowStage): WorkflowStage => {
  const i = order.indexOf(stage);
  return i === -1 ? stage : order[Math.min(i + 1, order.length - 1)];
};

const log = (db: Database.Database, level: string, message: string, source: string): void => {
  db.prepare('INSERT INTO execution_logs (level, message, source) VALUES (?, ?, ?)').run(level, message, source);
};

/**
 * Creates a workflow in `preview` after sanitizing the command. Rejected commands are not stored.
 * This engine tracks the approval pipeline and audit trail; it does not execute commands.
 */
export const createWorkflow = (
  db: Database.Database,
  title: string,
  command: string
): { ok: true; workflow: WorkflowRow } | { ok: false; reason: string } => {
  const check = validatePowerShellCommand(command);
  if (!check.allowed) {
    log(db, 'warn', `Rejected command for "${title.slice(0, 80)}": ${check.reason}`, 'sanitizer');
    return { ok: false, reason: check.reason };
  }
  const id = `wf_${randomUUID()}`;
  db.prepare('INSERT INTO workflows (id, title, command, risk, stage) VALUES (?, ?, ?, ?, ?)').run(id, title, command, check.risk, 'preview');
  log(db, 'info', `Workflow created: ${id} (${check.risk})`, 'orchestrator');
  return { ok: true, workflow: getWorkflow(db, id) as WorkflowRow };
};

export const getWorkflow = (db: Database.Database, id: string): WorkflowRow | undefined =>
  db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as WorkflowRow | undefined;

export const listWorkflows = (db: Database.Database): WorkflowRow[] =>
  db.prepare('SELECT * FROM workflows ORDER BY created_at DESC, rowid DESC LIMIT 200').all() as WorkflowRow[];

/** Advances one stage. Terminal stages (done, rollback) cannot advance. */
export const advanceWorkflow = (db: Database.Database, id: string): WorkflowRow => {
  const wf = getWorkflow(db, id);
  if (!wf) throw new Error('Workflow not found');
  if (wf.stage === 'done' || wf.stage === 'rollback') throw new Error(`Workflow already ${wf.stage}`);
  const stage = nextStage(wf.stage);
  db.prepare('UPDATE workflows SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(stage, id);
  log(db, 'info', `Workflow ${id}: ${wf.stage} -> ${stage}`, 'orchestrator');
  return getWorkflow(db, id) as WorkflowRow;
};

/** Rolls back a workflow that has not reached `done`. */
export const rollbackWorkflow = (db: Database.Database, id: string): WorkflowRow => {
  const wf = getWorkflow(db, id);
  if (!wf) throw new Error('Workflow not found');
  if (wf.stage === 'done' || wf.stage === 'rollback') throw new Error(`Workflow already ${wf.stage}`);
  db.prepare("UPDATE workflows SET stage = 'rollback', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  log(db, 'warn', `Workflow ${id} rolled back from ${wf.stage}`, 'orchestrator');
  return getWorkflow(db, id) as WorkflowRow;
};
