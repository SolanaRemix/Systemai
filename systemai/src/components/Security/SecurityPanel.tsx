import { useSecurityStore } from '../../stores/securityStore';

/** Security score, STRIDE threat model, and approval queue view. */
export const SecurityPanel = (): JSX.Element => {
  const { securityScore, threats, hardeningTimeline, exposureAlerts, approvalQueue, rollbackSnapshots } = useSecurityStore();

  return (
    <section className="grid gap-4 rounded bg-slate-900 p-4 md:grid-cols-2">
      <div className="rounded bg-slate-950 p-3 text-sm text-slate-200">
        <h3 className="mb-2">Security Score: {securityScore}</h3>
        {threats.map((t) => (
          <p key={t.name}>{t.name}: {t.risk}</p>
        ))}
      </div>
      <div className="rounded bg-slate-950 p-3 text-sm text-slate-200">
        <h3 className="mb-2">Hardening Timeline</h3>
        {hardeningTimeline.map((item) => (
          <p key={item}>• {item}</p>
        ))}
      </div>
      <div className="rounded bg-slate-950 p-3 text-sm text-slate-200">
        <h3 className="mb-2">Exposure Alerts</h3>
        {exposureAlerts.map((alert) => (
          <p key={alert}>• {alert}</p>
        ))}
      </div>
      <div className="rounded bg-slate-950 p-3 text-sm text-slate-200">
        <h3 className="mb-2">Approval Queue / Snapshots</h3>
        {approvalQueue.map((a) => (
          <p key={a.id}>[{a.level}] {a.action}</p>
        ))}
        {rollbackSnapshots.map((s) => (
          <p key={s.id}>Snapshot {s.id}: {s.reason}</p>
        ))}
      </div>
    </section>
  );
};
