import { useEffect, useRef, useState } from "react";

const previewFileFromUrl = (url) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return `/previews/${host}.jpg`;
  } catch {
    return null;
  }
};

const WebsitePreview = ({ url, title }) => {
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [canHover, setCanHover] = useState(true);
  const [duration, setDuration] = useState(12);
  const [offset, setOffset] = useState(0);
  const [src, setSrc] = useState(null);
  const [ready, setReady] = useState(false);

  const previewPath = previewFileFromUrl(url);

  useEffect(() => {
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      setCanHover(hoverQuery.matches && !motionQuery.matches);
    };

    sync();
    hoverQuery.addEventListener("change", sync);
    motionQuery.addEventListener("change", sync);
    return () => {
      hoverQuery.removeEventListener("change", sync);
      motionQuery.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!previewPath) {
      setReady(false);
      setSrc(null);
      return undefined;
    }

    let cancelled = false;
    let found = false;

    const check = async () => {
      if (cancelled || found) return;

      try {
        const stamp = Date.now();
        const response = await fetch(`${previewPath}?t=${stamp}`, {
          method: "HEAD",
          cache: "no-store",
        });

        if (!response.ok || cancelled) return;

        found = true;
        setSrc(`${previewPath}?t=${stamp}`);
        setReady(true);
      } catch {
        // keep empty until file appears
      }
    };

    setReady(false);
    setSrc(null);
    check();
    const timer = setInterval(check, 4000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [previewPath]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => measureScroll());
    observer.observe(frame);
    return () => observer.disconnect();
  }, [ready]);

  const measureScroll = () => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return;

    const extra = Math.max(0, image.scrollHeight - frame.clientHeight);
    setOffset(extra);
    setDuration(extra <= 0 ? 6 : Math.min(28, Math.max(8, extra / 90)));
  };

  const displayUrl = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return title;
    }
  })();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-950">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-slate-900/90 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-red-400/80" />
        <span className="h-2 w-2 rounded-full bg-amber-400/80" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
        <span className="ml-1 truncate rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
          {displayUrl}
        </span>
      </div>

      <div
        ref={frameRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        onMouseEnter={() => ready && canHover && setIsActive(true)}
        onMouseLeave={() => ready && canHover && setIsActive(false)}
        onClick={() => {
          if (ready && !canHover) setIsActive((current) => !current);
        }}
        role="img"
        aria-label={
          ready
            ? `${title} canlı önizleme`
            : `${title} önizlemesi hazırlanıyor`
        }
      >
        {ready && src ? (
          <>
            <img
              ref={imageRef}
              src={src}
              alt={`${title} sitesinin canlı görünümü`}
              onLoad={measureScroll}
              onError={() => {
                setReady(false);
                setSrc(null);
              }}
              className="absolute left-0 top-0 w-full max-w-none cursor-pointer will-change-transform"
              style={{
                transform: isActive
                  ? `translateY(-${offset}px)`
                  : "translateY(0)",
                transition: isActive
                  ? `transform ${duration}s linear`
                  : "transform 0.8s ease-out",
              }}
            />

            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10 transition-opacity duration-300 ${
                isActive ? "opacity-0" : "opacity-100"
              }`}
            />

            <div
              className={`pointer-events-none absolute inset-x-0 bottom-3 flex justify-center transition-all duration-300 ${
                isActive
                  ? "translate-y-2 opacity-0"
                  : "translate-y-0 opacity-100"
              }`}
            >
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-white shadow-lg backdrop-blur-md">
                <span className="relative flex h-6 w-4 items-start justify-center rounded-full border border-white/80 pt-1">
                  <span className="preview-mouse-wheel h-1.5 w-0.5 rounded-full bg-white" />
                </span>
                <span className="text-[11px] font-medium tracking-wide text-white/90">
                  {canHover ? "Gezmek için üzerine gel" : "Gezmek için dokun"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950 px-4 text-center">
            <div className="h-8 w-8 animate-pulse rounded-full border border-white/10 bg-white/5" />
            <p className="text-[11px] text-white/40">Önizleme hazırlanıyor…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsitePreview;
