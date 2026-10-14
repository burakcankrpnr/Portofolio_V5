import { useMemo, useState } from "react";
import { formatDate, formatMoney, todayInputValue } from "../domain/money.js";
import { effectiveStatus, QUOTE_STATUSES, statusLabel } from "../domain/labels.js";
import { canWrite } from "../domain/permissions.js";
import { useStore } from "../data/StoreContext.jsx";
import { useDirty } from "../layout/Dirty.jsx";
import { Button, EmptyState, PageHeader, Pagination, RowMenu, StatusBadge, useConfirm, usePage, useToast } from "../ui/ui.jsx";
import { quotePdfBlob } from "../services/pdfQuote.js";

function localDay(iso) {
  const date = new Date(iso);
  return todayInputValue(date);
}

export default function QuotesPage() {
  const { state, deleteQuote, copyQuote } = useStore();
  const dirty = useDirty();
  const confirm = useConfirm();
  const toast = useToast();
  const writable = canWrite(state.settings.demoRole);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("date-desc");

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("tr-TR");
    const rows = state.quotes.filter((quote) => {
      const hay = `${quote.number} ${quote.customerSnapshot?.name || ""}`.toLocaleLowerCase("tr-TR");
      if (term && !hay.includes(term)) return false;
      if (status && effectiveStatus(quote) !== status) return false;
      if (customerId && quote.customerId !== customerId) return false;
      const day = localDay(quote.createdAt);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
    rows.sort((a, b) => {
      if (sort === "total-desc") return b.totals.totalKurus - a.totals.totalKurus;
      if (sort === "total-asc") return a.totals.totalKurus - b.totals.totalKurus;
      if (sort === "number") return a.number.localeCompare(b.number, "tr");
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return rows;
  }, [state.quotes, query, status, customerId, from, to, sort]);
  const pager = usePage(filtered);

  const previewPdf = async (quote) => {
    try {
      const blob = await quotePdfBlob(quote, state.settings);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast("PDF oluşturulamadı", "danger");
    }
  };

  const noData = state.quotes.length === 0;
  const noResults = !noData && filtered.length === 0;

  return (
    <>
      <PageHeader
        title="Teklifler"
        description="Arayın, durumuna göre süzün ve kaydı açın."
        actions={<Button variant="primary" disabled={!writable} onClick={() => dirty.attempt("/buse/teklifler/yeni")}>Yeni teklif</Button>}
      />
      <div className="tos-card tos-card-pad tos-toolbar">
        <input className="tos-input" placeholder="Teklif no veya müşteri" aria-label="Teklif ara" value={query} onChange={(event) => { setQuery(event.target.value); pager.setPage(1); }} />
        <select className="tos-select" aria-label="Durum" value={status} onChange={(event) => { setStatus(event.target.value); pager.setPage(1); }}>
          <option value="">Tüm durumlar</option>
          {QUOTE_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select className="tos-select" aria-label="Müşteri" value={customerId} onChange={(event) => { setCustomerId(event.target.value); pager.setPage(1); }}>
          <option value="">Tüm müşteriler</option>
          {state.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
        </select>
        <input className="tos-input" type="date" aria-label="Başlangıç" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input className="tos-input" type="date" aria-label="Bitiş" value={to} onChange={(event) => setTo(event.target.value)} />
        <select className="tos-select" aria-label="Sıralama" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="date-desc">Tarih (yeni)</option>
          <option value="total-desc">Tutar (yüksek)</option>
          <option value="total-asc">Tutar (düşük)</option>
          <option value="number">Teklif numarası</option>
        </select>
      </div>
      <section className="tos-card">
        {noData ? (
          <EmptyState title="Henüz teklif yok" body="İlk teklifi müşteri ve ürün seçerek oluşturun." action={<Button variant="primary" disabled={!writable} onClick={() => dirty.attempt("/buse/teklifler/yeni")}>Yeni teklif</Button>} />
        ) : null}
        {noResults ? <EmptyState title="Sonuç bulunamadı" body="Arama veya filtreyle eşleşen teklif yok. Filtreleri temizleyip yeniden deneyin." /> : null}
        {!noData && !noResults ? (
          <div className="tos-table-wrap">
            <table className="tos-table">
              <thead>
                <tr>
                  <th>Teklif no</th>
                  <th>Müşteri</th>
                  <th className="tos-hide-sm">Tarih</th>
                  <th>Toplam</th>
                  <th>Durum</th>
                  <th aria-label="İşlemler" />
                </tr>
              </thead>
              <tbody>
                {pager.slice.map((quote) => {
                  const current = effectiveStatus(quote);
                  return (
                    <tr key={quote.id} className="clickable" onClick={() => dirty.attempt(`/buse/teklifler/${quote.id}`)}>
                      <td>{quote.number}</td>
                      <td>{quote.customerSnapshot?.name}</td>
                      <td className="tos-hide-sm">{formatDate(quote.createdAt)}</td>
                      <td>{formatMoney(quote.totals.totalKurus, quote.currency)}</td>
                      <td><StatusBadge status={current} label={statusLabel(current)} /></td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <RowMenu items={[
                          { label: "Aç", onClick: () => dirty.attempt(`/buse/teklifler/${quote.id}`) },
                          { label: "Düzenle", disabled: !writable, onClick: () => dirty.attempt(`/buse/teklifler/${quote.id}/duzenle`) },
                          { label: "Kopyala", disabled: !writable, onClick: () => { const result = copyQuote(quote.id); if (result.ok) { toast("Teklif kopyalandı", "success"); dirty.releaseAndGo(`/buse/teklifler/${result.id}`); } else toast(result.error, "danger"); } },
                          { label: "PDF önizle", onClick: () => previewPdf(quote) },
                          { label: "Sil", disabled: !writable, onClick: async () => { const ok = await confirm({ title: "Teklifi sil", body: `${quote.number} kalıcı olarak silinsin mi?`, danger: true, confirmLabel: "Sil" }); if (!ok) return; const result = deleteQuote(quote.id); toast(result.ok ? "Teklif silindi" : result.error, result.ok ? "success" : "danger"); } },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        <Pagination page={pager.page} pages={pager.pages} total={pager.total} onPage={pager.setPage} />
      </section>
    </>
  );
}
