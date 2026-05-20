import { useEffect } from 'react';
import { useMonitorStore } from '../stores/monitorStore';
import { useSystemStore } from '../stores/systemStore';

/** Bootstraps app state and starts telemetry polling. */
export const useBoot = (): void => {
  const hydrateInfo = useSystemStore((s) => s.hydrateInfo);
  const startPolling = useMonitorStore((s) => s.startPolling);
  const stopPolling = useMonitorStore((s) => s.stopPolling);

  useEffect(() => {
    hydrateInfo();
    startPolling();
    return () => stopPolling();
  }, [hydrateInfo, startPolling, stopPolling]);
};
