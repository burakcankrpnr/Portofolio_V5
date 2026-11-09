import { useState } from "react";
import { Button, Note, PageHeader } from "../components/ui.jsx";
import { useFollowScope } from "../data/StoreContext.jsx";
import { exportUsernamesCsv } from "../lib/export/exportCsv.js";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default function SettingsPage() {
  const { snapshots, current, analysis, clearHistory, removeSnapshot, refresh } = useFollowScope();
  const [message, setMessage] = useState("");

  return (
    <>
      <PageHeader
        title="Ayarlar"
        description="Veri yönetimi ve gizlilik. Kayıtlar yalnızca bu tarayıcının IndexedDB alanında tutulur."
      />

      <section className="fs-card fs-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Gizlilik</h2>
        <p style={{ color: "var(--fs-muted)", fontSize: 13, lineHeight: 1.55 }}>
          FollowScope Instagram şifresi veya oturum çerezi istemez. Arşiv sunucuya yüklenmez; ayrıştırma
          tarayıcıda yapılır. Telemetri yoktur.
        </p>
        <Note>Kullanıcı adları üçüncü taraf analitik sistemlerine gönderilmez.</Note>
      </section>

      <section className="fs-card fs-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Dışa aktarma</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            disabled={!analysis}
            onClick={() => exportUsernamesCsv(analysis.notFollowingBack, "geri-takip-etmeyenler.csv")}
          >
            Geri takip etmeyenler CSV
          </Button>
          <Button
            disabled={!analysis}
            onClick={() => exportUsernamesCsv(analysis.notFollowedBack, "takip-etmediklerim.csv")}
          >
            Takip etmediklerim CSV
          </Button>
          <Button
            disabled={!analysis}
            onClick={() => exportUsernamesCsv(analysis.mutuals, "karsilikli.csv")}
          >
            Karşılıklı CSV
          </Button>
        </div>
      </section>

      <section className="fs-card fs-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Yerel geçmiş ({snapshots.length})</h2>
        {!snapshots.length ? (
          <p style={{ color: "var(--fs-muted)", fontSize: 13 }}>Kayıtlı analiz yok.</p>
        ) : (
          <ul className="fs-history-list">
            {snapshots.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{formatDate(item.createdAt)}</strong>
                  <span>
                    {item.sourceFileName || "arşiv"} · {item.followers.length} takipçi · {item.following.length} takip
                    {item.id === current?.id ? " · aktif" : ""}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await removeSnapshot(item.id);
                    setMessage("Kayıt silindi");
                    await refresh();
                  }}
                >
                  Sil
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            variant="primary"
            disabled={!snapshots.length}
            onClick={async () => {
              const ok = window.confirm("Tüm yerel analiz geçmişi silinsin mi?");
              if (!ok) return;
              await clearHistory();
              setMessage("Geçmiş temizlendi");
            }}
          >
            Tüm geçmişi temizle
          </Button>
        </div>
        {message ? <p className="fs-ok">{message}</p> : null}
      </section>
    </>
  );
}
