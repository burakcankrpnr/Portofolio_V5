import { formatMoney } from "../domain/money.js";
import { effectiveStatus, statusLabel } from "../domain/labels.js";
import { useStore } from "../data/StoreContext.jsx";
import { PageHeader, StatusBadge } from "../ui/ui.jsx";

export default function ReportsPage() {
  const { state } = useStore();
  const currency = state.settings.currency;
  const byStatus = {};
  for (const quote of state.quotes) {
    const status = effectiveStatus(quote);
    byStatus[status] = byStatus[status] || { count: 0, total: 0 };
    byStatus[status].count += 1;
    byStatus[status].total += quote.totals?.totalKurus || 0;
  }
  const customers = state.customers.map((customer) => {
    const quotes = state.quotes.filter((quote) => quote.customerId === customer.id);
    return {
      id: customer.id,
      name: customer.name,
      count: quotes.length,
      total: quotes.reduce((sum, quote) => sum + (quote.totals?.totalKurus || 0), 0),
    };
  }).sort((a, b) => b.total - a.total);
  const approved = state.quotes.filter((quote) => quote.status === "approved").reduce((sum, quote) => sum + quote.totals.totalKurus, 0);

  return (
    <>
      <PageHeader title="Raporlar" description="Yalnızca bu tarayıcıdaki kayıtlardan. Uydurma hedef veya grafik yok." />
      <section className="tos-kpis">
        <article className="tos-card tos-card-pad tos-kpi"><small>Teklif</small><strong>{state.quotes.length}</strong></article>
        <article className="tos-card tos-card-pad tos-kpi"><small>Ürün</small><strong>{state.products.length}</strong></article>
        <article className="tos-card tos-card-pad tos-kpi"><small>Müşteri</small><strong>{state.customers.length}</strong></article>
        <article className="tos-card tos-card-pad tos-kpi"><small>Onaylı tutar</small><strong>{formatMoney(approved, currency)}</strong></article>
      </section>
      <section className="tos-card tos-card-pad">
        <h2>Duruma göre</h2>
        {state.quotes.length === 0 ? <p className="tos-hint">Teklif olmadığı için dağılım yok.</p> : (
          <div className="tos-bars" style={{ marginTop: 12 }}>
            {Object.entries(byStatus).map(([status, info]) => (
              <div key={status} className="tos-toolbar" style={{ justifyContent: "space-between" }}>
                <StatusBadge status={status} label={statusLabel(status)} />
                <span>{info.count} · {formatMoney(info.total, currency)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="tos-card">
        <div className="tos-card-pad"><h2>Müşteriye göre</h2></div>
        <table className="tos-table">
          <thead><tr><th>Müşteri</th><th>Teklif</th><th>Tutar</th></tr></thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}><td>{customer.name}</td><td>{customer.count}</td><td>{formatMoney(customer.total, currency)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
