import { useMonitorStore } from '../../stores/monitorStore';
import { formatBytes } from '../../utils/format';

/** Detailed monitor view for system metrics and service health. */
export const MonitorPanel = (): JSX.Element => {
  const { telemetry, services, securityState } = useMonitorStore();

  return (
    <section className="grid grid-cols-1 gap-4 rounded bg-slate-900 p-4 md:grid-cols-2">
      <div className="rounded bg-slate-950 p-3 text-sm text-slate-200">
        <h3 className="mb-2 text-slate-300">Resource Metrics</h3>
        <p>CPU: {telemetry.cpu.usage.toFixed(1)}% @ {telemetry.cpu.temperature.toFixed(1)}°C</p>
        <p>RAM: {formatBytes(telemetry.memory.used)} / {formatBytes(telemetry.memory.total)}</p>
        <p>GPU: {telemetry.gpu.usage.toFixed(1)}% @ {telemetry.gpu.temperature.toFixed(1)}°C</p>
        <p>Disk: {telemetry.disk.readMbps.toFixed(1)}R / {telemetry.disk.writeMbps.toFixed(1)}W MBps</p>
        <p>Network: {telemetry.network.upMbps.toFixed(1)}↑ / {telemetry.network.downMbps.toFixed(1)}↓ Mbps</p>
      </div>
      <div className="rounded bg-slate-950 p-3 text-sm text-slate-200">
        <h3 className="mb-2 text-slate-300">Service + Security</h3>
        {services.map((service) => (
          <p key={service.name}>{service.name}: {service.status}</p>
        ))}
        <p>Defender: {securityState.defender}</p>
        <p>Firewall: {securityState.firewall}</p>
        <p>Updates: {securityState.updates}</p>
        <p>Thermal Condition: {telemetry.thermal.condition}</p>
        <p>Throttling: {telemetry.thermal.throttling ? 'Detected' : 'None'}</p>
      </div>
    </section>
  );
};
