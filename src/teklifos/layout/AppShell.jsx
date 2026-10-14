/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BadgePercent,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Search,
  Settings,
  Store,
  Sun,
  Tag,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useStore } from "../data/StoreContext.jsx";
import { ROLES, roleLabel } from "../domain/permissions.js";
import { DemoBanner, useToast } from "../ui/ui.jsx";
import { useDirty } from "./Dirty.jsx";

const GROUPS = [
  {
    title: "Ana",
    items: [{ to: "/buse", label: "Genel Bakış", icon: LayoutDashboard, end: true }],
  },
  {
    title: "Satış",
    items: [
      { to: "/buse/teklifler", label: "Teklifler", icon: FileText },
      { to: "/buse/musteriler", label: "Müşteriler", icon: Users },
    ],
  },
  {
    title: "Katalog",
    items: [
      { to: "/buse/urunler", label: "Ürünler", icon: Package },
      { to: "/buse/markalar", label: "Markalar", icon: Tag },
      { to: "/buse/tedarikciler", label: "Tedarikçiler", icon: Truck },
    ],
  },
  {
    title: "Fiyat",
    items: [
      { to: "/buse/fiyatlandirma", label: "Fiyatlandırma", icon: BadgePercent },
      { to: "/buse/aktarim", label: "Excel Aktarımı", icon: FileSpreadsheet },
    ],
  },
  {
    title: "Sistem",
    items: [
      { to: "/buse/raporlar", label: "Raporlar", icon: BarChart3 },
      { to: "/buse/ayarlar", label: "Ayarlar", icon: Settings },
    ],
  },
];

const CRUMBS = {
  buse: "Genel Bakış",
  teklifler: "Teklifler",
  urunler: "Ürünler",
  markalar: "Markalar",
  musteriler: "Müşteriler",
  tedarikciler: "Tedarikçiler",
  fiyatlandirma: "Fiyatlandırma",
  aktarim: "Excel Aktarımı",
  raporlar: "Raporlar",
  ayarlar: "Ayarlar",
  yeni: "Yeni",
  duzenle: "Düzenle",
};

const CRUMB_ICONS = {
  buse: LayoutDashboard,
  teklifler: FileText,
  urunler: Package,
  markalar: Tag,
  musteriler: Users,
  tedarikciler: Truck,
  fiyatlandirma: BadgePercent,
  aktarim: FileSpreadsheet,
  raporlar: BarChart3,
  ayarlar: Settings,
};

const NAV_SECTIONS_KEY = "buse.nav-sections";
const DEFAULT_SECTIONS = ["Satış", "Katalog", "Fiyat", "Sistem"];

