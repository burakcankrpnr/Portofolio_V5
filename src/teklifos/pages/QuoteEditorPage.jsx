import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../data/StoreContext.jsx";
import { addDaysInput, formatMoney, formatQuantity, parseMoneyToKurus, parsePercentToBps, parseQuantityToMilli, todayInputValue } from "../domain/money.js";
import { buildSnapshotItem, computeQuoteTotals } from "../domain/quoteTotals.js";
import { resolveRule } from "../domain/pricing.js";
import { canManualPrice, canWrite } from "../domain/permissions.js";
import { emailOrEmpty } from "../domain/validation.js";
import { useDirty } from "../layout/Dirty.jsx";
import { quotePdfBlob } from "../services/pdfQuote.js";
import PdfPreview from "../ui/PdfPreview.jsx";
import {
  Button,
  EmptyState,
  Modal,
  PageHeader,
  PercentField,
  SelectField,
  TextArea,
  TextField,
  Thumb,
  useToast,
} from "../ui/ui.jsx";

export default function QuoteEditorPage() {
  const { id } = useParams();
  const { state, saveQuote, saveCustomer } = useStore();
  const dirty = useDirty();
  const toast = useToast();
  const existing = state.quotes.find((quote) => quote.id === id);
  const writable = canWrite(state.settings.demoRole);
  const manualAllowed = canManualPrice(state.settings.demoRole);
  const loaded = useRef("");
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([]);
  const [quoteDiscountBps, setQuoteDiscountBps] = useState(0);
  const [notes, setNotes] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [priceChanges, setPriceChanges] = useState([]);
  const [productQuery, setProductQuery] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState("");
  const [pdfBytes, setPdfBytes] = useState(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", contactName: "", email: "", phone: "" });

  useEffect(() => {
    const key = id || "new";
    if (loaded.current === key) return;
    loaded.current = key;
    if (existing) {
      setCustomerId(existing.customerId);
      setItems(existing.items);
      setQuoteDiscountBps(existing.quoteDiscountBps || 0);
      setNotes(existing.notes || "");
      setValidityDate(existing.validityDate || "");
      setDeliveryTerms(existing.deliveryTerms || "");
      setPaymentTerms(existing.paymentTerms || "");
      setPriceChanges(existing.priceChanges || []);
      return;
    }
    setCustomerId("");
    setItems([]);
    setQuoteDiscountBps(0);
    setNotes("");
    setValidityDate(addDaysInput(state.settings.validityDays || 15));
    setDeliveryTerms(state.settings.deliveryTerms || "");
    setPaymentTerms(state.settings.paymentTerms || "");
    setPriceChanges([]);
  }, [id, existing, state.settings]);

  const mark = () => dirty.setDirty(true);

  const totals = useMemo(() => computeQuoteTotals({
    items,
    quoteDiscountBps,
    taxBps: state.settings.taxBps,
    rounding: state.settings.rounding,
  }), [items, quoteDiscountBps, state.settings]);

  const products = state.products.filter((product) => {
    if (!product.active) return false;
    if (brandId && product.brandId !== brandId) return false;
    if (categoryId && product.categoryId !== categoryId) return false;
    const term = productQuery.trim().toLocaleLowerCase("tr-TR");
    if (!term) return true;
    return `${product.code} ${product.name}`.toLocaleLowerCase("tr-TR").includes(term);
  }).slice(0, 8);

  const addProduct = (product) => {
    const rule = resolveRule(state.pricingRules, product);
    const built = buildSnapshotItem({
      product,
      rule,
      quantityMilli: 1000,
      measures: {
        widthMm: product.measures?.widthMm || "",
        heightMm: product.measures?.heightMm || "",
        depthMm: product.measures?.depthMm || "",
        unit: product.measures?.unit || "mm",
      },
      rounding: state.settings.rounding,
      brands: state.brands,
    });
    if (!built.ok) {
      if (product.type !== "manufacturing") {
        toast(built.error, "danger");
        return;
      }
      setItems((current) => [...current, {
        id: crypto.randomUUID(),
        productId: product.id,
        code: product.code,
        name: product.name,
        brandName: state.brands.find((brand) => brand.id === product.brandId)?.name || "",
        type: product.type,
        specs: (product.attributes || []).filter((attr) => attr.key && attr.value).map((attr) => `${attr.key}: ${attr.value}`).join(" · "),
        imageDataUrl: product.imageDataUrl || "",
        quantityMilli: 1000,
        measures: { widthMm: "", heightMm: "", depthMm: "", unit: "mm" },
        unitPriceKurus: 0,
        discountBps: 0,
        grossKurus: 0,
        lineDiscountKurus: 0,
        lineNetKurus: 0,
        method: "example-area",
        methodLabel: "Örnek alan hesabı (doğrulanmamış örnek)",
        formula: "örnek satış = birim fiyat × (en mm × boy mm / 1.000.000)",
        exampleOnly: true,
        ruleId: rule?.id || null,
        ruleName: rule?.name || "Kural yok",
        manual: false,
      }]);
      toast("En ve boy girilince örnek fiyat hesaplanır", "info");
      mark();
      return;
    }
    setItems((current) => [...current, built.item]);
    mark();
  };

  const reprice = (item, patch) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    const next = { ...item, ...patch };
    const width = Number(next.measures?.widthMm);
    const height = Number(next.measures?.heightMm);
    if ((next.method === "example-area" || next.exampleOnly) && !(width > 0 && height > 0)) {
      return next;
    }
    if (!product) return next;
    const rule = item.ruleId
      ? state.pricingRules.find((entry) => entry.id === item.ruleId) || resolveRule(state.pricingRules, product)
      : resolveRule(state.pricingRules, product);
    const built = buildSnapshotItem({
      product,
      rule,
      quantityMilli: next.quantityMilli,
      discountBps: next.discountBps || 0,
      measures: next.measures,
      manualUnitPriceKurus: next.manual ? next.unitPriceKurus : null,
      manualNote: next.manualNote,
      rounding: state.settings.rounding,
      brands: state.brands,
    });
    if (!built.ok) {
      toast(built.error, "danger");
      return item;
    }
    return { ...built.item, id: item.id };
  };

  const patchItem = (itemId, patch, manualChange) => {
    setItems((current) => current.map((item) => (item.id === itemId ? reprice(item, patch) : item)));
    if (manualChange) {
      setPriceChanges((current) => [...current, {
        id: crypto.randomUUID(),
        itemId,
        code: manualChange.code,
        fromKurus: manualChange.from,
        toKurus: manualChange.to,
        at: new Date().toISOString(),
        role: state.settings.demoRole,
        note: manualChange.note || "Manuel birim fiyat",
      }]);
    }
    mark();
  };

  const draftQuote = () => {
    const customer = state.customers.find((item) => item.id === customerId);
    if (!totals.ok) return null;
    return {
      id: existing?.id,
      number: existing?.number || "Önizleme",
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerId,
      customerSnapshot: customer || { name: "Müşteri seçilmedi" },
      status: existing?.status || "draft",
      currency: state.settings.currency,
      items: totals.lines,
      quoteDiscountBps,
      taxBps: state.settings.taxBps,
      rounding: state.settings.rounding,
      notes,
      validityDate,
      deliveryTerms,
      paymentTerms,
      totals: {
        subtotalKurus: totals.subtotalKurus,
        discountKurus: totals.discountKurus,
        taxKurus: totals.taxKurus,
        totalKurus: totals.totalKurus,
      },
      priceChanges,
    };
  };

  const save = () => {
    setError("");
    if (!totals.ok) {
      setError(totals.error);
      return;
    }
    if (items.some((item) => (item.exampleOnly || item.method === "example-area") && !(Number(item.measures?.widthMm) > 0 && Number(item.measures?.heightMm) > 0))) {
      setError("İmalat örneği için en ve boy gerekli");
      return;
    }
    const result = saveQuote({
      id: existing?.id,
      customerId,
      items: totals.lines,
      quoteDiscountBps,
      notes,
      validityDate,
      deliveryTerms,
      paymentTerms,
      priceChanges,
    });
    if (!result.ok) {
      setError(result.error);
      toast(result.error, "danger");
      return;
    }
    toast("Teklif kaydedildi", "success");
    dirty.releaseAndGo(`/buse/teklifler/${result.id}`);
  };

  const preview = async () => {
    const quote = draftQuote();
    if (!quote) {
      toast(totals.error || "Önizleme için satırlar geçersiz", "danger");
      return;
    }
    try {
      const blob = await quotePdfBlob(quote, state.settings);
      setPdfBytes(new Uint8Array(await blob.arrayBuffer()));
    } catch {
      toast("PDF oluşturulamadı", "danger");
    }
  };

  if (!writable) {
    return <EmptyState title="Salt okunur" body="Bu demo rolü teklif oluşturamaz veya düzenleyemez." />;
  }
  if (id && !existing) return <EmptyState title="Teklif bulunamadı" body="Düzenlenecek kayıt yok." />;

  return (
    <>
      <PageHeader
        title={existing ? `${existing.number} düzenle` : "Yeni teklif"}
        description="Müşteri, ürün, ölçü ve fiyat aynı ekranda. Toplamlar kayıtla aynı hesaplanır."
        actions={(
          <>
            <Button variant="secondary" onClick={preview}>Önizle</Button>
            <Button variant="primary" onClick={save}>Kaydet</Button>
          </>
        )}
      />
      {error ? <p className="tos-error" role="alert">{error}</p> : null}
      <section className="tos-card tos-card-pad">
        <h2>Müşteri ve teklif</h2>
        <div className="tos-form-grid" style={{ marginTop: 12 }}>
          <SelectField label="Müşteri" value={customerId} onChange={(event) => { setCustomerId(event.target.value); mark(); }}>
            <option value="">Seçin</option>
            {state.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </SelectField>
          <div className="tos-field">
            <span>Yeni müşteri</span>
            <Button onClick={() => setCustomerOpen(true)}>Müşteri ekle</Button>
          </div>
          <TextField label="Teklif tarihi" value={todayInputValue(existing ? new Date(existing.createdAt) : new Date())} disabled />
          <TextField label="Geçerlilik tarihi" type="date" value={validityDate} onChange={(event) => { setValidityDate(event.target.value); mark(); }} />
          <TextArea className="tos-span-2" label="Notlar" value={notes} onChange={(event) => { setNotes(event.target.value); mark(); }} />
          <TextArea label="Teslimat koşulları" value={deliveryTerms} onChange={(event) => { setDeliveryTerms(event.target.value); mark(); }} />
          <TextArea label="Ödeme koşulları" value={paymentTerms} onChange={(event) => { setPaymentTerms(event.target.value); mark(); }} />
        </div>
      </section>
      <section className="tos-card tos-card-pad">
        <h2>Ürün ekle</h2>
        <div className="tos-toolbar" style={{ marginTop: 12 }}>
          <input className="tos-input" placeholder="Kod veya ad" aria-label="Ürün ara" value={productQuery} onChange={(event) => setProductQuery(event.target.value)} />
          <select className="tos-select" aria-label="Marka filtresi" value={brandId} onChange={(event) => setBrandId(event.target.value)}>
            <option value="">Tüm markalar</option>
            {state.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
          <select className="tos-select" aria-label="Kategori filtresi" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Tüm kategoriler</option>
            {state.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {products.map((product) => (
            <div key={product.id} className="tos-toolbar" style={{ justifyContent: "space-between" }}>
              <div className="tos-toolbar">
                <Thumb name={product.name} image={product.imageDataUrl} />
                <div>
                  <strong style={{ fontWeight: 600 }}>{product.name}</strong>
                  <div className="tos-hint">{product.code}</div>
                </div>
              </div>
              <Button onClick={() => addProduct(product)}>Ekle</Button>
            </div>
          ))}
          {products.length === 0 ? <p className="tos-hint">Eşleşen aktif ürün yok.</p> : null}
        </div>
      </section>
      <section className="tos-card">
        <div className="tos-table-wrap">
          <table className="tos-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Miktar</th>
                <th>Birim</th>
                <th>Tutar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong style={{ fontWeight: 600 }}>{item.name}</strong>
                    <div className="tos-hint">{item.code} · {item.methodLabel}</div>
                    {item.exampleOnly ? <div className="tos-hint">Örnek alan formülü, doğrulanmış iş kuralı değil.</div> : null}
                    {item.type === "manufacturing" ? (
                      <div className="tos-toolbar" style={{ marginTop: 8 }}>
                        <input className="tos-input" style={{ width: 90 }} aria-label="En mm" placeholder="En mm" value={item.measures?.widthMm || ""} onChange={(event) => patchItem(item.id, { measures: { ...item.measures, widthMm: Number(event.target.value) || "" } })} />
                        <input className="tos-input" style={{ width: 90 }} aria-label="Boy mm" placeholder="Boy mm" value={item.measures?.heightMm || ""} onChange={(event) => patchItem(item.id, { measures: { ...item.measures, heightMm: Number(event.target.value) || "" } })} />
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <input
                      className="tos-input"
                      style={{ width: 80 }}
                      aria-label={`${item.name} miktarı`}
                      defaultValue={formatQuantity(item.quantityMilli)}
                      key={`${item.id}-${item.quantityMilli}`}
                      onBlur={(event) => {
                        const quantityMilli = parseQuantityToMilli(event.target.value);
                        if (!quantityMilli) {
                          toast("Miktar 0’dan büyük olmalı", "danger");
                          return;
                        }
                        patchItem(item.id, { quantityMilli });
                      }}
                    />
                  </td>
                  <td>
                    {manualAllowed ? (
                      <input
                        className="tos-input"
                        style={{ width: 120 }}
                        aria-label={`${item.name} birim fiyat`}
                        defaultValue={(item.unitPriceKurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        key={`${item.id}-price-${item.unitPriceKurus}`}
                        onBlur={(event) => {
                          const to = parseMoneyToKurus(event.target.value);
                          if (to == null) {
                            toast("Birim fiyat geçersiz", "danger");
                            return;
                          }
                          if (to === item.unitPriceKurus) return;
                          patchItem(item.id, { manual: true, unitPriceKurus: to, manualNote: "Manuel birim fiyat" }, {
                            code: item.code,
                            from: item.unitPriceKurus,
                            to,
                            note: "Manuel birim fiyat",
                          });
                        }}
                      />
                    ) : (
                      formatMoney(item.unitPriceKurus, state.settings.currency)
                    )}
                    {item.manual ? <div className="tos-hint">Manuel</div> : null}
                    {manualAllowed && item.manual ? (
                      <button type="button" className="tos-btn tos-btn-ghost" onClick={() => patchItem(item.id, { manual: false })}>Kural fiyatı</button>
                    ) : null}
                  </td>
                  <td>{formatMoney(item.lineNetKurus, state.settings.currency)}</td>
                  <td><Button onClick={() => { setItems((current) => current.filter((entry) => entry.id !== item.id)); mark(); }}>Kaldır</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 ? <p className="tos-empty">Henüz satır yok.</p> : null}
      </section>
      <section className="tos-card tos-card-pad">
        <h2>Fiyat özeti</h2>
        <div className="tos-form-grid" style={{ marginTop: 12 }}>
          <PercentField label="Teklif iskontosu" bps={quoteDiscountBps} onValue={(value) => { setQuoteDiscountBps(value); mark(); }} />
          <p className="tos-note">Vergi oranı şirket ayarından gelir: {state.settings.taxBps / 100}%. Sıra: satır tutarı, teklif iskontosu, vergi. Yuvarlama kuruşta {state.settings.rounding}.</p>
        </div>
        {totals.ok ? (
          <div style={{ marginTop: 12 }}>
            <p>Ara toplam: {formatMoney(totals.subtotalKurus, state.settings.currency)}</p>
            <p>İndirim: {formatMoney(totals.discountKurus, state.settings.currency)}</p>
            <p>Vergi: {formatMoney(totals.taxKurus, state.settings.currency)}</p>
            <p><strong>Genel toplam: {formatMoney(totals.totalKurus, state.settings.currency)}</strong></p>
          </div>
        ) : <p className="tos-error">{totals.error}</p>}
        <div className="tos-toolbar" style={{ marginTop: 8 }}>
          <span className="tos-hint">Satır iskontosu</span>
          {items.map((item) => (
            <input
              key={`${item.id}-discount`}
              className="tos-input"
              style={{ width: 140 }}
              aria-label={`${item.code} satır iskontosu`}
              placeholder={`${item.code} %`}
              defaultValue={String((item.discountBps || 0) / 100).replace(".", ",")}
              onBlur={(event) => {
                const parsed = parsePercentToBps(event.target.value || "0");
                if (parsed == null || parsed > 10000) {
                  toast("Satır iskontosu geçersiz", "danger");
                  return;
                }
                patchItem(item.id, { discountBps: parsed });
              }}
            />
          ))}
        </div>
      </section>
      <Modal open={customerOpen} title="Yeni müşteri" onClose={() => setCustomerOpen(false)}>
        <TextField label="Ad" value={customerForm.name} onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} />
        <TextField label="İlgili kişi" value={customerForm.contactName} onChange={(event) => setCustomerForm({ ...customerForm, contactName: event.target.value })} />
        <TextField label="E-posta" value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} error={emailOrEmpty(customerForm.email)} />
        <TextField label="Telefon" value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} />
        <Button variant="primary" onClick={() => {
          if (emailOrEmpty(customerForm.email)) return;
          const result = saveCustomer(customerForm);
          if (!result.ok) { toast(result.error, "danger"); return; }
          setCustomerId(result.id);
          setCustomerOpen(false);
          setCustomerForm({ name: "", contactName: "", email: "", phone: "" });
          mark();
          toast("Müşteri eklendi", "success");
        }}>Kaydet</Button>
      </Modal>
      <Modal wide open={Boolean(pdfBytes)} title="PDF önizleme" onClose={() => setPdfBytes(null)}>
        <PdfPreview data={pdfBytes} />
      </Modal>
    </>
  );
}
