import { useCallback, useEffect, useState } from 'react';
import type { LogRow } from '../../ipc/channels';

/** Log viewer backed by the persisted execution_logs table with level and text filters. */
export const LogViewerPanel = (): JSX.Element => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [level, setLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    window.systemai
      .listLogs({ level, search, limit: 200 })
      .then((r) => {
        setRows(r);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [level, search]);

  useEffect(load, [load]);

  return (
    <section className="space-y-3 rounded bg-slate-900 p-4 text-sm text-slate-200">
      <div className="flex gap-2 text-xs">
        <select aria-label="Level" className="rounded bg-slate-800 px-2 py-1" value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
          <option value="all">all</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="error">error</option>
        </select>
        <input aria-label="Search logs" className="rounded bg-slate-800 px-2 py-1" placeholder="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="rounded bg-slate-800 px-3 py-1" onClick={load}>Refresh</button>
      </div>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">No log entries match.</p>
      ) : (
        <table className="w-full text-left text-xs">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-800">
                <td className="pr-2">{r.created_at}</td><td className="pr-2">{r.level}</td>
                <td className="pr-2">{r.source}</td><td>{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};
