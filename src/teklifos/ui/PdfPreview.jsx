/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfPreview({ data }) {
  const hostRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!data) return undefined;
    let cancelled = false;
    let loadingTask = null;
    setError("");
    (async () => {
      const bytes = data instanceof Uint8Array ? data.slice() : new Uint8Array(data);
      loadingTask = getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      const host = hostRef.current;
      if (cancelled || !host) return;
      host.replaceChildren();
      for (let index = 1; index <= pdf.numPages; index += 1) {
        const page = await pdf.getPage(index);
        const viewport = page.getViewport({ scale: 1.35 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const renderTask = page.render({ canvas, viewport });
        await renderTask.promise;
        if (cancelled || !hostRef.current) return;
        hostRef.current.appendChild(canvas);
      }
    })().catch((reason) => {
      if (!cancelled) setError(reason?.message || "PDF önizleme açılamadı");
    });
    return () => {
      cancelled = true;
      loadingTask?.destroy?.();
    };
  }, [data]);

  if (error) return <p className="tos-error" role="alert">{error}</p>;
  return <div ref={hostRef} className="tos-preview" aria-label="Teklif PDF önizleme" />;
}
