import { useState } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../data/StoreContext.jsx";
import { formatDate, formatDateTime, formatMoney, formatPercent, formatQuantity } from "../domain/money.js";
import { effectiveStatus, QUOTE_STATUSES, statusLabel, typeLabel } from "../domain/labels.js";
import { canManualPrice, canSeeCosts, canWrite } from "../domain/permissions.js";
import { useDirty } from "../layout/Dirty.jsx";
import { quotePdfBlob } from "../services/pdfQuote.js";
import PdfPreview from "../ui/PdfPreview.jsx";
import { Button, EmptyState, Modal, PageHeader, StatusBadge, useToast } from "../ui/ui.jsx";

export default function QuoteDetailPage() {
  const { id } = useParams();
  const { state, updateQuoteStatus, copyQuote } = useStore();
  const dirty = useDirty();
  const toast = useToast();
  const quote = state.quotes.find((item) => item.id === id);
  const [pdfBytes, setPdfBytes] = useState(null);
  const writable = canWrite(state.settings.demoRole);
  const seeCosts = canSeeCosts(state.settings.demoRole);
  const seeManualDetail = canManualPrice(state.settings.demoRole);

  if (!quote) return <EmptyState title="Teklif bulunamadı" body="Kayıt silinmiş veya bu tarayıcıda yok." />;

  const status = effectiveStatus(quote);
  const openPdf = async (download) => {
    try {
      const blob = await quotePdfBlob(quote, state.settings);
      if (download) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${quote.number}.pdf`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
      setPdfBytes(new Uint8Array(await blob.arrayBuffer()));
    } catch {
      toast("PDF oluşturulamadı", "danger");
    }
  };

  const activities = state.activities.filter((item) => item.entityId === quote.id);

  return (
    <>
      <PageHeader
        title={quote.number}
        description={`${quote.customerSnapshot?.name || ""} · ${formatDate(quote.createdAt)}`}
        actions={(
          <>
            <Button variant="secondary" onClick={() => openPdf(false)}>PDF önizle</Button>
            <Button variant="secondary" onClick={() => openPdf(true)}>PDF indir</Button>
            <Button variant="secondary" disabled={!writable} onClick={() => { const result = copyQuote(quote.id); if (!result.ok) { toast(result.error, "danger"); return; } toast("Kopya oluşturuldu", "success"); dirty.releaseAndGo(`/buse/teklifler/${result.id}`); }}>Kopyala</Button>
            <Button variant="primary" disabled={!writable} onClick={() => dirty.attempt(`/buse/teklifler/${quote.id}/duzenle`)}>Düzenle</Button>
          </>
        )}
      />
      <div className="tos-grid-2">
        <section className="tos-card tos-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="tos-toolbar">
            <StatusBadge status={status} label={statusLabel(status)} />
            {status === "expired" && quote.status !== "expired" ? <span className="tos-hint">Geçerlilik tarihi geçtiği için süresi dolmuş görünüyor.</span> : null}
          </div>
          <label className="tos-field">
            <span>Durum güncelle</span>
            <select
              className="tos-select"
              aria-label="Teklif durumu"
              disabled={!writable}
              value={quote.status}
              onChange={(event) => {
                const result = updateQuoteStatus(quote.id, event.target.value);
                toast(result.ok ? "Durum kaydedildi" : result.error, result.ok ? "success" : "danger");
              }}
            >
              {QUOTE_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <p className="tos-note">Müşteriye e-posta gönderme yapılandırılmadı. Bu düğme kasıtlı olarak kapalı.</p>
          <Button disabled>E-posta ile gönder — yakında değil, servis yok</Button>
          <div>
            <h2>Müşteri</h2>
            <p>{quote.customerSnapshot?.name}</p>
            <p className="tos-hint">{[quote.customerSnapshot?.contactName, quote.customerSnapshot?.email, quote.customerSnapshot?.phone].filter(Boolean).join(" · ")}</p>
            <p className="tos-hint">{quote.customerSnapshot?.address}</p>
            {quote.customerSnapshot?.taxNumber ? <p className="tos-hint">Vergi no: {quote.customerSnapshot.taxNumber}</p> : null}
          </div>
          <p className="tos-hint">Oluşturma: {formatDateTime(quote.createdAt)} · Güncelleme: {formatDateTime(quote.updatedAt)}</p>
          <p className="tos-hint">Geçerlilik: {formatDate(quote.validityDate)} · Para birimi: {quote.currency}</p>
        </section>
        <section className="tos-card tos-card-pad">
          <h2>Toplamlar</h2>
          <p>Ara toplam: {formatMoney(quote.totals.subtotalKurus, quote.currency)}</p>
          <p>İndirim: {formatMoney(quote.totals.discountKurus, quote.currency)} ({formatPercent(quote.quoteDiscountBps)})</p>
          <p>Vergi: {formatMoney(quote.totals.taxKurus, quote.currency)} ({formatPercent(quote.taxBps)})</p>
          <p><strong>Genel toplam: {formatMoney(quote.totals.totalKurus, quote.currency)}</strong></p>
          <p className="tos-hint" style={{ marginTop: 8 }}>Yuvarlama: {quote.rounding === "down" ? "aşağı" : quote.rounding === "half-even" ? "yarım-çift" : "yarım yukarı"}</p>
        </section>
      </div>
      <section className="tos-card">
        <div className="tos-table-wrap">
          <table className="tos-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Ürün</th>
                <th>Miktar</th>
                <th>Birim</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>
                    <strong style={{ fontWeight: 600 }}>{item.name}</strong>
                    <div className="tos-hint">{typeLabel(item.type)} · {item.methodLabel}</div>
                    {item.specs ? <div className="tos-hint">{item.specs}</div> : null}
                    {item.exampleOnly ? <div className="tos-hint">Örnek formül, şirket kuralı olarak doğrulanmadı.</div> : null}
                    {item.ruleName ? <div className="tos-hint">Kural: {item.ruleName}</div> : null}
                  </td>
                  <td>{formatQuantity(item.quantityMilli)}</td>
                  <td>{formatMoney(item.unitPriceKurus, quote.currency)}</td>
                  <td>{formatMoney(item.lineNetKurus, quote.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {quote.priceChanges?.length ? (
        <section className="tos-card tos-card-pad">
          <h2>Manuel fiyat kayıtları</h2>
          {quote.priceChanges.map((change) => (
            <p key={change.id} style={{ marginTop: 8 }}>
              {change.code}: {seeManualDetail ? `${formatMoney(change.fromKurus, quote.currency)} → ${formatMoney(change.toKurus, quote.currency)}` : "Manuel fiyat uygulandı"}
              {seeCosts || seeManualDetail ? ` · ${change.note || ""} · ${change.role}` : ""}
              <span className="tos-hint"> · {formatDateTime(change.at)}</span>
            </p>
          ))}
        </section>
      ) : null}
      <section className="tos-card tos-card-pad">
        <h2>Koşullar</h2>
        <p style={{ marginTop: 8 }}>{quote.deliveryTerms}</p>
        <p>{quote.paymentTerms}</p>
        {quote.notes ? <p>{quote.notes}</p> : null}
      </section>
      <section className="tos-card tos-card-pad">
        <h2>Aktivite</h2>
        {activities.length === 0 ? <p className="tos-hint">Bu teklife bağlı aktivite yok.</p> : activities.map((item) => (
          <p key={item.id} style={{ marginTop: 8 }}>{item.message} <span className="tos-hint">{formatDateTime(item.at)}</span></p>
        ))}
      </section>
      <Modal wide open={Boolean(pdfBytes)} title="PDF önizleme" onClose={() => setPdfBytes(null)}>
        <PdfPreview data={pdfBytes} />
        <Button variant="primary" onClick={() => openPdf(true)}>İndir</Button>
      </Modal>
    </>
  );
}
