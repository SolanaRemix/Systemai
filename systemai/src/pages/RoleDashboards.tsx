import { useCallback, useEffect, useState } from 'react';
import type { AdminDashboard, DeveloperDashboard, UserDashboard } from '../ipc/channels';

const Card = ({ title, children }: { title: string; children: React.ReactNode }): JSX.Element => (
  <section className="rounded border border-slate-800 bg-slate-900 p-4">
    <h2 className="mb-2 text-sm font-semibold text-cyan-200">{title}</h2>
    {children}
  </section>
);

const Stat = ({ label, value }: { label: string; value: string | number }): JSX.Element => (
  <div className="rounded bg-slate-800 p-3">
    <div className="text-xs text-slate-400">{label}</div>
    <div className="text-xl font-semibold">{value}</div>
  </div>
);

const useLoader = <T,>(load: () => Promise<T>): { data: T | null; error: string | null; reload: () => void } => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    load()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [load]);
  useEffect(reload, [reload]);
  return { data, error, reload };
};

const LogTable = ({ rows }: { rows: { id: number; created_at: string; level: string; source: string; message: string }[] }): JSX.Element =>
  rows.length === 0 ? (
    <p className="text-xs text-slate-400">No entries.</p>
  ) : (
    <table className="w-full text-left text-xs">
      <thead className="text-slate-400">
        <tr><th>Time</th><th>Level</th><th>Source</th><th>Message</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-slate-800">
            <td className="pr-2">{r.created_at}</td><td className="pr-2">{r.level}</td>
            <td className="pr-2">{r.source}</td><td>{r.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

const Status = ({ error, loading }: { error: string | null; loading: boolean }): JSX.Element | null =>
  error ? <p role="alert" className="text-red-400">{error}</p> : loading ? <p>Loading…</p> : null;

const loadUser = (): Promise<UserDashboard> => window.systemai.getUserDashboard();
const loadDev = (): Promise<DeveloperDashboard> => window.systemai.getDeveloperDashboard();
const loadAdmin = (): Promise<AdminDashboard> => window.systemai.getAdminDashboard();

export const UserDashboardPage = (): JSX.Element => {
  const { data, error, reload } = useLoader(loadUser);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">User Dashboard</h1>
        <button className="rounded bg-slate-800 px-3 py-1 text-xs" onClick={reload}>Refresh</button>
      </div>
      <Status error={error} loading={!data} />
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Health" value={`${data.health}%`} />
            <Stat label="Mode" value={data.performanceMode} />
            <Stat label="Avg CPU" value={`${data.averages.cpu}%`} />
            <Stat label="Avg GPU" value={`${data.averages.gpu}%`} />
          </div>
          <Card title="Latest telemetry">
            {data.latest ? (
              <p className="text-sm">
                CPU {data.latest.cpu_usage}% @ {data.latest.cpu_temp}°C · RAM{' '}
                {Math.round((data.latest.ram_used / data.latest.ram_total) * 100)}% · Disk health{' '}
                {data.latest.disk_health}% · Thermal {data.latest.thermal_condition}
              </p>
            ) : (
              <p className="text-xs text-slate-400">No telemetry yet. Open the Monitor page to start collecting.</p>
            )}
          </Card>
          <Card title="Recent activity"><LogTable rows={data.recentLogs} /></Card>
        </>
      )}
    </div>
  );
};

export const DeveloperDashboardPage = (): JSX.Element => {
  const { data, error, reload } = useLoader(loadDev);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Developer Dashboard</h1>
        <button className="rounded bg-slate-800 px-3 py-1 text-xs" onClick={reload}>Refresh</button>
      </div>
      <Status error={error} loading={!data} />
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {data.tables.map((t) => <Stat key={t.name} label={t.name} value={t.rows} />)}
          </div>
          <Card title="IPC API catalog">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400"><tr><th>Channel</th><th>Role</th><th>Description</th></tr></thead>
              <tbody>
                {data.channels.map((c) => (
                  <tr key={c.channel} className="border-t border-slate-800">
                    <td className="pr-2 font-mono">{c.channel}</td><td className="pr-2">{c.role}</td><td>{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Log breakdown">
            <p className="text-xs">
              {data.logLevels.map((l) => `${l.level}: ${l.count}`).join(' · ') || 'No logs'} |{' '}
              {data.logSources.map((l) => `${l.source}: ${l.count}`).join(' · ')}
            </p>
          </Card>
          <Card title="Recent warnings & errors"><LogTable rows={data.recentErrors} /></Card>
        </>
      )}
    </div>
  );
};

export const AdminDashboardPage = (): JSX.Element => {
  const { data, error, reload } = useLoader(loadAdmin);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [days, setDays] = useState(30);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>): Promise<void> => {
    try {
      await fn();
      setActionError(null);
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Administration</h1>
      <Status error={error ?? actionError} loading={!data} />
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Logs" value={data.totals.logs} />
            <Stat label="Telemetry" value={data.totals.telemetry} />
            <Stat label="Snapshots" value={data.totals.snapshots} />
            <Stat label="Policies" value={data.totals.policies} />
          </div>
          <Card title="Policies">
            <form
              className="mb-2 flex gap-2 text-xs"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await window.systemai.setPolicy(key, value);
                  setKey('');
                  setValue('');
                });
              }}
            >
              <input aria-label="Policy key" className="rounded bg-slate-800 px-2 py-1" value={key} onChange={(e) => setKey(e.target.value)} placeholder="key" />
              <input aria-label="Policy value" className="rounded bg-slate-800 px-2 py-1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="value" />
              <button className="rounded bg-cyan-700 px-3 py-1" type="submit">Save</button>
            </form>
            <table className="w-full text-left text-xs">
              <tbody>
                {data.policies.map((p) => (
                  <tr key={p.policy_key} className="border-t border-slate-800">
                    <td className="pr-2 font-mono">{p.policy_key}</td><td className="pr-2">{p.policy_value}</td><td>{p.updated_at}</td>
                    <td><button className="text-red-400" onClick={() => void run(() => window.systemai.deletePolicy(p.policy_key))}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Rollback snapshots">
            <form
              className="mb-2 flex gap-2 text-xs"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await window.systemai.createSnapshot(reason);
                  setReason('');
                });
              }}
            >
              <input aria-label="Snapshot reason" className="rounded bg-slate-800 px-2 py-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="reason" />
              <button className="rounded bg-cyan-700 px-3 py-1" type="submit">Create snapshot</button>
            </form>
            <ul className="text-xs">
              {data.snapshots.map((s) => (
                <li key={s.id} className="border-t border-slate-800 py-1">
                  <span className="font-mono">{s.id}</span> · {s.reason} · {s.created_at} · {s.integrity_hash.slice(0, 12)}…
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Log retention">
            <div className="flex gap-2 text-xs">
              <input aria-label="Days" type="number" min={1} className="w-20 rounded bg-slate-800 px-2 py-1" value={days} onChange={(e) => setDays(Number(e.target.value))} />
              <button className="rounded bg-red-800 px-3 py-1" onClick={() => void run(() => window.systemai.purgeLogs(days))}>Purge older logs</button>
            </div>
          </Card>
          <Card title="Audit trail"><LogTable rows={data.audit} /></Card>
        </>
      )}
    </div>
  );
};
