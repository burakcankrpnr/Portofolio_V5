import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

const STATUS = {
  queued: "Bekliyor",
  extracting: "Metin çıkarılıyor",
  translating: "Çevriliyor",
  ready: "Hazır",
  error: "Hata",
};

function makeJob(file) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    name: file.name,
    pageCount: null,
    status: "queued",
    error: null,
    blob: null,
  };
}

const BerilPage = () => {
  const inputId = useId();
  const inputRef = useRef(null);
  const jobsRef = useRef([]);
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
          error: data.ok ? "" : "OPENAI_API_KEY eksik",
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

  const addFiles = useCallback((fileList) => {
    const pdfs = [...fileList].filter(
      (file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name)
    );
    if (!pdfs.length) return;
    setJobs((prev) => [...prev, ...pdfs.map(makeJob)]);
  }, []);

  const processQueue = useCallback(async () => {
    if (busy) return;
    setBusy(true);

    const pending = jobsRef.current.filter(
      (job) => job.status === "queued" || job.status === "error"
    );

    for (const job of pending) {
      try {
        updateJob(job.id, { status: "extracting", error: null, blob: null });
        const extracted = await extractPdfText(job.file);
        updateJob(job.id, {
          status: "translating",
          pageCount: extracted.pageCount,
          progress: `0/${extracted.pageCount}`,
        });

        const translated = await translatePages({
          title: extracted.title,
          pages: extracted.pages,
          onProgress: (done, total) => {
            updateJob(job.id, { progress: `${done}/${total}` });
          },
        });

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

        updateJob(job.id, { status: "ready", blob });
      } catch (error) {
        updateJob(job.id, {
          status: "error",
          error: error.message || "İşlem başarısız",
        });
      }
    }

    setBusy(false);
  }, [busy, refreshHistory, updateJob]);

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
    <div className="min-h-screen bg-gece text-kar">
      <header className="border-b border-cizgi">
        <div className="shell flex h-16 items-center justify-between md:h-[72px]">
          <div>
            <p className="text-sm text-sis">Beril</p>
            <h1
              className="display text-xl font-semibold leading-none"
              style={{ fontVariationSettings: '"wdth" 85' }}
            >
              PDF çeviri
            </h1>
          </div>
          <Link to="/" className="text-sm text-lila transition hover:text-kar">
            Portfolyoya dön
          </Link>
        </div>
      </header>

      <main className="shell py-10 md:py-14">
        <p className="max-w-2xl text-[17px] leading-relaxed text-sis">
          İngilizce ders notu PDF’lerini Türkçeye çevirir. Tek veya toplu yükleyin; biten dosyaları
          PDF olarak indirin. Eski çeviriler bu tarayıcıda saklanır.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 ${
              health.loading
                ? "border-cizgi text-sis"
                : health.ok
                  ? "border-kayisi/40 text-kayisi"
                  : "border-red-400/40 text-red-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                health.loading ? "bg-sis" : health.ok ? "bg-kayisi" : "bg-red-400"
              }`}
            />
            {health.loading
              ? "API kontrol ediliyor…"
              : health.ok
                ? `API bağlı · ${health.model}`
                : health.error}
          </span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-10 rounded-2xl border border-dashed bg-murekkep/60 px-6 py-14 text-center transition ${
            dragOver ? "border-kayisi bg-murekkep" : "border-cizgi"
          }`}
        >
          <p className="display text-2xl font-semibold" style={{ fontVariationSettings: '"wdth" 90' }}>
            PDF bırakın
          </p>
          <p className="mt-2 text-sis">veya dosya seçin — tekli ve toplu desteklenir</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <label
              htmlFor={inputId}
              className="cursor-pointer rounded-lg bg-kayisi px-5 py-2.5 text-sm font-medium text-gece transition hover:brightness-110"
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
              className="rounded-lg border border-cizgi px-5 py-2.5 text-sm text-kar transition enabled:hover:border-lila enabled:hover:text-lila disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Çevriliyor…" : "Çeviriyi başlat"}
            </button>
          </div>
        </div>

        {jobs.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm text-sis">Kuyruk</h2>
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-col gap-3 rounded-xl border border-cizgi bg-murekkep px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-kar">{job.name}</p>
                    <p className="mt-1 text-sm text-sis">
                      {STATUS[job.status]}
                      {job.status === "translating" && job.progress ? ` ${job.progress}` : ""}
                      {job.pageCount != null ? ` · ${job.pageCount} sayfa` : ""}
                      {job.error ? ` · ${job.error}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {job.status === "ready" && job.blob && (
                      <button
                        type="button"
                        onClick={() =>
                          downloadBlob(job.blob, job.name.replace(/\.pdf$/i, "") + "-TR.pdf")
                        }
                        className="rounded-lg bg-kayisi px-4 py-2 text-sm font-medium text-gece"
                      >
                        İndir
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeJob(job)}
                      className="rounded-lg border border-cizgi px-4 py-2 text-sm text-sis hover:text-kar"
                    >
                      Kaldır
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12">
          <div className="mb-3 flex items-center justify-between gap-3">
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
                    <p className="truncate font-medium text-kar">{item.name}</p>
                    <p className="mt-1 text-sm text-sis">
                      {formatHistoryDate(item.createdAt)}
                      {item.pageCount != null ? ` · ${item.pageCount} sayfa` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(item.blob, item.name.replace(/\.pdf$/i, "") + "-TR.pdf")
                      }
                      className="rounded-lg bg-kayisi px-4 py-2 text-sm font-medium text-gece"
                    >
                      İndir
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await removeHistoryItem(item.id);
                        await refreshHistory();
                      }}
                      className="rounded-lg border border-cizgi px-4 py-2 text-sm text-sis hover:text-kar"
                    >
                      Sil
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default BerilPage;