export default function AppShell({ children }) {
  const { state, setDemoRole, storageError } = useStore();
  const location = useLocation();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const dirty = useDirty();
  const [collapsed, setCollapsed] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [openSections, setOpenSections] = useState(DEFAULT_SECTIONS);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("buse.theme") === "dark" ? "dark" : "light";
    const storedCollapsed = window.localStorage.getItem("buse.sidebar") === "1";
    setTheme(storedTheme);
    setCollapsed(storedCollapsed);
    document.documentElement.dataset.buseTheme = storedTheme;
    try {
      const raw = window.localStorage.getItem(NAV_SECTIONS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.every((value) => typeof value === "string") && parsed.length) {
        setOpenSections(parsed);
      }
    } catch {
      setOpenSections(DEFAULT_SECTIONS);
    }
    const media = window.matchMedia("(max-width: 960px)");
    const onMedia = () => setNarrow(media.matches);
    onMedia();
    media.addEventListener("change", onMedia);
    return () => media.removeEventListener("change", onMedia);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(NAV_SECTIONS_KEY, JSON.stringify(openSections));
  }, [openSections]);

  useEffect(() => {
    if (storageError) toastRef.current(storageError, "danger");
  }, [storageError]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("tr-TR");
    if (term.length < 2) return { quotes: [], products: [], customers: [] };
    const has = (...values) => values.some((value) => String(value || "").toLocaleLowerCase("tr-TR").includes(term));
    return {
      quotes: state.quotes.filter((quote) => has(quote.number, quote.customerSnapshot?.name)).slice(0, 5),
      products: state.products.filter((product) => has(product.code, product.name)).slice(0, 5),
      customers: state.customers.filter((customer) => has(customer.name, customer.contactName)).slice(0, 5),
    };
  }, [query, state]);

  const crumbs = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.map((part, index) => {
      const parent = parts[index - 1];
      const quote = parent === "teklifler" ? state.quotes.find((item) => item.id === part) : null;
      const known = Boolean(CRUMBS[part] || quote || parent === "urunler" || parent === "teklifler");
      let label = CRUMBS[part];
      if (!label && quote) label = quote.number;
      if (!label && parent === "urunler") label = "Ürün";
      if (!label && parent === "teklifler") label = "Teklif";
      return {
        href: `/${parts.slice(0, index + 1).join("/")}`,
        label: label || part,
        icon: CRUMB_ICONS[part],
        known,
      };
    });
  }, [location.pathname, state.quotes]);

  const go = (to) => {
    setMobileOpen(false);
    setSearchOpen(false);
    setQuery("");
    dirty.attempt(to);
  };

  const compact = collapsed && !narrow;

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.buseTheme = next;
    window.localStorage.setItem("buse.theme", next);
  };

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      window.localStorage.setItem("buse.sidebar", value ? "0" : "1");
      return !value;
    });
  };

  return (
    <div className={`teklifos-app ${compact ? "is-collapsed" : ""}`}>
      {mobileOpen ? <button type="button" className="tos-overlay" aria-label="Menüyü kapat" onClick={() => setMobileOpen(false)} /> : null}
      <aside className={`tos-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <NavLink end to="/buse" className="tos-brand" title={state.settings.companyName} onClick={(event) => { event.preventDefault(); go("/buse"); }}>
          <span className="tos-mark">V</span>
          {!compact ? (
            <span className="tos-wordmark">
              <strong>{state.settings.companyName}</strong>
              <span>Teklif paneli</span>
            </span>
          ) : null}
        </NavLink>
        <nav className="tos-nav" aria-label="TeklifOS">
          {GROUPS.map((group) => {
            const open = compact || group.title === "Ana" || openSections.includes(group.title);
            return (
              <div key={group.title} className="tos-nav-group">
                {group.title !== "Ana" && !compact ? (
                  <button
                    type="button"
                    className="tos-nav-section"
                    aria-expanded={open}
                    onClick={() => setOpenSections((current) => (
                      current.includes(group.title)
                        ? current.filter((title) => title !== group.title)
                        : [...current, group.title]
                    ))}
                  >
                    <span>{group.title}</span>
                    <ChevronDown size={14} className={open ? "is-open" : ""} />
                  </button>
                ) : null}
                {open ? group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      title={item.label}
                      onClick={(event) => {
                        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                        event.preventDefault();
                        go(item.to);
                      }}
                    >
                      <Icon size={16} aria-hidden="true" />
                      {!compact ? <span>{item.label}</span> : null}
                    </NavLink>
                  );
                }) : null}
              </div>
            );
          })}
        </nav>
        <div className="tos-side-foot">
          <a href="/" title="Portfolyoya dön" onClick={(event) => { event.preventDefault(); go("/"); }}>
            <Store size={16} aria-hidden="true" />
            {!compact ? <span>Portfolyoya dön</span> : null}
          </a>
          <button type="button" className="tos-logout" title="Çıkış yap" onClick={() => go("/")}>
            <LogOut size={16} aria-hidden="true" />
            {!compact ? <span>Çıkış yap</span> : null}
          </button>
          <button type="button" className="tos-collapse" onClick={toggleCollapsed} aria-label={collapsed ? "Kenar çubuğunu aç" : "Kenar çubuğunu daralt"}>
            {compact ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Daralt</span></>}
          </button>
        </div>
      </aside>
      <div className="tos-main">
        <header className="tos-topbar">
          <button type="button" className="tos-icon-btn tos-only-sm" aria-label="Menü" onClick={() => setMobileOpen((value) => !value)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="tos-search-slot">
          <div className="tos-search">
            <Search size={16} aria-hidden="true" />
            <input
              className="tos-input"
              placeholder="Teklif, ürün veya müşteri ara"
              aria-label="Ara"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />
            {searchOpen && query.trim().length >= 2 ? (
              <div className="tos-search-pop">
                {results.quotes.length + results.products.length + results.customers.length === 0 ? (
                  <p className="tos-hint" style={{ padding: 8 }}>Sonuç yok</p>
                ) : null}
                {results.quotes.map((quote) => (
                  <button type="button" key={quote.id} onClick={() => go(`/buse/teklifler/${quote.id}`)}>
                    {quote.number}
                    <small>Teklif · {quote.customerSnapshot?.name}</small>
                  </button>
                ))}
                {results.products.map((product) => (
                  <button type="button" key={product.id} onClick={() => go(`/buse/urunler/${product.id}`)}>
                    {product.code}
                    <small>Ürün · {product.name}</small>
                  </button>
                ))}
                {results.customers.map((customer) => (
                  <button type="button" key={customer.id} onClick={() => go("/buse/musteriler")}>
                    {customer.name}
                    <small>Müşteri</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          </div>
          <div className="tos-top-actions">
          <div className="tos-user">
            <button type="button" className="tos-icon-btn" aria-label="Aktiviteler" aria-expanded={bellOpen} onClick={() => { setBellOpen((value) => !value); setUserOpen(false); }}>
              <Bell size={18} />
            </button>
            {bellOpen ? (
              <div className="tos-menu-pop tos-user-pop" style={{ top: 42 }}>
                {state.activities.slice(0, 6).map((item) => (
                  <button type="button" key={item.id} onClick={() => setBellOpen(false)}>{item.message}</button>
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" className="tos-icon-btn" aria-label={theme === "dark" ? "Açık tema" : "Koyu tema"} onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="tos-user">
            <button type="button" className="tos-btn tos-btn-secondary" aria-expanded={userOpen} onClick={() => { setUserOpen((value) => !value); setBellOpen(false); }}>
              {roleLabel(state.settings.demoRole)}
            </button>
            {userOpen ? (
              <div className="tos-menu-pop tos-user-pop" style={{ top: 46 }}>
                <p className="tos-hint" style={{ padding: "8px 10px" }}>Gerçek oturum değildir</p>
                {ROLES.map((role) => (
                  <button
                    type="button"
                    key={role.id}
                    onClick={() => {
                      setDemoRole(role.id);
                      setUserOpen(false);
                      toast(`${role.label}: ${role.hint}`, "success");
                    }}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          </div>
        </header>
        <div className="tos-stage">
          <button
            type="button"
            className="tos-rail"
            onClick={toggleCollapsed}
            aria-label={compact ? "Kenar çubuğunu aç" : "Kenar çubuğunu daralt"}
          >
            {compact ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <div className="tos-crumbs">
            {crumbs.map((item, index) => {
              const Icon = item.icon;
              return (
                <span key={item.href}>
                  {index > 0 ? <span className="tos-crumb-sep">/</span> : null}
                  <button type="button" className={item.known ? "" : "is-raw"} onClick={() => go(item.href)}>
                    {Icon ? <Icon size={14} aria-hidden="true" /> : null}
                    {item.label}
                  </button>
                </span>
              );
            })}
          </div>
          <div className="tos-content">
            <div className="tos-wrap">
              <DemoBanner />
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
