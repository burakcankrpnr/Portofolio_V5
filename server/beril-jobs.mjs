import "./polyfills.mjs";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, readdir, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_PAGES_PER_REQUEST, translateBatch } from "./beril-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.BERIL_DATA_DIR || join(__dirname, "..", ".beril-data");

let pdfjsPromise = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjsPromise;
}

const jobs = new Map();
let pumping = false;

function publicJob(job) {
  return {
    id: job.id,
    name: job.name,
    status: job.status,
    percent: job.percent,
    pageCount: job.pageCount,
    progress: job.progress || null,
    error: job.error || null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function jobMetaPath(id) {
  return join(DATA_DIR, `${id}.json`);
}

function jobPdfPath(id) {
  return join(DATA_DIR, `${id}.pdf`);
}

async function persist(job) {
  job.updatedAt = Date.now();
  const { pdfBuffer, sourceBuffer, ...meta } = job;
  await writeFile(jobMetaPath(job.id), JSON.stringify(meta), "utf8");
  if (pdfBuffer) {
    await writeFile(jobPdfPath(job.id), pdfBuffer);
  }
  jobs.set(job.id, job);
}

export async function loadJobsFromDisk() {
  await ensureDataDir();
  const files = await readdir(DATA_DIR);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await readFile(join(DATA_DIR, file), "utf8");
      const meta = JSON.parse(raw);
      if (meta.status === "extracting" || meta.status === "translating" || meta.status === "building") {
        // building'de kalmış iş yeniden kuyruğa girer; .translated.json varsa API tekrarlanmaz
        meta.status = "queued";
        meta.error = null;
      }
      jobs.set(meta.id, meta);
    } catch {
      /* skip corrupt */
    }
  }
}

export function listJobs() {
  return [...jobs.values()]
    .map(publicJob)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function getJob(id) {
  const job = jobs.get(id);
  return job ? publicJob(job) : null;
}

export async function getJobPdf(id) {
  const job = jobs.get(id);
  if (!job || job.status !== "ready") return null;
  try {
    return await readFile(jobPdfPath(id));
  } catch {
    return null;
  }
}

export async function deleteJob(id) {
  const job = jobs.get(id);
  if (!job) return false;
  jobs.delete(id);
  try {
    await unlink(jobMetaPath(id));
  } catch {
    /* ignore */
  }
  try {
    await unlink(jobPdfPath(id));
  } catch {
    /* ignore */
  }
  return true;
}

export async function createJob({ name, buffer }) {
  if (!buffer?.length) {
    const err = new Error("PDF boş");
    err.status = 400;
    throw err;
  }
  if (buffer.length > 40 * 1024 * 1024) {
    const err = new Error("PDF en fazla 40MB olabilir");
    err.status = 400;
    throw err;
  }

  await ensureDataDir();
  const id = randomUUID();
  const job = {
    id,
    name: name || "dosya.pdf",
    status: "queued",
    percent: 0,
    pageCount: null,
    progress: null,
    error: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sourceBuffer: buffer,
  };
  await writeFile(join(DATA_DIR, `${id}.src.pdf`), buffer);
  await persist(job);
  pump();
  return publicJob(job);
}

async function extractPages(buffer) {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lineMap = new Map();
    for (const item of content.items) {
      if (!item.str) continue;
      const y = Math.round(item.transform?.[5] ?? 0);
      const prev = lineMap.get(y) || [];
      prev.push({ x: item.transform?.[4] ?? 0, str: item.str });
      lineMap.set(y, prev);
    }
    const lines = [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) =>
        parts
          .sort((a, b) => a.x - b.x)
          .map((p) => p.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);
    pages.push(lines.join("\n"));
  }
  return pages;
}

function translatedPath(id) {
  return join(DATA_DIR, `${id}.translated.json`);
}

