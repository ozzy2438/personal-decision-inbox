import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { InboxProvider } from "./store/inbox-context";
import { AppShell } from "./ui/AppShell";
import { LogPage } from "./pages/LogPage";
import { QueuePage } from "./pages/QueuePage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <InboxProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<QueuePage queue="decide" />} />
            <Route path="confirm" element={<QueuePage queue="confirm" />} />
            <Route path="waiting" element={<QueuePage queue="waiting" />} />
            <Route path="filed" element={<QueuePage queue="filed" />} />
            <Route path="log" element={<LogPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </InboxProvider>
    </BrowserRouter>
  );
}
