import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { blankProduct } from "../data/seed.js";
import { useStore } from "../data/StoreContext.jsx";
import { PRODUCT_TYPES, typeLabel } from "../domain/labels.js";
import { canSeeCosts, canWrite } from "../domain/permissions.js";
import { METHODS } from "../domain/pricing.js";
import { useDirty } from "../layout/Dirty.jsx";
import { readImageFile } from "../services/images.js";
import { Button, EmptyState, MoneyField, PageHeader, PercentField, SelectField, TextArea, TextField, useToast } from "../ui/ui.jsx";

export default function ProductEditorPage() {
  const { id } = useParams();
  const { state, saveProduct } = useStore();
  const dirty = useDirty();
  const toast = useToast();
  const existing = state.products.find((product) => product.id === id);
  const writable = canWrite(state.settings.demoRole);
  const seeCosts = canSeeCosts(state.settings.demoRole);
  const [form, setForm] = useState(blankProduct);
  const [error, setError] = useState("");

  useEffect(() => {
    const product = id ? state.products.find((item) => item.id === id) : null;
    setForm(product ? {
      ...product,
      attributes: product.attributes?.length ? product.attributes : [{ key: "", value: "" }],
      measures: product.measures || blankProduct().measures,
    } : blankProduct());
    dirty.setDirty(false);
    // Yalnızca açılan kayıt değişince formu doldur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    dirty.setDirty(true);
  };

  if (!writable) return <EmptyState title="Salt okunur" body="Bu demo rolü ürün kaydedemez." />;
  if (id && !existing) return <EmptyState title="Ürün bulunamadı" body="Katalogda bu kayıt yok." />;

  const rule = state.pricingRules.find((item) => item.id === form.pricingRuleId);
  const save = () => {
    const result = saveProduct(form);
    if (!result.ok) {
      setError(result.error);
      toast(result.error, "danger");
      return;
    }
    toast("Ürün kaydedildi", "success");
    dirty.releaseAndGo("/buse/urunler");
  };

  return (
    <>
      <PageHeader
        title={existing ? form.name || "Ürün" : "Yeni ürün"}
        description={existing ? form.code : "Tür seçimine göre alanlar değişir."}
        actions={<Button variant="primary" onClick={save}>Kaydet</Button>}
      />
      {error ? <p className="tos-error" role="alert">{error}</p> : null}
      <section className="tos-card tos-card-pad">
        <div className="tos-form-grid">
          <TextField label="Ürün kodu" required value={form.code} onChange={(event) => set({ code: event.target.value })} />
          <TextField label="Ürün adı" value={form.name} onChange={(event) => set({ name: event.target.value })} />
          <SelectField label="Tür" value={form.type} onChange={(event) => set({ type: event.target.value })}>
            {PRODUCT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </SelectField>
          <SelectField label="Durum" value={form.active ? "1" : "0"} onChange={(event) => set({ active: event.target.value === "1" })}>
            <option value="1">Aktif</option>
            <option value="0">Pasif</option>
          </SelectField>
          <SelectField label="Marka" value={form.brandId} onChange={(event) => set({ brandId: event.target.value })}>
            <option value="">Yok</option>
            {state.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </SelectField>
          <SelectField label="Kategori" value={form.categoryId} onChange={(event) => set({ categoryId: event.target.value })}>
            <option value="">Yok</option>
            {state.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </SelectField>
          <div className="tos-span-2">
            <TextArea label="Açıklama" value={form.description} onChange={(event) => set({ description: event.target.value })} />
          </div>
        </div>
      </section>
      <section className="tos-card tos-card-pad">
        <h2>Görsel</h2>
        <div className="tos-toolbar" style={{ marginTop: 12 }}>
          {form.imageDataUrl ? <img alt="" src={form.imageDataUrl} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12 }} /> : <span className="tos-avatar" style={{ width: 96, height: 96 }}>{(form.name || "?").slice(0, 1)}</span>}
          <label className="tos-btn tos-btn-secondary">
            Görsel seç
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                try {
                  set({ imageDataUrl: await readImageFile(file) });
                } catch (imageError) {
                  toast(imageError.message, "danger");
                }
              }}
            />
          </label>
          {form.imageDataUrl ? <Button onClick={() => set({ imageDataUrl: "" })}>Görseli kaldır</Button> : null}
        </div>
      </section>
      {form.type === "manufacturing" ? (
        <section className="tos-card tos-card-pad">
          <h2>Varsayılan ölçüler</h2>
          <p className="tos-hint">Teklif satırında değiştirilebilir. Alan formülü yalnızca örnek kural seçildiyse çalışır.</p>
          <div className="tos-form-grid" style={{ marginTop: 12 }}>
            <TextField label="En (mm)" inputMode="numeric" value={form.measures.widthMm} onChange={(event) => set({ measures: { ...form.measures, widthMm: event.target.value } })} />
            <TextField label="Boy (mm)" inputMode="numeric" value={form.measures.heightMm} onChange={(event) => set({ measures: { ...form.measures, heightMm: event.target.value } })} />
            <TextField label="Derinlik (mm)" inputMode="numeric" value={form.measures.depthMm} onChange={(event) => set({ measures: { ...form.measures, depthMm: event.target.value } })} />
          </div>
        </section>
      ) : null}
      <section className="tos-card tos-card-pad">
        <h2>Teknik özellikler</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {form.attributes.map((attr, index) => (
            <div className="tos-toolbar" key={`${index}-${attr.key}`}>
              <input className="tos-input" aria-label="Özellik adı" placeholder="Özellik" value={attr.key} onChange={(event) => {
                const attributes = form.attributes.slice();
                attributes[index] = { ...attr, key: event.target.value };
                set({ attributes });
              }} />
              <input className="tos-input" aria-label="Özellik değeri" placeholder="Değer" value={attr.value} onChange={(event) => {
                const attributes = form.attributes.slice();
                attributes[index] = { ...attr, value: event.target.value };
                set({ attributes });
              }} />
              <Button onClick={() => set({ attributes: form.attributes.filter((_, itemIndex) => itemIndex !== index) })}>Sil</Button>
            </div>
          ))}
          <Button onClick={() => set({ attributes: [...form.attributes, { key: "", value: "" }] })}>Özellik ekle</Button>
        </div>
      </section>
      <section className="tos-card tos-card-pad">
        <h2>Fiyat</h2>
        <p className="tos-hint" style={{ margin: "8px 0 12px" }}>
          {form.type === "catalog" && "Katalog: liste fiyatı ve iskonto kuralı."}
          {form.type === "manufacturing" && " İmalat: birim fiyat. Örnek alan kuralı doğrulanmış formül değildir."}
          {form.type === "external" && " Dış ürün: alış fiyatı, tedarikçi iskontosu ve kâr yöntemi."}
        </p>
        <div className="tos-form-grid">
          {form.type !== "external" ? (
            <MoneyField
              label={form.type === "manufacturing" ? "Birim / m² fiyatı" : "Liste fiyatı"}
              kurus={form.listPriceKurus}
              onValue={(listPriceKurus) => set({ listPriceKurus })}
            />
          ) : null}
          {seeCosts ? (
            <MoneyField label="Alış maliyeti" kurus={form.costKurus} onValue={(costKurus) => set({ costKurus })} />
          ) : <p className="tos-note">Alış maliyeti bu demo rolünde gizli.</p>}
          {seeCosts && form.type === "external" ? (
            <PercentField label="Tedarikçi iskontosu" bps={form.supplierDiscountBps} onValue={(supplierDiscountBps) => set({ supplierDiscountBps })} />
          ) : null}
          {form.type === "external" ? (
            <SelectField label="Tedarikçi" value={form.supplierId} onChange={(event) => set({ supplierId: event.target.value })}>
              <option value="">Yok</option>
              {state.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </SelectField>
          ) : null}
          <SelectField label="Fiyat kuralı" value={form.pricingRuleId} onChange={(event) => set({ pricingRuleId: event.target.value })}>
            <option value="">Otomatik (türe göre)</option>
            {state.pricingRules.filter((item) => item.productType === "all" || item.productType === form.type).map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </SelectField>
        </div>
        {rule ? (
          <p className="tos-note" style={{ marginTop: 12 }}>
            {METHODS[rule.method]?.label}: {METHODS[rule.method]?.formula}
            {rule.exampleOnly ? " Bu kural örnektir." : ""}
          </p>
        ) : null}
        <p className="tos-hint" style={{ marginTop: 8 }}>Seçili tür: {typeLabel(form.type)}. Tutarlar Türkçe biçimde girilir.</p>
      </section>
    </>
  );
}
