import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { lockScroll, scrollToId } from "../lib/motion";

const NAV_LINKS = [
  { path: "/about", id: "About", label: "Hakkımda" },
  { path: "/portfolio", id: "Portofolio", label: "İşler" },
  { path: "/contact", id: "Contact", label: "İletişim" },
];

const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("Home");

  useEffect(() => {
    const fromPath = NAV_LINKS.find((item) => item.path === location.pathname);
    if (fromPath) setActiveSection(fromPath.id);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const probe = window.scrollY + window.innerHeight * 0.4;
      let current = "Home";
      for (const item of NAV_LINKS) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= probe) current = item.id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    lockScroll(isOpen);
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => () => lockScroll(false), []);

  const go = (id) => {
    setIsOpen(false);
    // menü kapanıp kaydırma kilidi kalktıktan sonra kaydır
    requestAnimationFrame(() => scrollToId(id, id === "Home" ? { offset: 0 } : undefined));
  };

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || isOpen
          ? "border-b border-cizgi bg-gece/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="shell flex h-16 items-center justify-between md:h-[72px]" aria-label="Ana menü">
        <Link
          to="/"
          onClick={() => go("Home")}
          className="display text-lg font-semibold text-kar"
          style={{ fontVariationSettings: '"wdth" 85' }}
        >
          Burak Can Körpınar
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => go(item.id)}
              aria-current={activeSection === item.id ? "true" : undefined}
              className={`text-[15px] transition-colors duration-200 ${
                activeSection === item.id ? "text-kayisi" : "text-sis hover:text-kar"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/contact" onClick={() => go("Contact")} className="btn-primary h-10 px-5 text-sm">
            Projeni konuşalım
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="-mr-2 p-2 text-kar md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
    </header>

      <div
        id="mobile-menu"
        className={`fixed inset-x-0 bottom-0 top-16 z-40 bg-gece transition-[opacity,visibility] duration-300 md:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="shell flex h-full flex-col justify-between pb-10 pt-8">
          <ul className="space-y-2">
            {[{ path: "/", id: "Home", label: "Ana sayfa" }, ...NAV_LINKS].map((item, i) => (
              <li
                key={item.id}
                className="transition-[transform,opacity] duration-500"
                style={{
                  transitionDelay: isOpen ? `${80 + i * 50}ms` : "0ms",
                  transform: isOpen ? "none" : "translateY(12px)",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <Link
                  to={item.path}
                  onClick={() => go(item.id)}
                  className={`display block py-2 text-5xl font-semibold ${
                    activeSection === item.id ? "text-kayisi" : "text-kar"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <a href="mailto:burikcankorpinar@gmail.com" className="text-sis link-underline">
            burikcankorpinar@gmail.com
          </a>
        </div>
      </div>
    </>
  );
};

export default Navbar;
