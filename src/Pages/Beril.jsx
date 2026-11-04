import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { extractPdfText } from "../beril/extractPdfText";
import { checkBerilHealth, translatePages } from "../beril/translateApi";
import { buildTranslatedPdfBlob, downloadBlob } from "../beril/buildTranslatedPdf";
import {
  clearHistory,
  formatHistoryDate,
  listHistory,
  removeHistoryItem,
  saveHistoryItem,
} from "../beril/historyStore";
import HeartEdges from "../beril/HeartEdges";

const STATUS = {
  queued: "Bekliyor",
  extracting: "Metin çıkarılıyor",
  translating: "Çevriliyor",
  ready: "Hazır",
  error: "Hata",
};

const SPOTIFY_BLEND =
  "https://open.spotify.com/blend/taste-match/97b013ce61aa7b5d?si=fxBnHNj7TQ-wt6cdsavLPw&fallback=getapp&blendDecoration=5f9c38d2";

function makeJob(file) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    name: file.name,
    pageCount: null,
    status: "queued",
    error: null,
    blob: null,
    percent: 0,
  };
}

function jobPercent(job) {
  if (typeof job.percent === "number") return Math.max(0, Math.min(100, Math.round(job.percent)));
  if (job.status === "ready") return 100;
  if (job.status === "queued") return 0;
  return 0;
}

