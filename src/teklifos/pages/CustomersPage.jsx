import { useMemo, useState } from "react";
import { useStore } from "../data/StoreContext.jsx";
import { customerQuoteStats } from "../data/store.js";
import { formatDate } from "../domain/money.js";
import { canWrite } from "../domain/permissions.js";
import { emailOrEmpty } from "../domain/validation.js";
import { Button, EmptyState, Modal, PageHeader, Pagination, TextArea, TextField, useConfirm, usePage, useToast } from "../ui/ui.jsx";

const empty = { name: "", contactName: "", email: "", phone: "", address: "", taxNumber: "", notes: "" };

export default function CustomersPage() {
  const { state, saveCustomer, deleteCustomer } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const writable = canWrite(state.settings.demoRole);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const rows = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("tr-TR");
    return state.customers.filter((customer) => !term || `${customer.name} ${customer.contactName} ${customer.email}`.toLocaleLowerCase("tr-TR").includes(term));
  }, [state.customers, query]);
  const pager = usePage(rows);

  return (
    <>
      <PageHeader title="Müşteriler" description="Teklif için gerekli iletişim ve fatura bilgileri." actions={<Button variant="primary" disabled={!writable} onClick={() => setForm(empty)}>Müşteri ekle</Button>} />
      <div className="tos-card tos-card-pad">
        <input className="tos-input" aria-label="Müşteri ara" placeholder="Ad, ilgili kişi veya e-posta" value={query} onChange={(event) => { setQuery(event.target.value); pager.setPage(1); }} />
      </div>
      <section className="tos-card">
        {state.customers.length === 0 ? <EmptyState title="Müşteri yok" body="Teklif açmadan önce bir müşteri ekleyin." /> : null}
        {state.customers.length > 0 && rows.length === 0 ? <EmptyState title="Sonuç bulunamadı" body="Aramayla eşleşen müşteri yok." /> : null}
        {rows.length > 0 ? (
          <div className="tos-table-wrap">
            <table className="tos-table">
              <thead>
                <tr><th>Müşteri</th><th className="tos-hide-sm">İlgili</th><th className="tos-hide-sm">İletişim</th><th>Teklif</th><th /></tr>
              </thead>
              <tbody>
                {pager.slice.map((customer) => {
                  const stats = customerQuoteStats(state, customer.id);
                  return (
                    <tr key={customer.id}>
                      <td>{customer.name}<div className="tos-hint">{customer.taxNumber ? `Vergi no ${customer.taxNumber}` : ""}</div></td>
                      <td className="tos-hide-sm">{customer.contactName || "—"}</td>
                      <td className="tos-hide-sm">{[customer.email, customer.phone].filter(Boolean).join(" · ") || "—"}</td>
                      <td>{stats.count}<div className="tos-hint">{stats.latest ? formatDate(stats.latest) : "Teklif yok"}</div></td>
                      <td className="tos-page-actions">
                        <Button disabled={!writable} onClick={() => setForm(customer)}>Düzenle</Button>
                        <Button disabled={!writable} onClick={async () => {
                          const ok = await confirm({ title: "Müşteriyi sil", body: "Teklifi olan müşteri silinmez.", danger: true, confirmLabel: "Sil" });
                          if (!ok) return;
                          const result = deleteCustomer(customer.id);
                          toast(result.ok ? "Müşteri silindi" : result.error, result.ok ? "success" : "danger");
                        }}>Sil</Button>
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
      <Modal open={Boolean(form)} title={form?.id ? "Müşteriyi düzenle" : "Yeni müşteri"} onClose={() => setForm(null)}>
        {form ? (
          <>
            <TextField label="Şirket / kişi adı" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <TextField label="İlgili kişi" value={form.contactName || ""} onChange={(event) => setForm({ ...form, contactName: event.target.value })} />
            <TextField label="E-posta" value={form.email || ""} error={emailOrEmpty(form.email)} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <TextField label="Telefon" value={form.phone || ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <TextArea label="Fatura / adres" value={form.address || ""} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            <TextField label="Vergi numarası" value={form.taxNumber || ""} onChange={(event) => setForm({ ...form, taxNumber: event.target.value })} />
            <TextArea label="Notlar" value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <Button variant="primary" onClick={() => {
              if (emailOrEmpty(form.email)) return;
              const result = saveCustomer(form);
              if (!result.ok) { toast(result.error, "danger"); return; }
              toast("Müşteri kaydedildi", "success");
              setForm(null);
            }}>Kaydet</Button>
          </>
        ) : null}
      </Modal>
    </>
  );
}
