import { useState } from 'react';
import type { CommandPreview } from '../../ipc/channels';

/** Static command analysis via the policy rules; nothing is executed. */
export const SanitizerPanel = (): JSX.Element => {
  const [command, setCommand] = useState('');
  const [result, setResult] = useState<CommandPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async (): Promise<void> => {
    try {
      setResult(await window.systemai.checkCommand(command));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <section className="space-y-3 rounded bg-slate-900 p-4 text-sm text-slate-200">
      <textarea aria-label="Command" className="h-24 w-full rounded bg-slate-800 p-2 font-mono text-xs" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Paste a command to analyze" />
      <button className="rounded bg-cyan-700 px-3 py-1 text-xs" onClick={() => void check()}>Analyze</button>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {result && (
        <div className="rounded bg-slate-950 p-3 text-xs">
          <p>Verdict: <b className={result.allowed ? 'text-emerald-400' : 'text-red-400'}>{result.allowed ? 'allowed' : 'rejected'}</b> · risk {result.risk}</p>
          <p>{result.reason}</p>
          {result.matched.length > 0 && <p className="text-slate-400">Matched: {result.matched.join(', ')}</p>}
        </div>
      )}
    </section>
  );
};