async function buildPdfBuffer(title, pages) {
  const pdfMakeModule = await import("pdfmake/build/pdfmake.js");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts.js");
  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const fonts = pdfFontsModule.default || pdfFontsModule;
  const vfs = fonts.pdfMake?.vfs || fonts.vfs || fonts;
  if (!vfs || typeof vfs !== "object") throw new Error("PDF font vfs yüklenemedi");
  if (typeof pdfMake.addVirtualFileSystem === "function") pdfMake.addVirtualFileSystem(vfs);
  else pdfMake.vfs = vfs;

  const content = [
    { text: title || "Çeviri", style: "title", margin: [0, 0, 0, 16] },
    { text: "İngilizce → Türkçe çeviri", style: "meta", margin: [0, 0, 0, 24] },
  ];
  pages.forEach((pageText, index) => {
    if (index > 0) content.push({ text: "", pageBreak: "before" });
    content.push({ text: `Sayfa ${index + 1}`, style: "pageLabel", margin: [0, 0, 0, 10] });
    content.push({ text: pageText || "—", style: "body" });
  });

  const definition = {
    pageSize: "A4",
    pageMargins: [48, 56, 48, 56],
    content,
    defaultStyle: { font: "Roboto", fontSize: 11, lineHeight: 1.35, color: "#1a1a1a" },
    styles: {
      title: { fontSize: 18, bold: true },
      meta: { fontSize: 10, color: "#666666" },
      pageLabel: { fontSize: 9, bold: true, color: "#888888" },
      body: { fontSize: 11 },
    },
  };

  // pdfmake 0.3+: getBuffer() Promise döner — callback ile beklemek %92'de takılıyor
  const pdf = pdfMake.createPdf(definition);
  const buffer = await pdf.getBuffer();
  if (!buffer) throw new Error("PDF buffer boş");
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

async function processJob(job) {
  try {
    let source = job.sourceBuffer;
    if (!source) {
      source = await readFile(join(DATA_DIR, `${job.id}.src.pdf`));
    }

    job.status = "extracting";
    job.percent = 5;
    await persist(job);

    const pages = await extractPages(source);
    job.pageCount = pages.length;
    job.status = "translating";
    job.percent = 10;
    job.progress = `0/${pages.length}`;
    await persist(job);

    const title = job.name.replace(/\.pdf$/i, "");
    let translated = [];

    // Daha önce çevrilmiş sayfalar varsa (PDF aşamasında kalmış iş) tekrar API çağırma
    try {
      const saved = JSON.parse(await readFile(translatedPath(job.id), "utf8"));
      if (Array.isArray(saved.pages) && saved.pages.length === pages.length) {
        translated = saved.pages;
      }
    } catch {
      /* yok */
    }

    if (translated.length !== pages.length) {
      translated = [];
      for (let i = 0; i < pages.length; i += MAX_PAGES_PER_REQUEST) {
        const batch = pages.slice(i, i + MAX_PAGES_PER_REQUEST);
        const result = await translateBatch(batch, title);
        translated.push(...result.pages);
        const done = Math.min(i + batch.length, pages.length);
        job.progress = `${done}/${pages.length}`;
        job.percent = Math.round(10 + (done / pages.length) * 80);
        await persist(job);
      }
      await writeFile(
        translatedPath(job.id),
        JSON.stringify({ title, pages: translated }),
        "utf8"
      );
    }

    job.status = "building";
    job.percent = 92;
    job.progress = `${pages.length}/${pages.length}`;
    await persist(job);

    const pdfBuffer = await buildPdfBuffer(`${title} (TR)`, translated);
    job.pdfBuffer = pdfBuffer;
    job.status = "ready";
    job.percent = 100;
    job.progress = `${pages.length}/${pages.length}`;
    job.error = null;
    job.sourceBuffer = undefined;
    await persist(job);

    try {
      await unlink(join(DATA_DIR, `${job.id}.src.pdf`));
    } catch {
      /* ignore */
    }
    try {
      await unlink(translatedPath(job.id));
    } catch {
      /* ignore */
    }
  } catch (error) {
    console.error("[beril] job error", job.id, error);
    job.status = "error";
    job.error = error.message || "İşlem başarısız";
    // building'de kaldıysa yüzdeyi koru ki kullanıcı görsün
    if (job.percent < 92) job.percent = 0;
    job.sourceBuffer = undefined;
    await persist(job);
  }
}

export function pump() {
  if (pumping) return;
  pumping = true;
  (async () => {
    try {
      while (true) {
        const next = [...jobs.values()].find((j) => j.status === "queued");
        if (!next) break;
        await processJob(next);
      }
    } finally {
      pumping = false;
      if ([...jobs.values()].some((j) => j.status === "queued")) pump();
    }
  })();
}
