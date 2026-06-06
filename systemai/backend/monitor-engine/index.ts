export interface TelemetryEvent {
  source: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export const normalizeTelemetryEvent = (event: TelemetryEvent): TelemetryEvent => ({
  ...event,
  source: event.source.toLowerCase().trim()
});
