import { lazy, Suspense, useEffect } from "react";
import "./styles.css";

const FollowScopeApp = lazy(() => import("./FollowScopeApp.jsx"));

export default function FollowScopeRoute() {
  useEffect(() => {
    document.documentElement.classList.add("followscope-active");
    document.body.classList.add("followscope-active");
    return () => {
      document.documentElement.classList.remove("followscope-active");
      document.body.classList.remove("followscope-active");
    };
  }, []);

  return (
    <Suspense fallback={<div className="followscope-boot">FollowScope yükleniyor…</div>}>
      <FollowScopeApp />
    </Suspense>
  );
}
