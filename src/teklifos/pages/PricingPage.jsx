import { useState } from "react";
import { useStore } from "../data/StoreContext.jsx";
import { formatDateTime, formatMoney, formatPercent } from "../domain/money.js";
import { PRODUCT_TYPES } from "../domain/labels.js";
import { canWrite } from "../domain/permissions.js";
import { METHODS, simulatePricing } from "../domain/pricing.js";
import { Badge, Button, EmptyState, Modal, MoneyField, PageHeader, PercentField, SelectField, TextField, useToast } from "../ui/ui.jsx";

const empty = {
  name: "",
  productType: "catalog",
  method: "discount",
  rateBps: 0,
  priority: 10,
  active: true,
  startsAt: "",
  endsAt: "",
};

export default function PricingPage() {
  const { state, saveRule, setRuleActive } = useStore();
  const toast = useToast();
  const writable = canWrite(state.settings.demoRole);
  const [form, setForm] = useState(null);
  const [sandbox, setSandbox] = useState({ method: "discount", baseKurus: 100000, rateBps: 1000, widthMm: 1000, heightMm: 1000 });
  const result = simulatePricing({
    method: sandbox.method,
    baseKurus: sandbox.baseKurus,
    rateBps: sandbox.rateBps,
    widthMm: Number(sandbox.widthMm),
    heightMm: Number(sandbox.heightMm),
    rounding: state.settings.rounding,
  });

  return (
    <>
      <PageHeader
        title="Fiyatlandırma"
        description="İskonto, maliyet üzerine kâr ve hedef marj ayrı yöntemlerdir. İmalat alanı yalnızca örnektir."
        actions={<Button variant="primary" disabled={!writable} onClick={() => setForm(empty)}>Kural oluştur</Button>}
      />
      <section className="tos-card tos-card-pad">
        <h2>Örnek hesap</h2>
        <div className="tos-form-grid" style={{ marginTop: 12 }}>
          <SelectField label="Yöntem" value={sandbox.method} onChange={(event) => setSandbox({ ...sandbox, method: event.target.value })}>
            {Object.values(METHODS).map((method) => <option key={method.id} value={method.id}>{method.label}</option>)}
          </SelectField>
          <MoneyField label="Taban tutar" kurus={sandbox.baseKurus} onValue={(baseKurus) => setSandbox({ ...sandbox, baseKurus })} />
          {sandbox.method !== "example-area" ? (
            <PercentField label="Oran" bps={sandbox.rateBps} onValue={(rateBps) => setSandbox({ ...sandbox, rateBps })} />
          ) : (
            <>
              <TextField label="En mm" value={sandbox.widthMm} onChange={(event) => setSandbox({ ...sandbox, widthMm: event.target.value })} />
              <TextField label="Boy mm" value={sandbox.heightMm} onChange={(event) => setSandbox({ ...sandbox, heightMm: event.target.value })} />
            </>
          )}
        </div>
        <p className="tos-note" style={{ marginTop: 12 }}>{METHODS[sandbox.method].formula}</p>
        {sandbox.method === "example-area" ? <p className="tos-note">Bu formül doğrulanmamıştır. Kesin imalat kuralı olarak uygulanmaz.</p> : null}
        <p style={{ marginTop: 8 }}>
          {result.ok
            ? <strong>Sonuç: {formatMoney(result.unitPriceKurus, state.settings.currency)}</strong>
            : <span className="tos-error" role="alert">{result.error}</span>}
        </p>
      </section>
      <section className="tos-card">
        {state.pricingRules.length === 0 ? <EmptyState title="Kural yok" body="Ürün türüne bir fiyat kuralı ekleyin." /> : (
          <table className="tos-table">
            <thead>
              <tr><th>Ad</th><th>Tür</th><th>Yöntem</th><th>Oran</th><th className="tos-hide-sm">Öncelik</th><th>Durum</th><th /></tr>
            </thead>
            <tbody>
              {state.pricingRules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.name}{rule.exampleOnly ? <div className="tos-hint">Örnek kural</div> : null}</td>
                  <td>{rule.productType === "all" ? "Tümü" : PRODUCT_TYPES.find((item) => item.id === rule.productType)?.label}</td>
                  <td>{METHODS[rule.method]?.label}</td>
                  <td>{rule.method === "example-area" ? "—" : formatPercent(rule.rateBps)}</td>
                  <td className="tos-hide-sm">{rule.priority}</td>
                  <td>{rule.active ? <Badge tone="success">Aktif</Badge> : <Badge>Pasif</Badge>}</td>
                  <td className="tos-page-actions">
                    <Button disabled={!writable} onClick={() => setForm(rule)}>Düzenle</Button>
                    <Button disabled={!writable} onClick={() => setRuleActive(rule.id, !rule.active)}>{rule.active ? "Kapat" : "Aç"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <Modal open={Boolean(form)} title={form?.id ? "Kuralı düzenle" : "Yeni kural"} onClose={() => setForm(null)}>
        {form ? (
          <>
            <TextField label="Ad" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <SelectField label="Kapsam" value={form.productType} onChange={(event) => setForm({ ...form, productType: event.target.value })}>
              <option value="all">Tümü</option>
              {PRODUCT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </SelectField>
            <SelectField label="Yöntem" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
              {Object.values(METHODS).map((method) => <option key={method.id} value={method.id}>{method.label}</option>)}
            </SelectField>
            <p className="tos-note">{METHODS[form.method]?.formula}</p>
            {form.method === "example-area" ? <p className="tos-note">Doğrulanmamış örnek. Kayıtta kesin iş kuralı gibi gösterilmez.</p> : (
              <PercentField label="Oran" bps={form.rateBps || 0} onValue={(rateBps) => setForm({ ...form, rateBps })} />
            )}
            <TextField label="Öncelik" inputMode="numeric" value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} />
            <TextField label="Başlangıç" type="date" value={form.startsAt || ""} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
            <TextField label="Bitiş" type="date" value={form.endsAt || ""} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
            {form.updatedAt ? <p className="tos-hint">Son güncelleyen: {form.updatedBy} · {formatDateTime(form.updatedAt)}</p> : null}
            <Button variant="primary" onClick={() => {
              const resultSave = saveRule({ ...form, rateBps: form.method === "example-area" ? 0 : form.rateBps });
              if (!resultSave.ok) { toast(resultSave.error, "danger"); return; }
              toast("Kural kaydedildi", "success");
              setForm(null);
            }}>Kaydet</Button>
          </>
        ) : null}
      </Modal>
    </>
  );
}
