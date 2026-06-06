import { useSettingsStore } from '../stores/settingsStore';
import { useSystemStore } from '../stores/systemStore';

export const SettingsPage = (): JSX.Element => {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const autoStartEnabled = useSystemStore((s) => s.autoStartEnabled);
  const setAutoStart = useSystemStore((s) => s.setAutoStart);

  return (
    <section className="space-y-3 rounded bg-slate-900 p-4 text-sm text-slate-100">
      <div>
        <h3 className="mb-1">Theme</h3>
        <div className="flex gap-2">
          <button className="rounded bg-slate-700 px-2 py-1" onClick={() => setTheme('dark')}>Dark</button>
          <button className="rounded bg-slate-700 px-2 py-1" onClick={() => setTheme('light')}>Light</button>
          <span className="text-slate-300">Current: {theme}</span>
        </div>
      </div>
      <div>
        <h3 className="mb-1">Auto Start</h3>
        <button className="rounded bg-slate-700 px-2 py-1" onClick={() => setAutoStart(!autoStartEnabled)}>
          {autoStartEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    </section>
  );
};
