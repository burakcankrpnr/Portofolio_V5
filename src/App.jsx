import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./index.css";
import Home from "./Pages/Home";
import About from "./Pages/About";
import Navbar from "./components/Navbar";
import Portofolio from "./Pages/Portofolio";
import ContactPage from "./Pages/Contact";
import ProjectDetails from "./components/ProjectDetail";
import Footer from "./components/Footer";
import Intro from "./components/Intro";
import {
  createIntroGate,
  scrollToId,
  useSmoothScroll,
} from "./lib/motion";
import NotFound from "./Pages/NotFound";
import BerilPage from "./Pages/Beril";
import TeklifOsRoute from "./teklifos/TeklifOsRoute";
import FollowScopeRoute from "./followscope/FollowScopeRoute";

const SITE_ORIGIN = "https://burakcankorpinar.dev";

/** Tam sayfa yüklemesinde bir kez; rota değişiminde LandingPage yeniden mount olsa bile tekrarlanmaz. */
let introPlayed = false;

const SECTION_BY_PATH = {
  "/": "Home",
  "/about": "About",
  "/portfolio": "Portofolio",
  "/contact": "Contact",
};

const SEO_BY_PATH = {
  "/": {
    title: "Burak Can Körpınar | Full-Stack Developer Portfolio",
    description:
      "Burak Can Körpınar (burakkexe) - Full-Stack Developer. React, JavaScript, Node.js ile profesyonel web siteleri geliştiriyorum.",
    canonical: `${SITE_ORIGIN}/`,
  },
  "/about": {
    title: "Hakkımda | Burak Can Körpınar",
    description:
      "Burak Can Körpınar hakkında: Full-Stack geliştirme deneyimi, eğitim ve uzmanlık alanları.",
    canonical: `${SITE_ORIGIN}/about`,
  },
  "/portfolio": {
    title: "Portfolyom | Burak Can Körpınar",
    description:
      "Burak Can Körpınar portfolyo projeleri: web siteleri, uygulamalar ve dijital ürünler.",
    canonical: `${SITE_ORIGIN}/portfolio`,
  },
  "/contact": {
    title: "İletişim | Burak Can Körpınar",
    description:
      "Burak Can Körpınar ile iletişime geçin. Proje ve iş birliği talepleri için iletişim formu.",
    canonical: `${SITE_ORIGIN}/contact`,
  },
};

const setMetaTag = (selector, attr, value) => {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (selector.includes("property=")) {
      el.setAttribute("property", selector.match(/property="([^"]+)"/)[1]);
    } else {
      el.setAttribute("name", selector.match(/name="([^"]+)"/)[1]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const useSectionSeo = (introWait) => {
  const { pathname } = useLocation();
  const sectionId = SECTION_BY_PATH[pathname] || "Home";
  const seo = SEO_BY_PATH[pathname] || SEO_BY_PATH["/"];

  useEffect(() => {
    document.title = seo.title;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", seo.canonical);

    setMetaTag('meta[name="description"]', "content", seo.description);
    setMetaTag('meta[property="og:title"]', "content", seo.title);
    setMetaTag('meta[property="og:description"]', "content", seo.description);
    setMetaTag('meta[property="og:url"]', "content", seo.canonical);
    setMetaTag('meta[name="twitter:title"]', "content", seo.title);
    setMetaTag('meta[name="twitter:description"]', "content", seo.description);
    setMetaTag('meta[name="twitter:url"]', "content", seo.canonical);
  }, [seo]);

  useEffect(() => {
    if (pathname === "/") return undefined;

    let cancelled = false;
    let timer;

    Promise.resolve(introWait).then(() => {
      if (cancelled) return;
      timer = setTimeout(() => scrollToId(sectionId), 120);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pathname, sectionId, introWait]);

  return sectionId;
};

const LandingPage = () => {
  const [gate] = useState(() => {
    const active = !introPlayed;
    if (active) introPlayed = true;
    return createIntroGate(active);
  });
  const [showIntro, setShowIntro] = useState(gate.active);

  useSectionSeo(gate.wait);
  useSmoothScroll();

  return (
    <>
      {showIntro && <Intro onReveal={gate.open} onDone={() => setShowIntro(false)} />}
      <Navbar />
      <main>
        <Home ready={gate.wait} />
        <About />
        <Portofolio />
        <ContactPage />
      </main>
      <Footer />
    </>
  );
};

const ProjectPageLayout = () => (
  <>
    <ProjectDetails />
    <Footer />
  </>
);

function LegacyTeklifRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`${pathname.replace(/^\/teklifos/, "/buse")}${search}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/portfolio" element={<LandingPage />} />
        <Route path="/contact" element={<LandingPage />} />
        <Route path="/project/:id" element={<ProjectPageLayout />} />
        <Route path="/beril" element={<BerilPage />} />
        <Route path="/buse/*" element={<TeklifOsRoute />} />
        <Route path="/teklifos/*" element={<LegacyTeklifRedirect />} />
        <Route path="/instagram/*" element={<FollowScopeRoute />} />
        <Route path="/followscope/*" element={<Navigate to="/instagram" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
