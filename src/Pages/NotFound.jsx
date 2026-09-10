import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, FolderKanban, ArrowLeft, Compass } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedBackground from "../components/Background";

const QUICK_LINKS = [
  { to: "/", label: "Ana Sayfa", icon: Home },
  { to: "/portfolio", label: "Portfolyom", icon: FolderKanban },
  { to: "/contact", label: "İletişim", icon: Compass },
];

const NotFound = () => {
  useEffect(() => {
    document.title = "404 | Sayfa Bulunamadı — Burak Can Körpınar";

    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, follow");

    return () => {
      robots.setAttribute(
        "content",
        "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      );
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030014] text-white">
      <AnimatedBackground />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-2xl text-center"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-xl">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#a855f7]" />
            <span className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-sm font-medium text-transparent">
              Hata 404
            </span>
          </div>

          <div className="relative mb-6">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#6366f1] to-[#a855f7] opacity-25 blur-3xl"
            />
            <h1 className="relative bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-[7rem] font-bold leading-none tracking-tight text-transparent sm:text-[9rem]">
              404
            </h1>
          </div>

          <h2 className="mb-3 text-2xl font-semibold text-white sm:text-3xl">
            Sayfa bulunamadı
          </h2>
          <p className="mx-auto mb-10 max-w-md text-sm leading-relaxed text-[#e2d3fd]/70 sm:text-base">
            Aradığınız adres taşınmış veya hiç var olmamış olabilir. Ana sayfaya
            dönüp gezintiye devam edebilirsiniz.
          </p>

          <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/" className="group relative w-full sm:w-auto">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#4f52c9] to-[#8644c5] opacity-50 blur-md transition-all duration-500 group-hover:opacity-90" />
              <span className="relative flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#030014] px-6 text-sm font-medium text-white backdrop-blur-xl transition-all duration-300 group-hover:gap-3">
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                Ana Sayfaya Dön
              </span>
            </Link>

            <Link
              to="/portfolio"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 text-sm font-medium text-[#e2d3fd] backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white sm:w-auto"
            >
              Projeleri Gör
            </Link>
          </div>

          <div className="mx-auto grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
            {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-gray-300 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:text-white"
              >
                <Icon className="h-4 w-4 text-[#a855f7] transition-transform duration-300 group-hover:scale-110" />
                {label}
              </Link>
            ))}
          </div>
        </motion.div>

        <p className="absolute bottom-6 text-xs text-gray-500">
          © 2026 Burak Can Körpınar
        </p>
      </div>
    </div>
  );
};

export default NotFound;
