import { useState } from "react";
import { useStore } from "../data/StoreContext.jsx";
import { formatPercent } from "../domain/money.js";
import { canSeeCosts, canWrite } from "../domain/permissions.js";
import { emailOrEmpty } from "../domain/validation.js";
import { Badge, Button, EmptyState, Modal, PageHeader, PercentField, TextArea, TextField, useConfirm, useToast } from "../ui/ui.jsx";

const empty = { name: "", email: "", phone: "", notes: "", defaultDiscountBps: 0, active: true };

export default function SuppliersPage() {
  const { state, saveSupplier, deleteSupplier, setRecordActive } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const writable = canWrite(state.settings.demoRole);
  const seeCosts = canSeeCosts(state.settings.demoRole);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const rows = state.suppliers.filter((item) => item.name.toLocaleLowerCase("tr-TR").includes(query.trim().toLocaleLowerCase("tr-TR")));

  return (
    <>
      <PageHeader title="Tedarikçiler" description="Alış iskontosu yalnızca yönetici demo rolünde görünür." actions={<Button variant="primary" disabled={!writable} onClick={() => setForm(empty)}>Tedarikçi ekle</Button>} />
      <div className="tos-card tos-card-pad">
        <input className="tos-input" aria-label="Tedarikçi ara" placeholder="Tedarikçi ara" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <section className="tos-card">
        {state.suppliers.length === 0 ? <EmptyState title="Tedarikçi yok" body="Dış ürünler için tedarikçi ekleyebilirsiniz." /> : null}
        {state.suppliers.length > 0 && rows.length === 0 ? <EmptyState title="Sonuç bulunamadı" body="Aramayla eşleşen tedarikçi yok." /> : null}
        {rows.length > 0 ? (
          <table className="tos-table">
            <thead>
              <tr><th>Tedarikçi</th><th className="tos-hide-sm">İletişim</th><th>Ürün</th>{seeCosts ? <th>İskonto</th> : null}<th>Durum</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className="tos-hide-sm">{[item.email, item.phone].filter(Boolean).join(" · ") || "—"}</td>
                  <td>{state.products.filter((product) => product.supplierId === item.id).length}</td>
                  {seeCosts ? <td>{formatPercent(item.defaultDiscountBps || 0)}</td> : null}
                  <td>{item.active ? <Badge tone="success">Aktif</Badge> : <Badge>Pasif</Badge>}</td>
                  <td className="tos-page-actions">
                    <Button disabled={!writable} onClick={() => setForm(item)}>Düzenle</Button>
                    <Button disabled={!writable} onClick={() => setRecordActive("suppliers", item.id, !item.active)}>{item.active ? "Pasif" : "Aktif"}</Button>
                    <Button disabled={!writable} onClick={async () => {
                      const ok = await confirm({ title: "Tedarikçiyi sil", body: "Bağlı ürün varsa silinmez.", danger: true, confirmLabel: "Sil" });
                      if (!ok) return;
                      const result = deleteSupplier(item.id);
                      toast(result.ok ? "Silindi" : result.error, result.ok ? "success" : "danger");
                    }}>Sil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
      <Modal open={Boolean(form)} title={form?.id ? "Tedarikçiyi düzenle" : "Yeni tedarikçi"} onClose={() => setForm(null)}>
        {form ? (
          <>
            <TextField label="Ad" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <TextField label="E-posta" value={form.email || ""} error={emailOrEmpty(form.email)} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <TextField label="Telefon" value={form.phone || ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            {seeCosts ? <PercentField label="Varsayılan iskonto" bps={form.defaultDiscountBps || 0} onValue={(defaultDiscountBps) => setForm({ ...form, defaultDiscountBps })} /> : <p className="tos-note">İskonto bu demo rolünde gizli ve değiştirilemez.</p>}
            <TextArea label="Not" value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <Button variant="primary" onClick={() => {
              if (emailOrEmpty(form.email)) return;
              const result = saveSupplier(form);
              if (!result.ok) { toast(result.error, "danger"); return; }
              toast("Tedarikçi kaydedildi", "success");
              setForm(null);
            }}>Kaydet</Button>
          </>
        ) : null}
      </Modal>
    </>
  );
}
