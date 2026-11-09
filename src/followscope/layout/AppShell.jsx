/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const NAV = [
  { to: "/instagram", label: "Genel Bakış", icon: LayoutDashboard, end: true },
  { to: "/instagram/geri-takip-etmeyenler", label: "Geri Takip Etmeyenler", icon: UserMinus },
  { to: "/instagram/takip-etmediklerim", label: "Takip Etmediklerim", icon: UserPlus },
  { to: "/instagram/karsilikli", label: "Karşılıklı Takip", icon: Users },
  { to: "/instagram/gecmis", label: "Değişim Geçmişi", icon: ArrowLeftRight },
  { to: "/instagram/ayarlar", label: "Ayarlar", icon: Settings },
];

export default function AppShell({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="followscope-app">
      {mobileOpen ? (
        <button type="button" className="fs-overlay" aria-label="Menüyü kapat" onClick={() => setMobileOpen(false)} />
      ) : null}

      <aside className={`fs-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <NavLink to="/instagram" end className="fs-brand" onClick={() => setMobileOpen(false)}>
          <span className="fs-mark">FS</span>
          <span>
            <strong>FollowScope</strong>
            <span>Yerel takip analizi</span>
          </span>
        </NavLink>

        <nav className="fs-nav" aria-label="FollowScope">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)}>
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="fs-side-foot">
          <a href="/">Portfolyoya dön</a>
        </div>
      </aside>

      <div className="fs-main">
        <header className="fs-topbar">
          <button
            type="button"
            className="fs-icon-btn"
            aria-label="Menü"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Instagram takip analizi</div>
            <div style={{ fontSize: 12, color: "var(--fs-muted)" }}>Şifre istemez · tarayıcıda çalışır</div>
          </div>
          <div className="fs-privacy">
            <ShieldCheck size={14} aria-hidden="true" />
            Veriler cihazında kalır
          </div>
        </header>
        <div className="fs-content">
          <div className="fs-wrap">{children}</div>
        </div>
      </div>
    </div>
  );
}
