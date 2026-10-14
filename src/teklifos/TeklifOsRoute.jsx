import { lazy, Suspense, useEffect } from "react";
import "./styles.css";

const TeklifOsApp = lazy(() => import("./TeklifOsApp.jsx"));

export default function TeklifOsRoute() {
  useEffect(() => {
    document.documentElement.classList.add("teklifos-active");
    document.body.classList.add("teklifos-active");
    return () => {
      document.documentElement.classList.remove("teklifos-active");
      document.body.classList.remove("teklifos-active");
    };
  }, []);

  return (
    <Suspense fallback={<div className="teklifos-boot">TeklifOS yükleniyor…</div>}>
      <TeklifOsApp />
    </Suspense>
  );
}
