import { describe, expect, it } from 'vitest';
import { TelemetrySchema } from '../src/ipc/channels';
import { TelemetryCollector } from '../backend/monitor-engine';

describe('TelemetryCollector', () => {
  it('produces schema-valid, bounded host telemetry', async () => {
    const c = new TelemetryCollector();
    await new Promise((r) => setTimeout(r, 50));
    const t = TelemetrySchema.parse(c.collect());
    expect(t.cpu.usage).toBeGreaterThanOrEqual(0);
    expect(t.cpu.usage).toBeLessThanOrEqual(100);
    expect(t.memory.total).toBeGreaterThan(0);
    expect(t.cpu.perCore.length).toBeGreaterThan(0);
    expect(t.network.upMbps).toBeGreaterThanOrEqual(0);
  });
});
