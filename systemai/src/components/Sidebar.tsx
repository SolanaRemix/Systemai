import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useSystemStore } from '../stores/systemStore';

const links = [
  'Dashboard',
  'Monitor',
  'Security',
  'Chatbot',
  'Sanitizer',
  'Orchestrator',
  'Logs',
  'Rollback',
  'Settings'
];

/** Sidebar nav with collapse state, status indicators, and performance badge. */
export const Sidebar = (): JSX.Element => {
  const [collapsed, setCollapsed] = useState(false);
  const performanceMode = useSystemStore((s) => s.performanceMode);

  return (
    <aside className={`h-screen border-r border-slate-800 bg-slate-900 p-3 ${collapsed ? 'w-20' : 'w-64'}`}>
      <button
        className="mb-4 w-full rounded bg-slate-800 px-3 py-2 text-xs text-slate-100"
        onClick={() => setCollapsed((v) => !v)}
      >
        {collapsed ? 'Expand' : 'Collapse'}
      </button>
      <div className="mb-4 rounded bg-cyan-900/30 px-3 py-2 text-xs text-cyan-100">Mode: {performanceMode}</div>
      <nav className="space-y-1">
        {links.map((link) => {
          const to = link === 'Dashboard' ? '/' : `/${link.toLowerCase()}`;
          return (
            <NavLink
              key={link}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded px-3 py-2 text-sm ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`
              }
            >
              {!collapsed && <span>{link}</span>}
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
