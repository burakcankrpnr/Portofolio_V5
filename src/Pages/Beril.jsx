import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import {
  checkBerilHealth,
  createServerJob,
  deleteServerJob,
  downloadServerJob,
  listServerJobs,
} from "../beril/jobsApi";
import HeartEdges from "../beril/HeartEdges";

const STATUS = {
  queued: "Sırada (arka plan)",
  extracting: "Metin çıkarılıyor",
  translating: "Çevriliyor",
  building: "PDF hazırlanıyor",
  ready: "Hazır",
  error: "Hata",
};

const SPOTIFY_BLEND =
  "https://open.spotify.com/playlist/37i9dQZF1EJEl0mbbnfDL7?si=umHw7UnWTdSkHZwIk7odIQ&utm_source=copy-link&pi=QEAzH5TGRfOJq";

const ACTIVE = new Set(["queued", "extracting", "translating", "building"]);

const SpotifyIcon = ({ className = "h-8 w-8" }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

function formatDate(ts) {
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(ts)
    );
  } catch {
    return "";
  }
}

const BerilPage = () => {
  const inputId = useId();
  const inputRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [health, setHealth] = useState({ loading: true, ok: false, model: "", error: "" });
  const [banner, setBanner] = useState("");

  const refreshJobs = useCallback(async () => {
    try {
      const list = await listServerJobs();
      setJobs(list);
    } catch {
      /* keep previous */
    }
  }, []);

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
            : "OPENAI_API_KEY deployment’ta yok (Jenkins Credentials / .env)",
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setHealth({ loading: false, ok: false, model: "", error: error.message || "Sunucu yok" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  // Aktif iş varken poll — sekme kapalı olsa bile sunucu devam eder; açınca yakalanır
  useEffect(() => {
    const hasActive = jobs.some((j) => ACTIVE.has(j.status));
    if (!hasActive) return undefined;
    const timer = setInterval(() => {
      refreshJobs();
    }, 2000);
    return () => clearInterval(timer);
  }, [jobs, refreshJobs]);

  const addFiles = useCallback(
    async (fileList) => {
      const pdfs = [...fileList].filter(
        (file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name)
      );
      if (!pdfs.length || !health.ok) return;

      setUploading(true);
      setBanner("");
      try {
        for (const file of pdfs) {
          await createServerJob(file);
        }
        setBanner("Yüklendi — çeviri sunucuda arka planda sürüyor. Sayfayı kapatabilirsin.");
        await refreshJobs();
      } catch (error) {
        setBanner(error.message || "Yükleme başarısız");
      } finally {
        setUploading(false);
      }
    },
    [health.ok, refreshJobs]
  );

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    addFiles(event.dataTransfer.files);
  };

  const activeJobs = jobs.filter((j) => ACTIVE.has(j.status) || j.status === "error");
  const readyJobs = jobs.filter((j) => j.status === "ready");

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
          PDF’i yükle; çeviri <strong className="font-medium text-kar">sunucuda arka planda</strong>{" "}
          devam eder. Sekmeyi kapatsan da iş sürer — sonra buradan indirirsin.
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

        {banner && (
          <p className="mt-4 rounded-xl border border-kayisi/30 bg-kayisi/10 px-4 py-3 text-sm text-kayisi">
            {banner}
          </p>
        )}

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
            Yükledikten sonra sayfayı kapatabilirsin — çeviri arka planda biter
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label
              htmlFor={inputId}
              className={`cursor-pointer rounded-lg bg-kayisi px-5 py-3 text-center text-sm font-medium text-gece transition hover:brightness-110 sm:py-2.5 ${
                !health.ok || uploading ? "pointer-events-none opacity-40" : ""
              }`}
            >
              {uploading ? "Yükleniyor…" : "Dosya seç"}
            </label>
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              disabled={!health.ok || uploading}
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files || []);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {activeJobs.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm text-sis">Devam eden / bekleyen</h2>
            <ul className="space-y-3">
              {activeJobs.map((job) => {
                const pct = Math.round(job.percent || 0);
                return (
                  <li key={job.id} className="rounded-xl border border-cizgi bg-murekkep px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-all font-medium text-kar sm:truncate">{job.name}</p>
                        <p className="mt-1 break-words text-sm text-sis">
                          {STATUS[job.status] || job.status}
                          {ACTIVE.has(job.status) ? ` · %${pct}` : ""}
                          {job.progress ? ` (${job.progress})` : ""}
                          {job.pageCount != null ? ` · ${job.pageCount} sayfa` : ""}
                          {job.error ? ` · ${job.error}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteServerJob(job.id);
                          await refreshJobs();
                        }}
                        className="w-full rounded-lg border border-cizgi px-4 py-2.5 text-sm text-sis hover:text-kar sm:w-auto sm:py-2"
                      >
                        Kaldır
                      </button>
                    </div>
                    {ACTIVE.has(job.status) && (
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
            <h2 className="text-sm text-sis">Hazır çeviriler</h2>
            <button
              type="button"
              onClick={refreshJobs}
              className="text-sm text-sis underline-offset-2 hover:text-kar hover:underline"
            >
              Yenile
            </button>
          </div>

          {readyJobs.length === 0 ? (
            <p className="rounded-xl border border-cizgi bg-murekkep/40 px-4 py-6 text-sm text-sis">
              Henüz hazır PDF yok. Bitince burada listelenir; tarayıcıyı kapatsan da kaybolmaz.
            </p>
          ) : (
            <ul className="space-y-3">
              {readyJobs.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-col gap-3 rounded-xl border border-cizgi bg-murekkep px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-all font-medium text-kar sm:truncate">{job.name}</p>
                    <p className="mt-1 text-sm text-sis">
                      {formatDate(job.updatedAt || job.createdAt)}
                      {job.pageCount != null ? ` · ${job.pageCount} sayfa` : ""}
                      {" · %100"}
                    </p>
                  </div>
                  <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => downloadServerJob(job.id, job.name)}
                      className="flex-1 rounded-lg bg-kayisi px-4 py-2.5 text-sm font-medium text-gece sm:flex-none sm:py-2"
                    >
                      PDF’e tıkla
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteServerJob(job.id);
                        await refreshJobs();
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
          <div className="relative flex flex-col items-stretch gap-5 sm:gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1DB954] text-gece sm:h-14 sm:w-14">
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
                  Blend’e katıldın
                </p>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-sis sm:text-[15px]">
                  Ortak listeniz hazır. Buradan açabilirsin.
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
              Blend’i aç
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BerilPage;
