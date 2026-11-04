import "./promiseWithResolvers.js";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

let workerReady = null;

/** Yanlış MIME (.mjs) yüzünden worker import’u patlamasın diye blob URL kullan. */
function ensurePdfWorker() {
  if (workerReady) return workerReady;

  workerReady = (async () => {
    try {
      const res = await fetch(pdfWorkerUrl);
      if (!res.ok) throw new Error(`PDF worker alınamadı (${res.status})`);
      const code = await res.text();
      const blob = new Blob([code], { type: "text/javascript" });
      pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
    } catch {
      // Son çare: doğrudan asset URL (nginx MIME düzeltmesiyle çalışır)
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
  })();

  return workerReady;
}

/**
 * PDF dosyasından sayfa sayfa düz metin çıkarır.
 * @param {File|Blob|ArrayBuffer} file
 * @returns {Promise<{ title: string, pages: string[], pageCount: number }>}
 */
export async function extractPdfText(file) {
  await ensurePdfWorker();

  const data =
    file instanceof ArrayBuffer
      ? new Uint8Array(file)
      : new Uint8Array(await file.arrayBuffer());

  const doc = await pdfjs.getDocument({ data }).promise;
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

  const title =
    (file instanceof File && file.name ? file.name.replace(/\.pdf$/i, "") : "") ||
    "ceviri";

  return { title, pages, pageCount: doc.numPages };
}
