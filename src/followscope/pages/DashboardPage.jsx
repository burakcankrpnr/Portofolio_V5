import { Link } from "react-router-dom";
import UploadDropzone from "../components/upload/UploadDropzone.jsx";
import { Button, Note, PageHeader } from "../components/ui.jsx";
import { useFollowScope } from "../data/StoreContext.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatPercent(rate) {
  return `${Math.round((rate || 0) * 1000) / 10}%`;
}

export default function DashboardPage() {
  const { analysis, current, busy, error, warnings, importArchive, setError } = useFollowScope();

  const kpis = [
    { label: "Takipçi", value: analysis ? analysis.followersCount : "—" },
    { label: "Takip edilen", value: analysis ? analysis.followingCount : "—" },
    { label: "Geri takip etmeyen", value: analysis ? analysis.notFollowingBack.length : "—" },
    { label: "Karşılıklı takip", value: analysis ? analysis.mutuals.length : "—" },
  ];

  return (
    <>
      <PageHeader
        title="Genel Bakış"
        description="Instagram resmi veri arşivini yükleyerek takip listelerini karşılaştır. Analiz yalnızca cihazında çalışır."
        actions={
          current ? (
            <Link className="fs-btn fs-btn-primary" to="/followscope/geri-takip-etmeyenler">
              Geri takip etmeyenler
            </Link>
          ) : null
        }
      />

      <section className="fs-kpis" aria-label="Özet kartları">
        {kpis.map((item) => (
          <article key={item.label} className="fs-card fs-card-pad fs-kpi">
            <small>{item.label}</small>
            <strong>{item.value}</strong>
            <span>{current ? formatDate(current.createdAt) : "Arşiv bekleniyor"}</span>
          </article>
        ))}
      </section>

      {analysis ? (
        <Note>
          Takip edilen ama geri takip etmeyen oranı: <strong>{formatPercent(analysis.notFollowingBackRate)}</strong>
          {current?.sourceFileName ? ` · Kaynak: ${current.sourceFileName}` : ""}
        </Note>
      ) : null}

      {error ? (
        <div className="fs-alert" role="alert">
          <div>
            <strong>Arşiv okunamadı</strong>
            <p>{error}</p>
          </div>
          <Button variant="secondary" onClick={() => setError("")}>
            Kapat
          </Button>
        </div>
      ) : null}

      {warnings.length ? (
        <Note>
          Uyarılar: {warnings.slice(0, 4).join(" · ")}
          {warnings.length > 4 ? ` · +${warnings.length - 4}` : ""}
        </Note>
      ) : null}

      <section className="fs-grid-2">
        <UploadDropzone
          busy={busy}
          onFile={importArchive}
          onHowTo={() => document.getElementById("fs-howto")?.scrollIntoView({ behavior: "smooth" })}
        />
        <div className="fs-card fs-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Güvenlik</h2>
          <p style={{ color: "var(--fs-muted)", fontSize: 13, lineHeight: 1.55 }}>
            FollowScope Instagram şifresi istemez, hesabına giriş yapmaz ve özel API uç noktalarını
            çağırmaz. ZIP tarayıcıda açılır.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="fs-btn fs-btn-secondary" to="/followscope/ayarlar">
              Ayarlar
            </Link>
            <Link className="fs-btn fs-btn-secondary" to="/followscope/gecmis">
              Değişim geçmişi
            </Link>
          </div>
        </div>
      </section>

      <section id="fs-howto" className="fs-card fs-card-pad">
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Instagram arşivi nasıl indirilir?</h2>
        <ol style={{ marginTop: 12, paddingLeft: 18, color: "var(--fs-muted)", fontSize: 13, lineHeight: 1.7 }}>
          <li>Instagram → Ayarlar → Hesabın merkezi → Bilgilerini indir / dışa aktar.</li>
          <li>Mümkünse JSON formatını seç; “Takipçiler ve takip edilenler” kategorisini dahil et.</li>
          <li>Hazır ZIP’i buraya sürükle. Beklenen dosyalar: `followers_1.json`, `following.json`.</li>
        </ol>
      </section>
    </>
  );
}
