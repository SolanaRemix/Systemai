import GridLayout from 'react-grid-layout';
import { useMonitorStore } from '../../stores/monitorStore';
import { useNotificationsStore } from '../../stores/notificationsStore';

const ringStyle = (value: number): React.CSSProperties => ({
  background: `conic-gradient(#22d3ee ${Math.min(100, value)}%, #1e293b 0)`
});

/** Resizable dashboard cards for core platform metrics. */
export const DashboardGrid = (): JSX.Element => {
  const telemetry = useMonitorStore((s) => s.telemetry);
  const notifications = useNotificationsStore((s) => s.items.slice(0, 5));

  return (
    <GridLayout className="layout" cols={12} rowHeight={90} width={1200} draggableHandle=".drag-header">
      <div key="cpu" data-grid={{ x: 0, y: 0, w: 3, h: 3 }} className="rounded bg-slate-900 p-4">
        <div className="drag-header mb-2 text-sm text-slate-300">CPU Gauge</div>
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full p-2" style={ringStyle(telemetry.cpu.usage)}>
          <div className="rounded-full bg-slate-950 px-3 py-2 text-center text-sm text-cyan-200">
            {telemetry.cpu.usage.toFixed(1)}%<br />{telemetry.cpu.temperature.toFixed(1)}°C
          </div>
        </div>
      </div>

      <div key="ram" data-grid={{ x: 3, y: 0, w: 3, h: 2 }} className="rounded bg-slate-900 p-4">
        <div className="drag-header mb-2 text-sm text-slate-300">RAM Bar</div>
        <div className="h-4 w-full overflow-hidden rounded bg-slate-800">
          <div className="h-full bg-cyan-500" style={{ width: `${telemetry.memory.pressure}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-300">Pressure: {telemetry.memory.pressure.toFixed(1)}%</p>
      </div>

      <div key="gpu" data-grid={{ x: 6, y: 0, w: 3, h: 2 }} className="rounded bg-slate-900 p-4">
        <div className="drag-header mb-2 text-sm text-slate-300">GPU</div>
        <p className="text-sm text-slate-100">Usage: {telemetry.gpu.usage.toFixed(1)}%</p>
        <p className="text-xs text-slate-300">Temp: {telemetry.gpu.temperature.toFixed(1)}°C</p>
      </div>

      <div key="disk" data-grid={{ x: 9, y: 0, w: 3, h: 2 }} className="rounded bg-slate-900 p-4">
        <div className="drag-header mb-2 text-sm text-slate-300">Disk Health</div>
        <div className="text-lg text-emerald-300">{telemetry.disk.health.toFixed(1)}%</div>
      </div>

      <div key="net" data-grid={{ x: 3, y: 2, w: 4, h: 2 }} className="rounded bg-slate-900 p-4">
        <div className="drag-header mb-2 text-sm text-slate-300">Network Activity</div>
        <svg className="h-16 w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
          <polyline fill="none" stroke="#22d3ee" strokeWidth="1" points="0,15 20,12 40,16 60,9 80,13 100,8" />
        </svg>
        <p className="text-xs text-slate-300">Up {telemetry.network.upMbps.toFixed(1)} / Down {telemetry.network.downMbps.toFixed(1)} Mbps</p>
      </div>

      <div key="security" data-grid={{ x: 7, y: 2, w: 2, h: 2 }} className="rounded bg-slate-900 p-4">
        <div className="drag-header mb-2 text-sm text-slate-300">Security</div>
        <div className="inline-flex rounded-full bg-emerald-900/40 px-3 py-1 text-sm text-emerald-200">Score Active</div>
      </div>

      <div key="actions" data-grid={{ x: 9, y: 2, w: 3, h: 2 }} className="rounded bg-slate-900 p-4">
        <div className="drag-header mb-2 text-sm text-slate-300">Quick Actions</div>
        <div className="flex gap-2 text-xs">
          <button className="rounded bg-slate-700 px-2 py-1">Optimize</button>
          <button className="rounded bg-slate-700 px-2 py-1">Scan</button>
          <button className="rounded bg-slate-700 px-2 py-1">Snapshot</button>
        </div>
      </div>

      <div key="feed" data-grid={{ x: 0, y: 3, w: 12, h: 2 }} className="rounded bg-slate-900 p-4">
        <div className="drag-header mb-2 text-sm text-slate-300">Recent Notifications</div>
        <div className="space-y-1 text-xs text-slate-300">
          {notifications.map((n) => (
            <p key={n.id}>[{n.severity.toUpperCase()}] {n.whatChanged}</p>
          ))}
        </div>
      </div>
    </GridLayout>
  );
};
