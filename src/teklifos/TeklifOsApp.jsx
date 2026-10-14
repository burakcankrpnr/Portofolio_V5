import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { StoreProvider } from "./data/StoreContext.jsx";
import { DirtyProvider } from "./layout/Dirty.jsx";
import AppShell from "./layout/AppShell.jsx";
import { ConfirmProvider, EmptyState, ToastProvider } from "./ui/ui.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import QuotesPage from "./pages/QuotesPage.jsx";
import QuoteEditorPage from "./pages/QuoteEditorPage.jsx";
import QuoteDetailPage from "./pages/QuoteDetailPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import ProductEditorPage from "./pages/ProductEditorPage.jsx";
import BrandsPage from "./pages/BrandsPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import SuppliersPage from "./pages/SuppliersPage.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import ImportPage from "./pages/ImportPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

function Missing() {
  return <EmptyState title="Sayfa bulunamadı" body="Bu bölüm TeklifOS içinde yok." action={<a className="tos-btn tos-btn-secondary" href="/buse">Genel bakışa dön</a>} />;
}

export default function TeklifOsApp() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "TeklifOS";
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
      <ToastProvider>
        <ConfirmProvider>
          <DirtyProvider>
            <AppShell>
              <Routes>
                <Route index element={<DashboardPage />} />
                <Route path="teklifler" element={<QuotesPage />} />
                <Route path="teklifler/yeni" element={<QuoteEditorPage />} />
                <Route path="teklifler/:id" element={<QuoteDetailPage />} />
                <Route path="teklifler/:id/duzenle" element={<QuoteEditorPage />} />
                <Route path="urunler" element={<ProductsPage />} />
                <Route path="urunler/yeni" element={<ProductEditorPage />} />
                <Route path="urunler/:id" element={<ProductEditorPage />} />
                <Route path="markalar" element={<BrandsPage />} />
                <Route path="musteriler" element={<CustomersPage />} />
                <Route path="tedarikciler" element={<SuppliersPage />} />
                <Route path="fiyatlandirma" element={<PricingPage />} />
                <Route path="aktarim" element={<ImportPage />} />
                <Route path="raporlar" element={<ReportsPage />} />
                <Route path="ayarlar" element={<SettingsPage />} />
                <Route path="*" element={<Missing />} />
              </Routes>
            </AppShell>
          </DirtyProvider>
        </ConfirmProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
