import { useEffect, useRef, useState, useCallback } from "react";

/** 6 saatte bir cache kır — siteler değişince yeni yakalama gelsin */
const REFRESH_BUCKET_MS = 6 * 60 * 60 * 1000;
/** Sayfa açıkken arka plan kontrol aralığı */
const BACKGROUND_CHECK_MS = 15 * 60 * 1000;
/** Hata sonrası yeniden deneme */
const RETRY_MS = 45 * 1000;

const previewFileFromUrl = (url) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return `/previews/${host}.jpg`;
  } catch {
    return null;
  }
};

const cacheBucket = (now = Date.now()) => Math.floor(now / REFRESH_BUCKET_MS);

const liveCaptureSources = (url, bucket) => {
  const stamp = `v=${bucket}`;
  return [
    `https://image.thum.io/get/fullpage/width/1440/noanimate/wait/3/${url}?${stamp}`,
    `https://mini.s-shot.ru/1440x9000/JPEG/1440/Z80/?${url}&${stamp}`,
  ];
};

const preloadImage = (href) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(href);
    img.onerror = reject;
    img.src = href;
  });

const loadFirstAvailable = async (sources, signal) => {
  for (const href of sources) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      await preloadImage(href);
      return href;
    } catch {
      // sonraki kaynağı dene
    }
  }
  throw new Error("All preview sources failed");
};

const WebsitePreview = ({ url, title }) => {
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const bucketRef = useRef(null);
  const abortRef = useRef(null);
  const readyRef = useRef(false);

  const [isActive, setIsActive] = useState(false);
  const [canHover, setCanHover] = useState(true);
  const [duration, setDuration] = useState(12);
  const [offset, setOffset] = useState(0);
  const [src, setSrc] = useState(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [checking, setChecking] = useState(false);

  const previewPath = previewFileFromUrl(url);

  const measureScroll = useCallback(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return;

    const extra = Math.max(0, image.scrollHeight - frame.clientHeight);
    setOffset(extra);
    setDuration(extra <= 0 ? 6 : Math.min(28, Math.max(8, extra / 90)));
  }, []);

  const applySrc = useCallback(
    (href) => {
      setSrc(href);
      setReady(true);
      readyRef.current = true;
      setFailed(false);
      setChecking(false);
      requestAnimationFrame(() => measureScroll());
    },
    [measureScroll]
  );

  const refreshLive = useCallback(
    async ({ force = false } = {}) => {
      const bucket = cacheBucket();
      if (!force && bucketRef.current === bucket && readyRef.current) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      bucketRef.current = bucket;
      setChecking(true);

      try {
        const href = await loadFirstAvailable(
          liveCaptureSources(url, bucket),
          controller.signal
        );
        if (controller.signal.aborted) return;
        applySrc(href);
      } catch (error) {
        if (error?.name === "AbortError") return;
        setChecking(false);
        if (!readyRef.current) {
          setFailed(true);
          setSrc(null);
          setReady(false);
        }
      }
    },
    [url, applySrc]
  );

  // İlk açılış: yerel placeholder → canlı güncelleme
  useEffect(() => {
    let cancelled = false;
    bucketRef.current = null;
    readyRef.current = false;
    setReady(false);
    setFailed(false);
    setIsActive(false);
    setSrc(null);
    setChecking(true);

    const boot = async () => {
      if (previewPath) {
        try {
          const response = await fetch(previewPath, {
            method: "HEAD",
            cache: "no-store",
          });
          if (!cancelled && response.ok) {
            await preloadImage(previewPath);
            if (!cancelled) applySrc(previewPath);
          }
        } catch {
          // canlıya geç
        }
      }

      if (!cancelled) {
        await refreshLive({ force: true });
      }
    };

    boot();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [url, previewPath, applySrc, refreshLive]);

  // Arka plan kontrolü (15 dk + sekme odak)
  useEffect(() => {
    const maybeRefresh = () => {
      if (document.visibilityState === "hidden") return;
      refreshLive({ force: false });
    };

    const interval = setInterval(maybeRefresh, BACKGROUND_CHECK_MS);
    document.addEventListener("visibilitychange", maybeRefresh);
    window.addEventListener("focus", maybeRefresh);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", maybeRefresh);
      window.removeEventListener("focus", maybeRefresh);
    };
  }, [refreshLive]);

  // Hata sonrası otomatik retry
  useEffect(() => {
    if (!failed) return undefined;
    const timer = setTimeout(() => {
      refreshLive({ force: true });
    }, RETRY_MS);
    return () => clearTimeout(timer);
  }, [failed, refreshLive]);

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
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => measureScroll());
    observer.observe(frame);
    return () => observer.disconnect();
  }, [ready, measureScroll]);

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
        {checking && ready && (
          <span className="ml-auto text-[9px] text-white/30">güncelleniyor</span>
        )}
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
            : failed
              ? `${title} önizlemesi alınamadı`
              : `${title} önizlemesi hazırlanıyor`
        }
      >
        {src && (
          <img
            ref={imageRef}
            src={src}
            alt={`${title} sitesinin canlı görünümü`}
            onLoad={measureScroll}
            className={`absolute left-0 top-0 w-full max-w-none cursor-pointer will-change-transform ${
              ready ? "opacity-100" : "opacity-0"
            }`}
            style={{
              transform: isActive
                ? `translateY(-${offset}px)`
                : "translateY(0)",
              transition: isActive
                ? `transform ${duration}s linear`
                : "transform 0.8s ease-out",
            }}
          />
        )}

        {ready && (
          <>
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
        )}

        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950 px-4 text-center">
            <div className="h-8 w-8 animate-pulse rounded-full border border-white/10 bg-white/5" />
            <p className="text-[11px] text-white/40">
              {failed
                ? "Önizleme alınamadı, yeniden deneniyor…"
                : "Canlı önizleme hazırlanıyor…"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsitePreview;