const SpotifyIcon = ({ className = "h-8 w-8" }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

const BerilPage = () => {
  const inputId = useId();
  const inputRef = useRef(null);
  const jobsRef = useRef([]);
  const busyRef = useRef(false);
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [health, setHealth] = useState({ loading: true, ok: false, model: "", error: "" });

  const refreshHistory = useCallback(async () => {
    try {
      const items = await listHistory();
      setHistory(items);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    let cancelled = false;
    checkBerilHealth()
      .then((data) => {
        if (cancelled) return;
        setHealth({
          loading: false,
          ok: Boolean(data.ok),
          model: data.model || "",
          error: data.ok
            ? ""
            : "OPENAI_API_KEY deployment’ta yok (.env → Docker beril servisi / Vercel Env)",
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setHealth({
          loading: false,
          ok: false,
          model: "",
          error: error.message || "Sunucu yok",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateJob = useCallback((id, patch) => {
    setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }, []);

  const processQueue = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);

    const pending = jobsRef.current.filter(
      (job) => job.status === "queued" || job.status === "error"
    );

    for (const job of pending) {
      try {
        updateJob(job.id, {
          status: "extracting",
          error: null,
          blob: null,
          percent: 4,
        });
        const extracted = await extractPdfText(job.file);
        updateJob(job.id, {
          status: "translating",
          pageCount: extracted.pageCount,
          percent: 8,
          progress: `0/${extracted.pageCount}`,
        });

        const translated = await translatePages({
          title: extracted.title,
          pages: extracted.pages,
          onProgress: (done, total) => {
            const ratio = total ? done / total : 1;
            const percent = Math.round(8 + ratio * 90);
            updateJob(job.id, {
              progress: `${done}/${total}`,
              percent,
            });
          },
        });

        updateJob(job.id, { percent: 98 });

        const blob = await buildTranslatedPdfBlob({
          title: `${extracted.title} (TR)`,
          pages: translated.pages,
        });

        await saveHistoryItem({
          id: job.id,
          name: job.name,
          pageCount: extracted.pageCount,
          blob,
          createdAt: Date.now(),
        });
        await refreshHistory();

        updateJob(job.id, { status: "ready", blob, percent: 100 });
      } catch (error) {
        updateJob(job.id, {
          status: "error",
          error: error.message || "İşlem başarısız",
          percent: 0,
        });
      }
    }

    busyRef.current = false;
    setBusy(false);
  }, [refreshHistory, updateJob]);

  const addFiles = useCallback(
    (fileList) => {
      const pdfs = [...fileList].filter(
        (file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name)
      );
      if (!pdfs.length) return;
      setJobs((prev) => [...prev, ...pdfs.map(makeJob)]);
    },
    []
  );

  // Dosya eklenince API hazırsa otomatik başlat
  useEffect(() => {
    if (!health.ok || busy) return;
    const hasPending = jobs.some((j) => j.status === "queued");
    if (!hasPending) return;
    const timer = setTimeout(() => {
      processQueue();
    }, 180);
    return () => clearTimeout(timer);
  }, [jobs, health.ok, busy, processQueue]);

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    addFiles(event.dataTransfer.files);
  };

  const removeJob = async (job) => {
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    if (job.status === "ready") {
      try {
        await removeHistoryItem(job.id);
        await refreshHistory();
      } catch {
        /* ignore */
      }
    }
  };

  const activeIds = new Set(jobs.map((j) => j.id));
  const pastOnly = history.filter((item) => !activeIds.has(item.id));

  return (
    <div className="relative min-h-screen overflow-x-clip bg-gece text-kar">
      <HeartEdges />
      <header className="relative z-10 border-b border-cizgi/80 bg-gece/70 backdrop-blur-sm">
        <div className="shell flex h-14 items-center justify-between gap-3 sm:h-16 md:h-[72px]">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm text-sis">
              Beril
              <Heart className="h-3.5 w-3.5 shrink-0 fill-kayisi text-kayisi" aria-hidden />
            </p>
            <h1
              className="display truncate text-lg font-semibold leading-none sm:text-xl"
              style={{ fontVariationSettings: '"wdth" 85' }}
            >
              PDF çeviri
            </h1>
          </div>
          <Link
            to="/"
            className="shrink-0 whitespace-nowrap text-xs text-lila transition hover:text-kar sm:text-sm"
          >
            Portfolyoya dön
          </Link>
        </div>
      </header>

      <main className="relative z-10 shell py-8 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:py-10 md:py-14">
        <p className="max-w-2xl text-[15px] leading-relaxed text-sis sm:text-[17px]">
          İngilizce ders notu PDF’lerini Türkçeye çevirir. Tek veya toplu yükleyin; biten dosyaları
          PDF olarak indirin. Eski çeviriler bu tarayıcıda saklanır.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm sm:mt-6">
          <span
            className={`inline-flex max-w-full items-start gap-2 break-words rounded-md border px-3 py-1.5 ${
              health.loading
                ? "border-cizgi text-sis"
                : health.ok
                  ? "border-kayisi/40 text-kayisi"
                  : "border-red-400/40 text-red-300"
            }`}
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                health.loading ? "bg-sis" : health.ok ? "bg-kayisi" : "bg-red-400"
              }`}
            />
            <span className="min-w-0">
              {health.loading
                ? "API kontrol ediliyor…"
                : health.ok
                  ? `API bağlı · ${health.model}`
                  : health.error}
            </span>
          </span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-8 rounded-2xl border border-dashed bg-murekkep/60 px-4 py-10 text-center transition sm:mt-10 sm:px-6 sm:py-14 ${
            dragOver ? "border-kayisi bg-murekkep" : "border-cizgi"
          }`}
        >
          <p
            className="display text-xl font-semibold sm:text-2xl"
            style={{ fontVariationSettings: '"wdth" 90' }}
          >
            <span className="sm:hidden">PDF seçin</span>
            <span className="hidden sm:inline">PDF bırakın</span>
          </p>
          <p className="mt-2 text-sm text-sis sm:text-base">
            <span className="sm:hidden">Galeriden veya dosyalardan yükleyin — tekli ve toplu</span>
            <span className="hidden sm:inline">veya dosya seçin — tekli ve toplu desteklenir</span>
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label
              htmlFor={inputId}
              className="cursor-pointer rounded-lg bg-kayisi px-5 py-3 text-center text-sm font-medium text-gece transition hover:brightness-110 sm:py-2.5"
            >
              Dosya seç
            </label>
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files || []);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={!jobs.some((j) => j.status === "queued" || j.status === "error") || busy || !health.ok}
              onClick={processQueue}
              className="rounded-lg border border-cizgi px-5 py-3 text-sm text-kar transition enabled:hover:border-lila enabled:hover:text-lila disabled:cursor-not-allowed disabled:opacity-40 sm:py-2.5"
            >
              {busy ? "Çevriliyor…" : "Çeviriyi başlat"}
            </button>
          </div>
        </div>

        {jobs.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm text-sis">Kuyruk</h2>
            <ul className="space-y-3">
              {jobs.map((job) => {
                const pct = jobPercent(job);
                return (
                  <li
                    key={job.id}
                    className="rounded-xl border border-cizgi bg-murekkep px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-all font-medium text-kar sm:truncate">{job.name}</p>
                        <p className="mt-1 break-words text-sm text-sis">
                          {STATUS[job.status]}
                          {job.status !== "queued" && job.status !== "error" ? ` · %${pct}` : ""}
                          {job.status === "translating" && job.progress ? ` (${job.progress})` : ""}
                          {job.pageCount != null ? ` · ${job.pageCount} sayfa` : ""}
                          {job.error ? ` · ${job.error}` : ""}
                        </p>
                      </div>
                      <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                        {job.status === "ready" && job.blob && (
                          <button
                            type="button"
                            onClick={() =>
                              downloadBlob(job.blob, job.name.replace(/\.pdf$/i, "") + "-TR.pdf")
                            }
                            className="flex-1 rounded-lg bg-kayisi px-4 py-2.5 text-sm font-medium text-gece sm:flex-none sm:py-2"
                          >
                            PDF’e tıkla
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeJob(job)}
                          className="flex-1 rounded-lg border border-cizgi px-4 py-2.5 text-sm text-sis hover:text-kar sm:flex-none sm:py-2"
                        >
                          Kaldır
                        </button>
                      </div>
                    </div>
                    {(job.status === "extracting" ||
                      job.status === "translating" ||
                      job.status === "ready") && (
                      <div className="mt-3">
                        <div className="h-2 overflow-hidden rounded-full bg-gece">
                          <div
                            className="h-full rounded-full bg-kayisi transition-[width] duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-right text-xs text-sis">%{pct}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-12">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm text-sis">Önceki çeviriler</h2>
            {pastOnly.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await clearHistory();
                  setJobs((prev) => prev.filter((j) => j.status !== "ready"));
                  await refreshHistory();
                }}
                className="text-sm text-sis underline-offset-2 hover:text-kar hover:underline"
              >
                Tümünü sil
              </button>
            )}
          </div>

          {historyLoading ? (
            <p className="text-sm text-sis">Yükleniyor…</p>
          ) : pastOnly.length === 0 ? (
            <p className="rounded-xl border border-cizgi bg-murekkep/40 px-4 py-6 text-sm text-sis">
              Henüz kayıtlı çeviri yok. Biten PDF’ler burada listelenir ve tekrar indirilebilir.
            </p>
          ) : (
            <ul className="space-y-3">
              {pastOnly.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-cizgi bg-murekkep px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-all font-medium text-kar sm:truncate">{item.name}</p>
                    <p className="mt-1 text-sm text-sis">
                      {formatHistoryDate(item.createdAt)}
                      {item.pageCount != null ? ` · ${item.pageCount} sayfa` : ""}
                    </p>
                  </div>
                  <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(item.blob, item.name.replace(/\.pdf$/i, "") + "-TR.pdf")
                      }
                      className="flex-1 rounded-lg bg-kayisi px-4 py-2.5 text-sm font-medium text-gece sm:flex-none sm:py-2"
                    >
                      PDF’e tıkla
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await removeHistoryItem(item.id);
                        await refreshHistory();
                      }}
                      className="flex-1 rounded-lg border border-cizgi px-4 py-2.5 text-sm text-sis hover:text-kar sm:flex-none sm:py-2"
                    >
                      Sil
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="relative mt-12 overflow-hidden rounded-2xl border border-[#1DB954]/35 bg-gradient-to-br from-[#0d1f14] via-murekkep to-gece px-4 py-8 sm:mt-16 sm:rounded-3xl sm:px-6 sm:py-10 md:px-10">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#1DB954]/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-8 left-8 h-28 w-28 rounded-full bg-kayisi/10 blur-2xl"
            aria-hidden
          />
          <div className="relative flex flex-col items-stretch gap-5 sm:gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1DB954] text-gece shadow-[0_0_40px_-8px_rgba(29,185,84,0.7)] sm:h-14 sm:w-14">
                <SpotifyIcon className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm text-[#1DB954]">
                  Spotify Blend
                  <Heart className="h-4 w-4 fill-kayisi text-kayisi" aria-hidden />
                </p>
                <p
                  className="mt-2 max-w-xl display text-xl font-semibold leading-snug text-kar sm:text-2xl md:text-3xl"
                  style={{ fontVariationSettings: '"wdth" 90' }}
                >
                  Burak seni Spotify’da bir Blend’e katılmaya davet etti
                </p>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-sis sm:text-[15px]">
                  Spotify mobil uygulamasından katıl. Ortak zevkleriniz bir araya gelsin.
                </p>
              </div>
            </div>
            <a
              href={SPOTIFY_BLEND}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#1DB954] px-6 py-3.5 text-sm font-semibold text-[#04140a] transition hover:brightness-110 md:w-auto"
            >
              <Heart className="h-4 w-4 fill-current" aria-hidden />
              Blend’e katıl
            </a>
          </div>
        </section>

        <p className="mt-10 text-center text-sm text-sis">
          Canlı:{" "}
          <a
            href="https://burakcankorpinar.dev/beril"
            className="text-lila underline decoration-cizgi underline-offset-4 hover:text-kayisi hover:decoration-kayisi"
            target="_blank"
            rel="noreferrer"
          >
            burakcankorpinar.dev/beril
          </a>
        </p>
      </main>
    </div>
  );
};

export default BerilPage;
