import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDate, formatMoney } from "../domain/money.js";
import { effectiveStatus, statusLabel } from "../domain/labels.js";
import { canWrite } from "../domain/permissions.js";
import { useStore } from "../data/StoreContext.jsx";
import { Button, PageHeader, StatusBadge } from "../ui/ui.jsx";
import { useDirty } from "../layout/Dirty.jsx";

const RANGES = [
  { id: "month", label: "Bu ay" },
  { id: "30", label: "Son 30 gün" },
  { id: "all", label: "Tümü" },
];

function inRange(quote, range) {
  const created = new Date(quote.createdAt).getTime();
  if (range === "all") return true;
  if (range === "30") return Date.now() - created <= 30 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const date = new Date(quote.createdAt);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function DashboardPage() {
  const { state } = useStore();
  const dirty = useDirty();
  const [range, setRange] = useState("month");
  const writable = canWrite(state.settings.demoRole);
  const currency = state.settings.currency;
  const scoped = useMemo(() => state.quotes.filter((quote) => inRange(quote, range)), [state.quotes, range]);
  const drafts = state.quotes.filter((quote) => effectiveStatus(quote) === "draft").length;
  const sent = scoped.filter((quote) => effectiveStatus(quote) === "sent").length;
  const approvedTotal = scoped
    .filter((quote) => quote.status === "approved")
    .reduce((sum, quote) => sum + (quote.totals?.totalKurus || 0), 0);
  const counts = {};
  for (const quote of state.quotes) {
    const status = effectiveStatus(quote);
    counts[status] = (counts[status] || 0) + 1;
  }
  const max = Math.max(1, ...Object.values(counts));
  const today = new Intl.DateTimeFormat("tr-TR", { dateStyle: "full" }).format(new Date());

  return (
    <>
      <PageHeader
        title="Genel Bakış"
        description={today}
        actions={(
          <>
            <Button variant="secondary" onClick={() => dirty.attempt("/buse/aktarim")}>Excel aktar</Button>
            <Button variant="primary" disabled={!writable} onClick={() => dirty.attempt("/buse/teklifler/yeni")}>Yeni teklif oluştur</Button>
          </>
        )}
      />
      <div className="tos-toolbar" role="group" aria-label="Tarih aralığı">
        {RANGES.map((item) => (
          <Button key={item.id} variant={range === item.id ? "primary" : "secondary"} onClick={() => setRange(item.id)}>
            {item.label}
          </Button>
        ))}
      </div>
      <section className="tos-kpis">
        <article className="tos-card tos-card-pad tos-kpi">
          <small>Oluşturulan teklif</small>
          <strong>{scoped.length}</strong>
          <span>Seçili aralık · demo kayıt</span>
        </article>
        <article className="tos-card tos-card-pad tos-kpi">
          <small>Taslak teklif</small>
          <strong>{drafts}</strong>
          <span>Şu anki durum</span>
        </article>
        <article className="tos-card tos-card-pad tos-kpi">
          <small>Gönderilen teklif</small>
          <strong>{sent}</strong>
          <span>Seçili aralık</span>
        </article>
        <article className="tos-card tos-card-pad tos-kpi">
          <small>Onaylanan tutar</small>
          <strong>{formatMoney(approvedTotal, currency)}</strong>
          <span>Yalnızca onaylı kayıtlar</span>
        </article>
      </section>
      <div className="tos-grid-2">
        <section className="tos-card">
          <div className="tos-card-pad"><h2>Son teklifler</h2></div>
          {state.quotes.length === 0 ? (
            <p className="tos-empty">Henüz teklif yok.</p>
          ) : (
            <div className="tos-table-wrap">
              <table className="tos-table">
                <thead>
                  <tr>
                    <th>Teklif no</th>
                    <th>Müşteri</th>
                    <th className="tos-hide-sm">Tarih</th>
                    <th>Toplam</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {state.quotes.slice(0, 5).map((quote) => {
                    const status = effectiveStatus(quote);
                    return (
                      <tr key={quote.id} className="clickable" onClick={() => dirty.attempt(`/buse/teklifler/${quote.id}`)}>
                        <td>{quote.number}</td>
                        <td>{quote.customerSnapshot?.name}</td>
                        <td className="tos-hide-sm">{formatDate(quote.createdAt)}</td>
                        <td>{formatMoney(quote.totals.totalKurus, quote.currency)}</td>
                        <td><StatusBadge status={status} label={statusLabel(status)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <section className="tos-card tos-card-pad">
            <h2>Durum dağılımı</h2>
            {state.quotes.length === 0 ? <p className="tos-hint">Gösterilecek teklif yok.</p> : (
              <div className="tos-bars" style={{ marginTop: 12 }}>
                {Object.entries(counts).map(([status, count]) => (
                  <div key={status}>
                    <div className="tos-toolbar" style={{ justifyContent: "space-between" }}>
                      <StatusBadge status={status} label={statusLabel(status)} />
                      <span>{count}</span>
                    </div>
                    <div className="tos-bar" aria-hidden="true"><span style={{ width: `${(count / max) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="tos-card tos-card-pad">
            <h2>Son aktiviteler</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {state.activities.slice(0, 5).map((item) => (
                <p key={item.id}><strong style={{ fontWeight: 500 }}>{item.message}</strong><br /><span className="tos-hint">{formatDate(item.at)}</span></p>
              ))}
              {state.activities.length === 0 ? <p className="tos-hint">Aktivite yok.</p> : null}
            </div>
          </section>
        </div>
      </div>
      <section className="tos-card tos-card-pad">
        <h2>Hızlı erişim</h2>
        <div className="tos-page-actions" style={{ marginTop: 12 }}>
          <Link className="tos-btn tos-btn-secondary" to="/buse/urunler/yeni">Ürün ekle</Link>
          <Link className="tos-btn tos-btn-secondary" to="/buse/musteriler">Müşteri ekle</Link>
          <Link className="tos-btn tos-btn-secondary" to="/buse/fiyatlandirma">Fiyat kuralı oluştur</Link>
          <Link className="tos-btn tos-btn-secondary" to="/buse/aktarim">Excel yükle</Link>
        </div>
      </section>
    </>
  );
}
