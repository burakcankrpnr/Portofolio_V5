import { ArrowUp } from "lucide-react";
import { scrollToId } from "../lib/motion";

const Footer = () => (
  <footer className="border-t border-cizgi">
    <div className="shell flex flex-col gap-4 py-8 text-sm text-sis sm:flex-row sm:items-center sm:justify-between">
      <p>© {new Date().getFullYear()} Burak Can Körpınar. Tüm hakları saklıdır.</p>
      <button
        type="button"
        onClick={() => (document.getElementById("Home") ? scrollToId("Home", { offset: 0 }) : window.scrollTo({ top: 0 }))}
        className="inline-flex items-center gap-2 self-start text-kar transition-colors hover:text-kayisi sm:self-auto"
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
        Başa dön
      </button>
    </div>
  </footer>
);

export default Footer;
