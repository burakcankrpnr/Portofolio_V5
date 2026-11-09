/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import { FileArchive } from "lucide-react";
import { Button } from "../ui.jsx";
import { validateArchiveFile } from "../../lib/instagram/parseArchive.js";

export default function UploadDropzone({ busy, onFile, onHowTo }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleFile = (file) => {
    const message = validateArchiveFile(file);
    if (message) {
      setLocalError(message);
      return;
    }
    setLocalError("");
    onFile?.(file);
  };

  return (
    <div
      className={`fs-card fs-upload ${dragOver ? "is-drag" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          margin: "0 auto 14px",
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "var(--fs-accent-soft)",
          color: "var(--fs-accent)",
        }}
      >
        <FileArchive size={22} aria-hidden="true" />
      </div>
      <h2>Instagram ZIP arşivini sürükleyip bırak</h2>
      <p>
        JSON formatındaki resmi dışa aktarımı seç. Dosya tarayıcıda açılır; sunucuya yüklenmez.
        Şifre istenmez.
      </p>
      {localError ? <p className="fs-error" role="alert">{localError}</p> : null}
      <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <Button variant="primary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Okunuyor…" : "ZIP seç"}
        </Button>
        <Button variant="secondary" onClick={onHowTo}>
          Nasıl indirilir?
        </Button>
      </div>
      <input
        ref={inputRef}
        className="fs-hidden-input"
        type="file"
        accept=".zip,application/zip"
        aria-label="Instagram ZIP arşivi"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
