import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "./index.css";
import Home from "./Pages/Home";
import About from "./Pages/About";
import AnimatedBackground from "./components/Background";
import Navbar from "./components/Navbar";
import Portofolio from "./Pages/Portofolio";
import ContactPage from "./Pages/Contact";
import ProjectDetails from "./components/ProjectDetail";
import WelcomeScreen from "./Pages/WelcomeScreen";

const SITE_ORIGIN = "https://burakcankorpinar.dev";

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

const useSectionSeo = () => {
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

    const timer = setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        window.scrollTo({ top: section.offsetTop - 100, behavior: "smooth" });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [pathname, sectionId]);

  return sectionId;
};

const LandingPage = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [showWelcome, setShowWelcome] = useState(isHome);

  useSectionSeo();

  return (
    <>
      {showWelcome && (
        <WelcomeScreen onLoadingComplete={() => setShowWelcome(false)} />
      )}

      <div
        className={
          showWelcome ? "pointer-events-none overflow-hidden h-screen" : undefined
        }
      >
        <Navbar />
        <AnimatedBackground />
        <Home />
        <About />
        <Portofolio />
        <ContactPage />
        <footer>
          <center>
            <hr className="my-3 border-gray-400 opacity-15 sm:mx-auto lg:my-6 text-center" />
            <span className="block text-sm pb-4 text-gray-500 text-center dark:text-gray-400">
              © 2026{" "}
              <a href="https://flowbite.com/" className="hover:underline">
                Burak Can Körpınar ™
              </a>
              . All Rights Reserved.
            </span>
          </center>
        </footer>
      </div>
    </>
  );
};

const ProjectPageLayout = () => (
  <>
    <ProjectDetails />
    <footer>
      <center>
        <hr className="my-3 border-gray-400 opacity-15 sm:mx-auto lg:my-6 text-center" />
        <span className="block text-sm pb-4 text-gray-500 text-center dark:text-gray-400">
          © 2026{" "}
          <a href="https://flowbite.com/" className="hover:underline">
            Burak Can Körpınar™
          </a>
          . All Rights Reserved.
        </span>
      </center>
    </footer>
  </>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/portfolio" element={<LandingPage />} />
        <Route path="/contact" element={<LandingPage />} />
        <Route path="/project/:id" element={<ProjectPageLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
