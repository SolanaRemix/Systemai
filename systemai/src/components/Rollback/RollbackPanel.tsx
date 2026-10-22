import { useEffect, useState } from 'react';
import type { AdminDashboard } from '../../ipc/channels';

type Verification = { exists: boolean; wellFormed: boolean; rollbackReady: boolean };

/** Lists recorded snapshots and verifies their integrity metadata. */
export const RollbackPanel = (): JSX.Element => {
  const [snapshots, setSnapshots] = useState<AdminDashboard['snapshots']>([]);
  const [results, setResults] = useState<Record<string, Verification>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.systemai
      .getAdminDashboard()
      .then((d) => setSnapshots(d.snapshots))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const verify = async (id: string): Promise<void> => {
    try {
      const r = await window.systemai.verifySnapshot(id);
      setResults((prev) => ({ ...prev, [id]: r }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <section className="space-y-2 rounded bg-slate-900 p-4 text-sm text-slate-200">
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {snapshots.length === 0 && <p className="text-xs text-slate-400">No snapshots. Create one from the Admin dashboard.</p>}
      <ul className="text-xs">
        {snapshots.map((s) => {
          const r = results[s.id];
          return (
            <li key={s.id} className="flex items-center justify-between border-t border-slate-800 py-1">
              <span><span className="font-mono">{s.id}</span> · {s.reason} · {s.created_at}</span>
              <span>
                {r && <span className="mr-2">{r.exists && r.wellFormed && r.rollbackReady ? 'verified' : 'invalid'}</span>}
                <button className="rounded bg-cyan-700 px-2 py-1" onClick={() => void verify(s.id)}>Verify</button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
