import AccountTable from "../components/tables/AccountTable.jsx";
import { Note, PageHeader } from "../components/ui.jsx";
import { useFollowScope } from "../data/StoreContext.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default function HistoryPage() {
  const { current, previous, changes, snapshots, selectSnapshot } = useFollowScope();

  return (
    <>
      <PageHeader
        title="Değişim Geçmişi"
        description="İki dışa aktarım arasındaki fark. Kesin unfollow anını kanıtlamaz; yalnızca anlık görüntü farkıdır."
      />

      {!current ? (
        <Note>Karşılaştırma için en az bir analiz yükle. İkinci arşiv geldiğinde farklar burada görünür.</Note>
      ) : null}

      {current && !previous ? (
        <Note>
          İlk analiz kaydı mevcut ({formatDate(current.createdAt)}). Önceki snapshot yok; geçmiş
          karşılaştırması yapılamıyor. Yeni bir ZIP yüklediğinde farklar hesaplanır.
        </Note>
      ) : null}

      {snapshots.length > 1 ? (
        <div className="fs-card fs-card-pad" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label className="fs-field">
            <span>Aktif analiz</span>
            <select
              className="fs-select"
              value={current?.id || ""}
              onChange={(event) => selectSnapshot(event.target.value)}
              aria-label="Aktif analiz"
            >
              {snapshots.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatDate(item.createdAt)} · {item.sourceFileName || item.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          {previous ? (
            <p style={{ color: "var(--fs-muted)", fontSize: 13 }}>
              Önceki: {formatDate(previous.createdAt)}
            </p>
          ) : null}
        </div>
      ) : null}

      {changes.ok ? (
        <>
          <div className="fs-kpis">
            <article className="fs-card fs-card-pad fs-kpi">
              <small>Yeni takipçiler</small>
              <strong>{changes.newFollowers.length}</strong>
            </article>
            <article className="fs-card fs-card-pad fs-kpi">
              <small>Takipten çıkanlar</small>
              <strong>{changes.lostFollowers.length}</strong>
            </article>
            <article className="fs-card fs-card-pad fs-kpi">
              <small>Yeni takip edilen</small>
              <strong>{changes.newlyFollowed.length}</strong>
            </article>
            <article className="fs-card fs-card-pad fs-kpi">
              <small>Takipten çıkarılan</small>
              <strong>{changes.unfollowedByUser.length}</strong>
            </article>
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>Takipten çıkanlar</h2>
          <AccountTable
            usernames={changes.lostFollowers}
            exportName="takipci-kaybi.csv"
            emptyTitle="Kayıp yok"
            emptyBody="İki arşiv arasında takipçi kaybı görünmüyor."
          />

          <h2 style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>Yeni takipçiler</h2>
          <AccountTable
            usernames={changes.newFollowers}
            exportName="yeni-takipciler.csv"
            emptyTitle="Yeni takipçi yok"
            emptyBody="İki arşiv arasında yeni takipçi görünmüyor."
          />
        </>
      ) : null}
    </>
  );
}
