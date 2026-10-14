import { useState } from "react";
import { useStore } from "../data/StoreContext.jsx";
import { formatPercent } from "../domain/money.js";
import { canWrite } from "../domain/permissions.js";
import { emailOrEmpty } from "../domain/validation.js";
import { Badge, Button, EmptyState, Modal, PageHeader, PercentField, TextArea, TextField, useConfirm, useToast } from "../ui/ui.jsx";

const emptyBrand = { name: "", email: "", phone: "", notes: "", defaultDiscountBps: 0, active: true };
const emptyCategory = { name: "", active: true };

export default function BrandsPage() {
  const { state, saveBrand, saveCategory, deleteBrand, deleteCategory, setRecordActive } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const writable = canWrite(state.settings.demoRole);
  const [tab, setTab] = useState("brands");
  const [brand, setBrand] = useState(null);
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState("");

  const brands = state.brands.filter((item) => item.name.toLocaleLowerCase("tr-TR").includes(query.trim().toLocaleLowerCase("tr-TR")));
  const categories = state.categories.filter((item) => item.name.toLocaleLowerCase("tr-TR").includes(query.trim().toLocaleLowerCase("tr-TR")));

  return (
    <>
      <PageHeader
        title="Markalar"
        description="Marka ve kategori kayıtları. Ürün sayısı bağlı katalogdan gelir."
        actions={tab === "brands"
          ? <Button variant="primary" disabled={!writable} onClick={() => setBrand(emptyBrand)}>Marka ekle</Button>
          : <Button variant="primary" disabled={!writable} onClick={() => setCategory(emptyCategory)}>Kategori ekle</Button>}
      />
      <div className="tos-toolbar">
        <Button variant={tab === "brands" ? "primary" : "secondary"} onClick={() => setTab("brands")}>Markalar</Button>
        <Button variant={tab === "categories" ? "primary" : "secondary"} onClick={() => setTab("categories")}>Kategoriler</Button>
        <input className="tos-input" aria-label="Ara" placeholder="Ara" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <section className="tos-card">
        {tab === "brands" && brands.length === 0 ? <EmptyState title={query ? "Sonuç bulunamadı" : "Marka yok"} body={query ? "Aramayla eşleşen marka yok." : "İlk markayı ekleyin."} /> : null}
        {tab === "categories" && categories.length === 0 ? <EmptyState title={query ? "Sonuç bulunamadı" : "Kategori yok"} body={query ? "Aramayla eşleşen kategori yok." : "İlk kategoriyi ekleyin."} /> : null}
        {tab === "brands" && brands.length > 0 ? (
          <table className="tos-table">
            <thead><tr><th>Marka</th><th className="tos-hide-sm">İletişim</th><th>Ürün</th><th>İskonto</th><th>Durum</th><th /></tr></thead>
            <tbody>
              {brands.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className="tos-hide-sm">{[item.email, item.phone].filter(Boolean).join(" · ") || "—"}</td>
                  <td>{state.products.filter((product) => product.brandId === item.id).length}</td>
                  <td>{formatPercent(item.defaultDiscountBps || 0)}</td>
                  <td>{item.active ? <Badge tone="success">Aktif</Badge> : <Badge>Pasif</Badge>}</td>
                  <td className="tos-page-actions">
                    <Button disabled={!writable} onClick={() => setBrand(item)}>Düzenle</Button>
                    <Button disabled={!writable} onClick={() => { const result = setRecordActive("brands", item.id, !item.active); toast(result.ok ? "Durum güncellendi" : result.error, result.ok ? "success" : "danger"); }}>{item.active ? "Pasif" : "Aktif"}</Button>
                    <Button disabled={!writable} onClick={async () => {
                      const ok = await confirm({ title: "Markayı sil", body: "Bağlı ürün varsa silinmez.", danger: true, confirmLabel: "Sil" });
                      if (!ok) return;
                      const result = deleteBrand(item.id);
                      toast(result.ok ? "Silindi" : result.error, result.ok ? "success" : "danger");
                    }}>Sil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {tab === "categories" && categories.length > 0 ? (
          <table className="tos-table">
            <thead><tr><th>Kategori</th><th>Ürün</th><th>Durum</th><th /></tr></thead>
            <tbody>
              {categories.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{state.products.filter((product) => product.categoryId === item.id).length}</td>
                  <td>{item.active !== false ? <Badge tone="success">Aktif</Badge> : <Badge>Pasif</Badge>}</td>
                  <td className="tos-page-actions">
                    <Button disabled={!writable} onClick={() => setCategory(item)}>Düzenle</Button>
                    <Button disabled={!writable} onClick={async () => {
                      const ok = await confirm({ title: "Kategoriyi sil", body: "Bağlı ürün varsa silinmez.", danger: true, confirmLabel: "Sil" });
                      if (!ok) return;
                      const result = deleteCategory(item.id);
                      toast(result.ok ? "Silindi" : result.error, result.ok ? "success" : "danger");
                    }}>Sil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
      <Modal open={Boolean(brand)} title={brand?.id ? "Markayı düzenle" : "Yeni marka"} onClose={() => setBrand(null)}>
        {brand ? (
          <>
            <TextField label="Ad" value={brand.name} onChange={(event) => setBrand({ ...brand, name: event.target.value })} />
            <TextField label="E-posta" value={brand.email || ""} error={emailOrEmpty(brand.email)} onChange={(event) => setBrand({ ...brand, email: event.target.value })} />
            <TextField label="Telefon" value={brand.phone || ""} onChange={(event) => setBrand({ ...brand, phone: event.target.value })} />
            <PercentField label="Varsayılan iskonto" bps={brand.defaultDiscountBps || 0} onValue={(defaultDiscountBps) => setBrand({ ...brand, defaultDiscountBps })} />
            <TextArea label="Not" value={brand.notes || ""} onChange={(event) => setBrand({ ...brand, notes: event.target.value })} />
            <Button variant="primary" onClick={() => {
              if (emailOrEmpty(brand.email)) return;
              const result = saveBrand(brand);
              if (!result.ok) { toast(result.error, "danger"); return; }
              toast("Marka kaydedildi", "success");
              setBrand(null);
            }}>Kaydet</Button>
          </>
        ) : null}
      </Modal>
      <Modal open={Boolean(category)} title={category?.id ? "Kategoriyi düzenle" : "Yeni kategori"} onClose={() => setCategory(null)}>
        {category ? (
          <>
            <TextField label="Ad" value={category.name} onChange={(event) => setCategory({ ...category, name: event.target.value })} />
            <Button variant="primary" onClick={() => {
              const result = saveCategory(category);
              if (!result.ok) { toast(result.error, "danger"); return; }
              toast("Kategori kaydedildi", "success");
              setCategory(null);
            }}>Kaydet</Button>
          </>
        ) : null}
      </Modal>
    </>
  );
}
