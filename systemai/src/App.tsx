import { Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { MonitorPage } from './pages/MonitorPage';
import { SecurityPage } from './pages/SecurityPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { SanitizerPage } from './pages/SanitizerPage';
import { OrchestratorPage } from './pages/OrchestratorPage';
import { LogsPage } from './pages/LogsPage';
import { RollbackPage } from './pages/RollbackPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationCenter } from './components/Notifications/NotificationCenter';

const Layout = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <div className="flex min-h-screen bg-slate-950 text-slate-100">
    <Sidebar />
    <main className="flex-1 space-y-4 p-4">{children}</main>
  </div>
);

export const App = (): JSX.Element => (
  <Layout>
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/monitor" element={<MonitorPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/chatbot" element={<ChatbotPage />} />
      <Route path="/sanitizer" element={<SanitizerPage />} />
      <Route path="/orchestrator" element={<OrchestratorPage />} />
      <Route path="/logs" element={<LogsPage />} />
      <Route path="/rollback" element={<RollbackPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
    <NotificationCenter />
  </Layout>
);
