import { useNotificationsStore } from '../../stores/notificationsStore';

/** Notification feed with severity filter and lifecycle details. */
export const NotificationCenter = (): JSX.Element => {
  const { items, filter, setFilter, clear } = useNotificationsStore();
  const visible = filter === 'all' ? items : items.filter((item) => item.severity === filter);

  return (
    <section className="rounded bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm text-slate-200">Notification Center</h2>
        <div className="flex gap-2">
          <select
            className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-100"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="success">Success</option>
          </select>
          <button className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-100" onClick={clear}>Clear all</button>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        {visible.map((n) => (
          <article key={n.id} className="rounded border border-slate-800 bg-slate-950 p-2 text-slate-200">
            <p><strong>What changed:</strong> {n.whatChanged}</p>
            <p><strong>Why:</strong> {n.why}</p>
            <p><strong>Result:</strong> {n.result}</p>
            <p><strong>Stability:</strong> {n.stability}</p>
            <p><strong>Rollback:</strong> {n.rollback}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
