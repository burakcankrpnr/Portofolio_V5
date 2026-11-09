import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { StoreProvider } from "./data/StoreContext.jsx";
import AppShell from "./layout/AppShell.jsx";
import { EmptyState } from "./components/ui.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import NotFollowingBackPage from "./pages/NotFollowingBackPage.jsx";
import FollowersNotFollowingPage from "./pages/FollowersNotFollowingPage.jsx";
import MutualsPage from "./pages/MutualsPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

function Missing() {
  return (
    <EmptyState
      title="Sayfa bulunamadı"
      body="Bu bölüm FollowScope içinde yok."
      action={<a className="fs-btn fs-btn-secondary" href="/followscope">Genel bakışa dön</a>}
    />
  );
}

export default function FollowScopeApp() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "FollowScope";
    let robots = document.querySelector('meta[name="robots"]');
    const created = !robots;
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    const previousRobots = robots.getAttribute("content");
    robots.setAttribute("content", "noindex, nofollow");
    return () => {
      document.title = previousTitle;
      if (created) robots.remove();
      else robots.setAttribute("content", previousRobots || "index, follow");
    };
  }, []);

  return (
    <StoreProvider>
      <AppShell>
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="geri-takip-etmeyenler" element={<NotFollowingBackPage />} />
          <Route path="takip-etmediklerim" element={<FollowersNotFollowingPage />} />
          <Route path="karsilikli" element={<MutualsPage />} />
          <Route path="gecmis" element={<HistoryPage />} />
          <Route path="ayarlar" element={<SettingsPage />} />
          <Route path="dashboard" element={<Navigate to="/followscope" replace />} />
          <Route path="*" element={<Missing />} />
        </Routes>
      </AppShell>
    </StoreProvider>
  );
}
