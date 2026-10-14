import { useState } from "react";
import { useStore } from "../data/StoreContext.jsx";
import { formatDateTime } from "../domain/money.js";
import { canImportCosts, canWrite } from "../domain/permissions.js";
import {
  applyImport,
  errorsToCsv,
  fieldsForProfile,
  readSpreadsheet,
  readTable,
  suggestMapping,
  validateFileMeta,
  validateRows,
} from "../services/excelImport.js";
import { Button, EmptyState, PageHeader, useToast } from "../ui/ui.jsx";

const STEPS = ["Dosya", "Eşleştirme", "Önizleme", "Mod", "Sonuç"];

export default function ImportPage() {
  const { state, commitImport } = useStore();
  const toast = useToast();
  const writable = canWrite(state.settings.demoRole);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState("catalog");
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [headerRow, setHeaderRow] = useState(1);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState("only-new");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sheet = sheets[sheetIndex];
  const table = sheet ? readTable(sheet.matrix, headerRow) : { headers: [], data: [] };
  const fields = fieldsForProfile(profile);
  const costMapped = fields.some((field) => field.restricted && mapping[field.id] !== "" && mapping[field.id] != null);

  const onFile = async (file) => {
    setError("");
    setResult(null);
    const message = validateFileMeta(file);
    if (message) {
      setError(message);
      return;
    }
    setBusy(true);
    try {
      const nextSheets = await readSpreadsheet(file);
      if (!nextSheets.length) {
        setError("Dosyada sayfa bulunamadı");
        return;
      }
      const first = readTable(nextSheets[0].matrix, 1);
      setSheets(nextSheets);
      setSheetIndex(0);
      setHeaderRow(1);
      setFileName(file.name);
      setMapping(suggestMapping(first.headers, profile));
      setConfirmed(false);
      setStep(1);
    } catch {
      setError("Dosya okunamadı. Formüller çalıştırılmaz; dosya bozuk olabilir.");
    } finally {
      setBusy(false);
    }
  };

  const buildPreview = () => {
    const next = validateRows({
      data: table.data,
      mapping,
      profile,
      products: state.products,
      role: state.settings.demoRole,
    });
    setPreview(next);
    setStep(2);
  };

  const run = () => {
    if (!preview || preview.blocked) return;
    if (costMapped && !confirmed) {
      setError("Maliyet sütunları için onay kutusunu işaretleyin");
      return;
    }
    if (costMapped && !canImportCosts(state.settings.demoRole)) {
      setError("Maliyet aktarımı bu demo rolünde kapalı");
      return;
    }
    const applied = applyImport({
      rows: preview.rows,
      state,
      mode,
      profile,
      role: state.settings.demoRole,
    });
    if (!applied.ok) {
      setError(applied.error);
      return;
    }
    const saved = commitImport(applied, {
      fileName,
      profile,
      mode,
      failed: preview.errors.length,
      errors: preview.errors,
    });
    if (!saved.ok) {
      toast(saved.error, "danger");
      return;
    }
    setResult({ ...applied, failed: preview.errors.length, errors: preview.errors });
    setStep(4);
    toast("Aktarım tamamlandı", "success");
  };

  const downloadErrors = () => {
    const csv = errorsToCsv(result?.errors || preview?.errors || []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aktarim-hatalari.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Excel aktarımı" description="XLSX ve CSV kabul edilir. Makro çalıştırılmaz, formül hesaplanmaz." />
      {!writable ? <p className="tos-note">Bu demo rolü aktarım yapamaz.</p> : null}
      <div className="tos-steps">
        {STEPS.map((label, index) => <span key={label} className={`tos-step ${index === step ? "is-on" : ""}`}>{index + 1}. {label}</span>)}
      </div>
      {error ? <p className="tos-error" role="alert">{error}</p> : null}
      {busy ? <p className="tos-note">Dosya okunuyor…</p> : null}

      {step === 0 ? (
        <section className="tos-card tos-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label className="tos-field">
            <span>Aktarım profili</span>
            <select className="tos-select" aria-label="Aktarım profili" value={profile} onChange={(event) => setProfile(event.target.value)}>
              <option value="catalog">Ürün kataloğu</option>
              <option value="cost">Maliyet tablosu</option>
            </select>
          </label>
          <p className="tos-hint">Katalog ve maliyet dosyaları farklı şemalar kullanabilir. En fazla 5 MB.</p>
          <input
            className="tos-input"
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            aria-label="Excel veya CSV dosyası"
            disabled={!writable || busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onFile(file);
            }}
          />
        </section>
      ) : null}

      {step === 1 ? (
        <section className="tos-card tos-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p>{fileName}</p>
          <label className="tos-field">
            <span>Çalışma sayfası</span>
            <select className="tos-select" aria-label="Sayfa" value={sheetIndex} onChange={(event) => {
              const index = Number(event.target.value);
              setSheetIndex(index);
              const next = readTable(sheets[index].matrix, headerRow);
              setMapping(suggestMapping(next.headers, profile));
            }}>
              {sheets.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}
            </select>
          </label>
          <label className="tos-field">
            <span>Başlık satırı</span>
            <input className="tos-input" type="number" min="1" aria-label="Başlık satırı" value={headerRow} onChange={(event) => {
              const row = Number(event.target.value) || 1;
              setHeaderRow(row);
              const next = readTable(sheet.matrix, row);
              setMapping(suggestMapping(next.headers, profile));
            }} />
          </label>
          {fields.map((field) => (
            <label key={field.id} className="tos-field">
              <span>{field.label}{field.required ? " *" : ""}{field.restricted ? " (maliyet)" : ""}</span>
              <select
                className="tos-select"
                aria-label={field.label}
                value={mapping[field.id] ?? ""}
                onChange={(event) => setMapping({ ...mapping, [field.id]: event.target.value === "" ? "" : Number(event.target.value) })}
              >
                <option value="">Eşleştirme</option>
                {table.headers.map((header, index) => <option key={`${header}-${index}`} value={index}>{header}</option>)}
              </select>
            </label>
          ))}
          <p className="tos-hint">Otomatik öneri dolduruldu. Aktarmadan önce eşleştirmeyi siz onaylıyorsunuz.</p>
          <div className="tos-page-actions">
            <Button onClick={() => setStep(0)}>Geri</Button>
            <Button variant="primary" onClick={buildPreview}>Önizle</Button>
          </div>
        </section>
      ) : null}

      {step === 2 && preview ? (
        <section className="tos-card tos-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p>{preview.rows.length} satır hazır, {preview.errors.length} hata, {preview.warnings.length} uyarı.</p>
          {preview.blocked ? <p className="tos-error">{preview.errors.map((item) => item.message).join(" ")}</p> : null}
          <div className="tos-table-wrap">
            <table className="tos-table">
              <thead><tr><th>Satır</th><th>Kod</th><th>Ad / tür</th></tr></thead>
              <tbody>
                {preview.rows.slice(0, 8).map((row) => (
                  <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.code}</td><td>{row.name || "—"} {row.type ? `· ${row.type}` : ""}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.errors.length ? (
            <div>
              {preview.errors.slice(0, 12).map((item, index) => (
                <p key={`${item.row}-${item.field}-${index}`} className="tos-error">Satır {item.row}: {item.message}</p>
              ))}
              <Button onClick={downloadErrors}>Hata listesini indir</Button>
            </div>
          ) : null}
          <div className="tos-page-actions">
            <Button onClick={() => setStep(1)}>Geri</Button>
            <Button variant="primary" disabled={preview.blocked} onClick={() => setStep(3)}>Devam</Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="tos-card tos-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label className="tos-field">
            <span>Aktarım modu</span>
            <select className="tos-select" aria-label="Aktarım modu" value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="only-new">Yalnızca yeni ürünleri ekle</option>
              <option value="update">Eşleşen ürünleri güncelle</option>
              <option value="skip">Yinelenen kayıtları atla</option>
            </select>
          </label>
          <p className="tos-hint">Güncelle modu eşleşmeyen kodları atlar. Diğer modlar var olan kodu değiştirmez.</p>
          {costMapped ? (
            <label className="tos-check">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>Maliyet sütunlarını içe aktarmayı onaylıyorum. Bu demo rolü: {canImportCosts(state.settings.demoRole) ? "yetkili" : "yetkisiz"}.</span>
            </label>
          ) : null}
          <div className="tos-page-actions">
            <Button onClick={() => setStep(2)}>Geri</Button>
            <Button variant="primary" disabled={!writable} onClick={run}>Aktar</Button>
          </div>
        </section>
      ) : null}

      {step === 4 && result ? (
        <section className="tos-card tos-card-pad">
          <h2>Sonuç</h2>
          <p style={{ marginTop: 8 }}>Eklenen: {result.added}</p>
          <p>Güncellenen: {result.updated}</p>
          <p>Atlanan: {result.skipped}</p>
          <p>Hatalı: {result.failed}</p>
          {result.errors?.length ? <Button onClick={downloadErrors}>Hata raporunu indir</Button> : null}
          <div className="tos-page-actions" style={{ marginTop: 12 }}>
            <Button variant="primary" onClick={() => { setStep(0); setSheets([]); setPreview(null); setResult(null); }}>Yeni aktarım</Button>
          </div>
        </section>
      ) : null}

      <section className="tos-card tos-card-pad">
        <h2>Aktarım geçmişi</h2>
        {state.importJobs.length === 0 ? <EmptyState title="Geçmiş yok" body="Tamamlanan aktarımlar burada listelenir." /> : (
          <div style={{ marginTop: 8 }}>
            {state.importJobs.map((job) => (
              <p key={job.id}>{job.fileName} · {job.added} eklendi, {job.updated} güncellendi, {job.skipped} atlandı, {job.failed} hatalı <span className="tos-hint">{formatDateTime(job.createdAt)}</span></p>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
