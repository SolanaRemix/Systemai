import { useEffect, useState } from 'react';
import type { SecurityPosture } from '../../ipc/channels';

/** Security posture computed from stored workflows, snapshots, sanitizer events and telemetry. */
export const SecurityPanel = (): JSX.Element => {
  const [posture, setPosture] = useState<SecurityPosture | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.systemai.getSecurityPosture().then(setPosture).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <p role="alert" className="text-red-400">{error}</p>;
  if (!posture) return <p>Loading…</p>;
  return (
    <section className="grid gap-4 rounded bg-slate-900 p-4 md:grid-cols-2">
      <div className="rounded bg-slate-950 p-3 text-sm text-slate-200">
        <h3 className="mb-2">Security Score: {posture.score}</h3>
        <p>Pending approvals: {posture.pendingApprovals}</p>
        <p>High-risk workflows active: {posture.highRiskActive}</p>
        <p>Rejected commands (7d): {posture.rejectedLast7Days}</p>
        <p>Rollback-ready snapshots: {posture.snapshots}</p>
      </div>
      <div className="rounded bg-slate-950 p-3 text-sm text-slate-200">
        <h3 className="mb-2">Alerts</h3>
        {posture.alerts.length === 0 ? <p className="text-xs text-slate-400">No active alerts.</p> : posture.alerts.map((a) => <p key={a}>• {a}</p>)}
      </div>
    </section>
  );
};
