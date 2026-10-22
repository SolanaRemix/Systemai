import { useCallback, useEffect, useState } from 'react';
import type { WorkflowRow } from '../../ipc/channels';

const stages = ['preview', 'approve', 'execute', 'verify', 'done'];

/** Persisted approval pipeline: preview → approve → execute → verify → done, with rollback. */
export const OrchestratorPanel = (): JSX.Element => {
  const [rows, setRows] = useState<WorkflowRow[]>([]);
  const [title, setTitle] = useState('');
  const [command, setCommand] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    window.systemai.listWorkflows().then(setRows).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  useEffect(load, [load]);

  const act = async (fn: () => Promise<unknown>): Promise<void> => {
    try {
      await fn();
      setError(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const create = async (): Promise<void> => {
    try {
      const r = await window.systemai.createWorkflow(title, command);
      if (r.ok) {
        setTitle('');
        setCommand('');
        setError(null);
      } else {
        setError(r.reason);
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <section className="space-y-3 rounded bg-slate-900 p-4 text-sm text-slate-200">
      <form
        className="flex flex-col gap-2 text-xs"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <input aria-label="Title" className="rounded bg-slate-800 px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Workflow title" />
        <input aria-label="Command" className="rounded bg-slate-800 px-2 py-1 font-mono" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Command to review" />
        <button className="self-start rounded bg-cyan-700 px-3 py-1" type="submit">Create workflow</button>
      </form>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {rows.length === 0 && <p className="text-xs text-slate-400">No workflows yet.</p>}
      <ul className="space-y-2 text-xs">
        {rows.map((w) => {
          const terminal = w.stage === 'done' || w.stage === 'rollback';
          return (
            <li key={w.id} className="rounded bg-slate-950 p-2">
              <div className="flex justify-between">
                <b>{w.title}</b><span>risk {w.risk}</span>
              </div>
              <p className="font-mono text-slate-400">{w.command}</p>
              <p>{stages.map((s) => (s === w.stage ? `[${s}]` : s)).join(' → ')}{w.stage === 'rollback' && ' [rolled back]'}</p>
              {!terminal && (
                <div className="mt-1 flex gap-2">
                  <button className="rounded bg-cyan-700 px-2 py-1" onClick={() => void act(() => window.systemai.advanceWorkflow(w.id))}>Advance</button>
                  <button className="rounded bg-red-800 px-2 py-1" onClick={() => void act(() => window.systemai.rollbackWorkflow(w.id))}>Roll back</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
